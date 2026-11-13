// Scene 4 cutscenes, each as a pure function of time: state(t) says where
// everything is at second t, and nothing else. RENDER only.
//   meet    Mitu rows in from the left and stops just past Rahim, who heaves at his net
//   grab    she lays the oar down, steps to the stern's edge, turns to the net and
//           takes its line in a hauling stance, like Rahim's
//   fish    they heave the net out of the water with a big aair thrashing in it; Rahim laughs
//   look    the empty net goes back in the water; Rahim straightens and looks at the
//           sky; Mitu lets go, steps back and takes up her oar
//   leave   her boat swings round to face home (D21) and she rows out past the left edge
// None of them fades: the game's curtain fades the scene in and out, so what
// lies in her boat (drawn live on top) fades with it.
import { bob, depthScale, depthY, localToScreen } from "../../../shared/depth";
import { clamp01, lerp, smooth } from "../../../shared/math";
import { JOURNEY, MITU_BOAT, OAR_LYING, oarBetween, oarGeometry } from "../../../shared/mituBoat";
import { FISH } from "../../../shared/fish";
import { defaultFlags } from "../../../shared/flags";
import { rowAway, rowPitch, rowPose, rowRings, surged, wakeRings } from "../../../render/rowing";
import paintMitu from "../../../render/paintMitu";
import { mituSkeleton } from "../s2-home/poses";
import { paintGirl, paintLanternAlone } from "../s3-rowing/paint";
import { paintBoatEndOn, paintRahim } from "./paint";
import { paintNet } from "./paintCatch";
import { RAHIM_POSE, S4, girlInBoat, girlScale, haulPose, haulingGirl, hauling, rahimPhase, s4Frame } from "./layout";
import type { BoatParts, ClipDef, FrameSprite, FrameState, GirlOnFoot, MituFloorPose, OarShape, Point, Ring, S4ClipLook, SpriteArt } from "../../../types";

const OIL = defaultFlags().lampOil;           // unused in clips: lights are live
const WHOLE: BoatParts = { hull: true, lantern: true, girl: true, oar: null };
const OFF = { LEFT: -340, HOME: -420 };       // beyond the left edge, coming in and going home
const MEET_GLIDE = 6.4;                       // seconds of rowing in before she comes to rest
const LEAVE = { RAMP: 1, ROW_TIME: 7.4 };
const NET_UP = { FROM: S4.NET.LEVELS * S4.NET.LEVEL, AT: [0.3, 3.2] };   // the net coming out, in `fish`
const SPLASHES = [1.2, 2.1, 2.9, 3.8, 4.9];   // seconds: the fish thrashing throws up rings
const HOLD = RAHIM_POSE.rahim_hold;
const STAND: MituFloorPose = { walk: 0, low: 0, sit: 0, lean: 0, reach: null, carry: false };
const BEND = { LOW: 0.6, LEAN: 0.45 };        // bending to the oar lying in the boat
const STRIDE = 0.8;                           // seconds per stride, as in S2 and S3
const END_ON_BELOW = 0.25;                    // narrower than this, her hull is drawn end-on
const SCULL = [1.8, 2.5, 3.2];                // seconds into `leave`: her oar turning the boat
const DEPTH_STEP = 0.01;                      // drawing order: hull, then Mitu, then the lantern

// 0..1 between times a and b, eased at both ends
function span(t: number, [a, b]: number[]): number {
    return smooth(clamp01((t - a) / (b - a)));
}

// starts fast, ends slow
function ease(u: number): number {
    return 1 - Math.pow(1 - clamp01(u), 2.2);
}

function lerpPoint(a: Point, b: Point, u: number): Point {
    return [lerp(a[0], b[0], u), lerp(a[1], b[1], u)];
}

// a point inside Mitu's boat (from its anchor) on screen at time t
function inBoat(p: Point, t: number): Point {
    const scale = depthScale(S4.MITU.z);
    return localToScreen(p, S4.MITU.x, depthY(S4.MITU.z) + bob(t, scale), scale, 1);
}

// a point on screen, measured from her feet the way her skeleton measures
function toLocal(g: GirlOnFoot, [px, py]: Point): Point {
    const k = girlScale();
    return [((px - g.x) / k) * g.sx, (py - g.y) / k];
}

// a still look at the meeting place, for the clips that don't move the boat
function still(t: number): S4ClipLook {
    return {
        t, fade: 0, rings: [],
        mitu: { x: S4.MITU.x, z: S4.MITU.z, sx: S4.HEADING, roll: 0 },
        net: 0, rahimHolds: true, mituPull: null, fish: -1, girl: null, isTurning: false,
        pose: MITU_BOAT.REST, parts: WHOLE, rahim: hauling(rahimPhase(t)),
    };
}

// Mitu on her feet at the stern, facing forward, both hands on the oar (or on their way to it)
function atTheOar(t: number, oar: OarShape, bent: number, hands: number): GirlOnFoot {
    const g = girlInBoat(STAND, MITU_BOAT.GIRL[0], 1, t);
    const hang = mituSkeleton(STAND);
    const grip = toLocal(g, inBoat(oar.hand, t)), gripB = toLocal(g, inBoat(oar.lower, t));
    g.pose = { ...STAND, low: BEND.LOW * bent, lean: BEND.LEAN * bent, reach: lerpPoint(hang.handF, grip, hands), reachB: lerpPoint(hang.handB, gripB, hands) };
    return g;
}

// standing (u = 0) to her hauling stance (u = 1), hands from hanging to the line
function intoStance(u: number): MituFloorPose {
    const haul = haulPose(0), hang = mituSkeleton(STAND);
    return {
        ...STAND, low: haul.low * u, lean: haul.lean * u,
        reach: lerpPoint(hang.handF, haul.reach ?? hang.handF, u),
        reachB: lerpPoint(hang.handB, haul.reachB ?? hang.handB, u),
    };
}

// two heaves with Rahim as the net comes out, then still
function heaves(t: number): number {
    const one = (a: number) => Math.max(0, Math.sin(Math.PI * clamp01((t - a) / 1.3)));
    return Math.min(1, one(0.3) + one(1.8));
}

// rings round the net where the fish throws up water
function splashes(t: number): Ring[] {
    const scale = depthScale(S4.NET.z);
    return SPLASHES.filter((born) => born <= t).map((born, i) => ({ x: S4.NET.x + (i % 2 ? 30 : -24) * scale, y: depthY(S4.NET.z) + 2, born, scale, a0: i * 1.9 }));
}

export const CLIPS: Record<string, ClipDef<S4ClipLook>> = {
    meet: {
        duration: S4.CLIP.meet,
        state(t) {
            const s = S4.MEET_ROW;
            const boatX = (at: number) => lerp(OFF.LEFT, S4.MITU.x, ease(surged(at, s) / MEET_GLIDE));
            const look = still(t);
            look.mitu = { x: boatX(t), z: S4.MITU.z, sx: S4.HEADING, roll: rowPitch(t, s, S4.HEADING) };
            look.pose = rowPose(t, s);
            look.rings = [...rowRings(t, s, S4.MITU.z, S4.HEADING, boatX), ...wakeRings(t, S4.MITU.z, S4.HEADING, boatX)];
            return look;
        },
    },

    grab: {
        duration: S4.CLIP.grab,
        state(t) {
            const look = still(t);
            if (t < 0.15) return look;
            // on her feet from here: the boat without her, the oar where she has it
            const oar = oarBetween(1 - span(t, [0.15, 1]));
            look.parts = { hull: true, lantern: true, girl: false, oar };
            if (t < 1.35) {
                // bend and lay the oar down, straighten up
                const bent = span(t, [0.15, 0.6]) * (1 - span(t, [1, 1.3]));
                look.girl = atTheOar(t, oar, bent, 1 - span(t, [1, 1.3]));
                return look;
            }
            // turn to the net, step to the stern's edge, settle into the stance and take the line
            const step = clamp01((t - 1.4) / 0.5);
            const x = lerp(MITU_BOAT.GIRL[0], S4.HAUL_AT, smooth(step));
            const walk = step > 0 && step < 1 ? ((t - 1.4) / STRIDE) % 1 : 0;
            look.girl = girlInBoat({ ...intoStance(span(t, [2, 3])), walk }, x, -1, t);
            if (t >= 3) look.mituPull = 0;
            return look;
        },
    },

    fish: {
        duration: S4.CLIP.fish,
        state(t) {
            const look = still(t);
            look.parts = { hull: true, lantern: true, girl: false, oar: OAR_LYING };
            look.net = lerp(NET_UP.FROM, S4.NET.UP, span(t, NET_UP.AT));
            look.fish = ((t / FISH.FLAP) % 1 + 1) % 1;
            // Mitu heaves twice with him, the line going taut each time
            const pull = heaves(t);
            look.mituPull = pull;
            look.girl = haulingGirl(pull, t);
            // Rahim heaves it up, then holds it and laughs
            const laugh = span(t, [3.4, 4.2]) * (1 - span(t, [6.2, 7.4]));
            look.rahim = { haul: lerp(0, HOLD.haul, span(t, [0, 1.2])), laugh, look: 0 };
            look.rings = splashes(t);
            return look;
        },
    },

    look: {
        duration: S4.CLIP.look,
        state(t) {
            const look = still(t);
            // the empty net back down into the water; Rahim straightens and looks up
            look.net = lerp(S4.NET.UP, 0, span(t, [0.3, 2]));
            look.rahim = { haul: HOLD.haul, laugh: 0, look: span(t, [0.6, 2.4]) };
            if (t >= 2.75) return look;
            look.parts = { hull: true, lantern: true, girl: false, oar: OAR_LYING };
            if (t < 0.3) {
                look.mituPull = 0;
                look.girl = haulingGirl(0, t);
                return look;
            }
            if (t < 0.9) {
                // she lets go of the line and stands
                look.girl = girlInBoat(intoStance(1 - span(t, [0.3, 0.8])), S4.HAUL_AT, -1, t);
                return look;
            }
            if (t < 1.55) {
                // turns and steps back to her place at the oar
                const step = clamp01((t - 1) / 0.5);
                const walk = step > 0 && step < 1 ? ((t - 1) / STRIDE) % 1 : 0;
                look.girl = girlInBoat({ ...STAND, walk }, lerp(S4.HAUL_AT, MITU_BOAT.GIRL[0], smooth(step)), 1, t);
                return look;
            }
            // bends, takes the oar, lifts it with both hands
            const lift = span(t, [2, 2.7]);
            const oar = oarBetween(lift);
            look.parts = { ...look.parts, oar };
            look.girl = atTheOar(t, oar, span(t, [1.55, 2]) * (1 - lift), span(t, [1.55, 2]));
            return look;
        },
    },

    leave: {
        duration: S4.CLIP.leave,
        state(t) {
            const s = S4.LEAVE_ROW, home = JOURNEY.HOMEWARD;
            const boatX = (at: number) => lerp(S4.MITU.x, OFF.HOME, rowAway(surged(at, s) - s.t0, LEAVE.RAMP, LEAVE.ROW_TIME));
            const look = still(t);
            look.rahim = RAHIM_POSE.rahim_look;
            // the boat swings round, bow towards the camera, until it faces home
            const turn = span(t, S4.TURN);
            look.isTurning = turn > 0 && turn < 1;
            look.mitu = { x: boatX(t), z: S4.MITU.z, sx: Math.cos(Math.PI * turn), roll: rowPitch(t, s, home) };
            look.pose = rowPose(t, s);
            // her oar turning the boat leaves rings by the stern
            const scale = depthScale(S4.MITU.z);
            const scull: Ring[] = SCULL.filter((born) => born <= t).map((born, i) => ({ x: S4.MITU.x + (i - 1) * 30 * scale, y: depthY(S4.MITU.z) + 2, born, scale, a0: i * 2.3 }));
            look.rings = [...scull, ...rowRings(t, s, S4.MITU.z, home, boatX), ...wakeRings(t, S4.MITU.z, home, boatX)];
            return look;
        },
    },
};

// painting a pose is slow and many frames share one, so keep each result
const painted = new Map<string, SpriteArt>();
function cached(key: string, paint: () => SpriteArt): SpriteArt {
    let art = painted.get(key);
    if (!art) {
        art = paint();
        painted.set(key, art);
    }
    return art;
}

function partsKey(p: BoatParts): string {
    const oar = p.oar ? `${p.oar.a.toFixed(4)} ${p.oar.hand.map((v) => v.toFixed(2)).join(" ")}` : "-";
    return `${Number(p.hull)}${Number(p.lantern)}${Number(p.girl)} ${oar}`;
}

// While the boat turns, the hull narrows (and is drawn end-on in the middle)
// but Mitu and the lantern keep their size, each riding the spot it has on the
// turning boat; she turns to face the other way halfway, as a person does
const GIRL_ONLY: BoatParts = { hull: false, lantern: false, girl: true, oar: null, isOarHidden: true };
const noArt = null as unknown as SpriteArt;   // safe: filled in before each frame is drawn
const turningGirl: FrameSprite = { def: MITU_BOAT.SPRITE, art: noArt, x: 0, z: 0, sx: 1, roll: 0, y: 0 };
const turningLantern: FrameSprite = { def: MITU_BOAT.SPRITE, art: noArt, x: 0, z: 0, sx: 1, roll: 0, y: 0 };
const others: FrameSprite[] = [];

// a part painted alone (it sits at `at` in the boat sprite), kept its own size,
// placed where that spot is on the narrowed boat, facing `facing`
function ride(s: FrameSprite, look: S4ClipLook, at: number, facing: number, depth: number): FrameSprite {
    const m = look.mitu, scale = depthScale(m.z);
    s.x = m.x + at * scale * m.sx - at * scale * facing;
    s.y = depthY(m.z) + bob(look.t, scale);
    s.z = m.z + depth;
    s.scale = scale;
    s.sx = facing;
    s.roll = m.roll;
    return s;
}

// the frame of a clip at time t, with freshly painted poses
export function clipFrame(clip: string, t: number): FrameState {
    const look = CLIPS[clip].state(t);
    others.length = 0;
    let hull: SpriteArt;
    let isEndOn = false;
    if (look.isTurning) {
        isEndOn = Math.abs(look.mitu.sx) < END_ON_BELOW;
        const parts: BoatParts = { hull: true, lantern: false, girl: false, oar: oarGeometry(look.pose) };
        hull = isEndOn ? cached("end on", paintBoatEndOn) : cached(`turning ${look.pose.side} ${look.pose.p.toFixed(4)}`, () => paintMitu(look.pose, parts));
        turningGirl.art = cached("girl alone", () => paintMitu(MITU_BOAT.REST, GIRL_ONLY));
        turningLantern.art = cached("lantern alone", paintLanternAlone);
        others.push(ride(turningGirl, look, MITU_BOAT.GIRL[0], look.mitu.sx >= 0 ? 1 : -1, DEPTH_STEP));
        others.push(ride(turningLantern, look, MITU_BOAT.LANTERN[0], 1, 2 * DEPTH_STEP));
    }
    else hull = cached(`m ${look.pose.side} ${look.pose.p.toFixed(4)} ${partsKey(look.parts)}`, () => paintMitu(look.pose, look.parts));

    const r = look.rahim;
    const rahim = cached(`r ${r.haul.toFixed(4)} ${r.laugh.toFixed(4)} ${r.look.toFixed(4)}`, () => paintRahim(r));
    const fish = look.fish >= 0 ? look.fish : null;
    const net = look.net >= 0 ? cached(`n ${look.net.toFixed(2)} ${fish?.toFixed(4) ?? "-"}`, () => paintNet(look.net, fish)) : null;
    const g = look.girl;
    const girl = g ? cached(`g ${JSON.stringify(g.pose)}`, () => paintGirl(g.pose)) : null;
    const frame = s4Frame(look, { mitu: hull, rahim, net, girl }, r, g, others, OIL);
    // end-on, the hull isn't narrowed or flipped: it is already the view from the bow
    // (s4Frame put the boat's sprite first; composeFrame sorts the list later)
    if (isEndOn) frame.sprites[0].sx = 1;
    return frame;
}
