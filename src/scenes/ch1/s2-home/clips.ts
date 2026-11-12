// Scene 2 cutscenes, each as a pure function of time: state(t) says where
// everyone is at second t, and nothing else. Every clip starts and ends on one
// of the live states in layout.ts, with exactly the poses its sprites are
// painted in, so live play and video meet without a jump. RENDER only.
//   arrive   fade in on the house; Mitu walks out of the door to Amma
//   kick     a soft thud: a ripple on Amma's belly, she gasps and lays her hand there
//   touch    Mitu steps over, kneels, puts her hand on the belly; the kick: light, startle
//   paanbox  Dadi chuckles, pulls her paan box round and pats it; Mitu goes and sits by her
//   handout  Dadi reaches behind her for the lantern and holds it out
//   take     Mitu takes it and sets it down by the bottle
//   leave    Mitu picks the lantern up and walks off along the walkway to the ghat; fade
import { clamp01, lerp, smooth } from "../../../shared/math";
import { localToScreen } from "../../../shared/depth";
import { paintAmma, paintDadi, paintMitu, spriteJobs } from "./paint";
import { dadiSkeleton, mituSkeleton } from "./poses";
import { AMMA_POSE, DADI_POSE, MITU_POSE, PROP, S2, STATES, bellyPoint, floorY, heldBy, s2Frame } from "./layout";
import type { ClipDef, DadiPose, FrameState, LightRing, MituFloorPose, Point, PropPlace, S2ClipLook, SpriteArt } from "../../../types";

const STRIDE = { SLOW: 1.1, LEAVE: 0.8 };     // seconds per stride (two steps)
const RING = { KICK: 70, FELT: 230 };         // px: the first, small ripple; the kick Mitu feels
const LEAVE_FADE = 2.4;                        // seconds of fade at the end of `leave`
const Z_CARRIED = 0.65;

// 0..1 between times a and b, eased at both ends
function span(t: number, a: number, b: number): number {
    return smooth(clamp01((t - a) / (b - a)));
}

// rises from 0 at a to 1 at b, falls back to 0 at c
function bump(t: number, a: number, b: number, c: number): number {
    return t < b ? span(t, a, b) : 1 - span(t, b, c);
}

// 0..1 through the current stride while walking between a and b, else 0
function walkPhase(t: number, a: number, b: number, stride: number): number {
    return t > a && t < b ? ((t - a) / stride) % 1 : 0;
}

function lerpPoint(a: Point, b: Point, u: number): Point {
    return [lerp(a[0], b[0], u), lerp(a[1], b[1], u)];
}

// Dadi's own coordinates (she faces left) <-> the screen
function dadiLocal([x, y]: Point): Point {
    return [(x - S2.DADI.x) * S2.DADI.sx, y - S2.FLOOR_Y];
}

function dadiHand(pose: DadiPose): Point {
    return localToScreen(dadiSkeleton(pose).wrist, S2.DADI.x, S2.FLOOR_Y, 1, S2.DADI.sx);
}

function mituHand(pose: MituFloorPose, x: number, y: number): Point {
    const [hx, hy] = mituSkeleton(pose).handF;
    return [x + hx * S2.MITU_SX, y + hy];
}

// where Mitu's hand rests in a pose (no reach), measured from her anchor
function restingHand(pose: MituFloorPose): Point {
    return mituSkeleton({ ...pose, reach: null }).handF;
}

const DADI_REST = DADI_POSE.dadi_rest;
const REST_WRIST = dadiSkeleton(DADI_REST).wrist;
const STAND = MITU_POSE.mitu_stand, KNEEL = MITU_POSE.mitu_kneel, SIT = MITU_POSE.mitu_sit;
const handleOf = (x: number): Point => [x, S2.FLOOR_Y - S2.LANTERN_HANDLE];

// a look that shows a live state, to be changed by each clip
function base(stateName: string, t: number): S2ClipLook {
    const s = STATES[stateName];
    return {
        t, fade: 0, ring: null, mituX: s.mituX, mituY: S2.FLOOR_Y, box: s.box, lantern: s.lantern, bottle: s.bottle,
        mitu: MITU_POSE[s.mitu], amma: AMMA_POSE[s.amma], dadi: DADI_POSE[s.dadi],
    };
}

function ring(t: number, start: number, seconds: number, radius: number): LightRing | null {
    const u = (t - start) / seconds;
    if (u <= 0 || u >= 1) return null;
    const [x, y] = bellyPoint();
    return { x, y, radius, u };
}

export const CLIPS: Record<string, ClipDef<S2ClipLook>> = {
    arrive: {
        duration: S2.CLIP.arrive,
        state(t) {
            const look = base("arrived", t);
            const T0 = 0.8, T1 = 5.2;              // four strides, as soon as the picture is up
            look.fade = t < S2.FADE ? 1 - t / S2.FADE : 0;
            look.mituX = lerp(S2.MITU_DOOR, S2.MITU_REST, (t - T0) / (T1 - T0));
            look.mitu = { ...STAND, walk: walkPhase(t, T0, T1, STRIDE.SLOW) };
            return look;
        },
    },

    kick: {
        duration: S2.CLIP.kick,
        state(t) {
            const look = base("arrived", t);
            look.amma = { hand: span(t, 0.8, 2.0), gasp: bump(t, 0.6, 1.0, 2.2) };
            look.ring = ring(t, 0.5, 1.0, RING.KICK);
            return look;
        },
    },

    touch: {
        duration: S2.CLIP.touch,
        state(t) {
            const look = base("kicked", t);
            look.mituX = lerp(S2.MITU_REST, S2.MITU_KNEEL, t / STRIDE.SLOW);
            const low = span(t, 1.1, 2.0);
            const startle = 0.18 * bump(t, 3.6, 3.8, 4.6);
            const pose: MituFloorPose = { ...STAND, walk: walkPhase(t, 0, STRIDE.SLOW, STRIDE.SLOW), low, lean: (KNEEL.lean * low) - startle };
            const reach = span(t, 2.0, 2.8);
            // safe: the kneeling pose always has a reach (her hand on the belly)
            pose.reach = reach > 0 ? lerpPoint(restingHand(pose), KNEEL.reach!, reach) : null;
            look.mitu = t >= S2.CLIP.touch ? KNEEL : pose;
            look.amma = { hand: 1, gasp: 0.4 * bump(t, 3.6, 3.9, 4.6) };
            look.ring = ring(t, 3.6, 1.6, RING.FELT);
            return look;
        },
    },

    paanbox: {
        duration: S2.CLIP.paanbox,
        state(t) {
            const look = base("touching", t);
            // Mitu lets go, stands, walks over to Dadi and sits
            const kneelRest = restingHand(KNEEL);
            if (t < 1.0) look.mitu = { ...KNEEL, reach: lerpPoint(KNEEL.reach!, kneelRest, span(t, 0.6, 1.0)) };
            else if (t < 2.0) look.mitu = { ...STAND, low: 1 - span(t, 1.0, 2.0), lean: KNEEL.lean * (1 - span(t, 1.0, 2.0)) };
            else look.mitu = { ...STAND, walk: walkPhase(t, 2.0, 4.2, STRIDE.SLOW), sit: span(t, 4.4, 5.6) };
            look.mituX = lerp(S2.MITU_KNEEL, S2.MITU_SIT, (t - 2.0) / 2.2);

            // Dadi chuckles, reaches behind her, brings the box round, pats it twice
            const chuckle = t < 1.6 ? Math.abs(Math.sin((Math.PI * t) / 0.4)) * (1 - t / 1.6) : 0;
            const back = dadiLocal([S2.BOX_BACK, S2.FLOOR_Y - S2.BOX_TOP]), front = dadiLocal([S2.BOX_FRONT, S2.FLOOR_Y - S2.BOX_TOP]);
            let reach: Point | null = null, lean = 0;
            if (t >= 1.6 && t < 2.4) { lean = -0.35 * span(t, 1.6, 2.2); reach = lerpPoint(REST_WRIST, back, span(t, 1.6, 2.2)); }
            else if (t >= 2.4 && t < 3.6) {
                const u = span(t, 2.4, 3.6);
                lean = lerp(-0.35, 0.3, u);
                reach = lerpPoint(back, front, u);
                reach[1] -= 20 * Math.sin(Math.PI * u);          // lifted over, not dragged
            }
            else if (t >= 3.6 && t < 4.4) { lean = 0.3; reach = [front[0], front[1] - 6 * Math.abs(Math.sin((2 * Math.PI * (t - 3.6)) / 0.4))]; }
            else if (t >= 4.4 && t < 5.0) { lean = 0.3 * (1 - span(t, 4.4, 5.0)); reach = lerpPoint(front, REST_WRIST, span(t, 4.4, 5.0)); }
            look.dadi = { chuckle, reach, lean };
            if (t >= 2.4 && t < 3.6) {
                const [hx, hy] = dadiHand(look.dadi);
                look.box = { x: hx, y: hy + S2.BOX_TOP, z: look.box.z };
            }
            else if (t >= 3.6) look.box = STATES.byDadi.box;
            return look;
        },
    },

    handout: {
        duration: S2.CLIP.handout,
        state(t) {
            const look = base("afterPaan", t);
            const handle = dadiLocal(handleOf(S2.LANTERN_BACK)), hold = DADI_POSE.dadi_hold;
            if (t < 1.0) look.dadi = { chuckle: 0, lean: -0.45 * span(t, 0, 1.0), reach: lerpPoint(REST_WRIST, handle, span(t, 0, 1.0)) };
            else {
                const u = span(t, 1.0, 2.6);
                // safe: the holding pose always has a reach
                const reach = lerpPoint(handle, hold.reach!, u);
                reach[1] -= 18 * Math.sin(Math.PI * u);
                look.dadi = t >= S2.CLIP.handout ? hold : { chuckle: 0, lean: lerp(-0.45, hold.lean, u), reach };
                look.lantern = heldBy(dadiHand(look.dadi), Z_CARRIED);
            }
            return look;
        },
    },

    take: {
        duration: S2.CLIP.take,
        state(t) {
            const look = base("holding", t);
            const hold = DADI_POSE.dadi_hold;
            const meetMitu: Point = [S2.MEET[0] - S2.MITU_SIT, S2.MEET[1] - S2.FLOOR_Y];
            const downMitu: Point = [S2.LANTERN_DOWN - S2.MITU_SIT, S2.FLOOR_Y - S2.LANTERN_HANDLE - S2.FLOOR_Y];
            // Mitu rises to her knees, leans and reaches; takes it; sets it down; sits back
            const up = span(t, 0, 1.0), back = span(t, 2.2, 3.2);
            const kneeling = up * (1 - back);
            const pose: MituFloorPose = { ...SIT, sit: 1 - kneeling, low: kneeling, lean: 0.3 * kneeling };
            if (t < 1.2) pose.reach = lerpPoint(restingHand(pose), meetMitu, span(t, 0.3, 1.0));
            else if (t < 2.2) pose.reach = lerpPoint(meetMitu, downMitu, span(t, 1.2, 2.2));
            else pose.reach = lerpPoint(downMitu, restingHand(pose), span(t, 2.2, 2.8));
            look.mitu = t >= S2.CLIP.take ? SIT : pose;

            // Dadi lowers it to meet Mitu's hand, lets go, and rests
            if (t < 1.2) look.dadi = { chuckle: 0, lean: hold.lean, reach: lerpPoint(hold.reach!, dadiLocal(S2.MEET), span(t, 0.4, 1.2)) };
            else if (t < 2.0) look.dadi = { chuckle: 0, lean: hold.lean * (1 - span(t, 1.2, 2.0)), reach: lerpPoint(dadiLocal(S2.MEET), REST_WRIST, span(t, 1.2, 2.0)) };
            else look.dadi = DADI_REST;

            let lantern: PropPlace;
            if (t < 1.2) lantern = heldBy(dadiHand(look.dadi), Z_CARRIED);
            else if (t < 2.2) lantern = heldBy(mituHand(pose, S2.MITU_SIT, S2.FLOOR_Y), Z_CARRIED);
            else lantern = STATES.ready.lantern;
            look.lantern = lantern;
            return look;
        },
    },

    leave: {
        duration: S2.CLIP.leave,
        state(t) {
            const look = base("ready", t);
            const handle: Point = [S2.LANTERN_DOWN - S2.MITU_SIT, -S2.LANTERN_HANDLE];
            const carried = restingHand({ ...STAND, carry: true });
            let pose: MituFloorPose;
            if (t < 0.8) pose = { ...SIT, lean: 0.45 * span(t, 0, 0.8), reach: lerpPoint(restingHand(SIT), handle, span(t, 0, 0.8)) };
            else if (t < 2.0) {
                const u = span(t, 0.8, 2.0);
                pose = { ...SIT, sit: 1 - u, lean: 0.45 * (1 - u), reach: lerpPoint(handle, carried, u) };
            }
            else pose = { ...STAND, carry: true, walk: walkPhase(t, 2.2, 12.2, STRIDE.LEAVE) };
            look.mitu = pose;
            look.mituX = lerp(S2.MITU_SIT, S2.MITU_GONE, (t - 2.2) / 10);
            look.mituY = floorY(look.mituX);
            if (t >= 0.8) look.lantern = heldBy(mituHand(pose, look.mituX, look.mituY), Z_CARRIED);
            look.fade = t > S2.CLIP.leave - LEAVE_FADE ? (t - (S2.CLIP.leave - LEAVE_FADE)) / LEAVE_FADE : 0;
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

// numbers rounded, so tiny differences reuse a painted pose
function poseKey(kind: string, pose: object): string {
    return kind + JSON.stringify(pose, (_k, v) => (typeof v === "number" ? Math.round(v * 500) / 500 : v));
}

// the props never change shape, so each is painted once
let props: Record<string, SpriteArt> | null = null;
function propArt(): Record<string, SpriteArt> {
    if (props) return props;
    props = {};
    const names: string[] = Object.values(PROP);
    for (const job of spriteJobs()) if (names.includes(job.name)) props[job.name] = job.paint();
    return props;
}

// the frame of a clip at time t, with freshly painted poses
export function clipFrame(clip: string, t: number): FrameState {
    const look = CLIPS[clip].state(t);
    const props = propArt();
    return s2Frame(look, look.dadi, {
        mitu: cached(poseKey("m", look.mitu), () => paintMitu(look.mitu)),
        amma: cached(poseKey("a", look.amma), () => paintAmma(look.amma)),
        dadi: cached(poseKey("d", look.dadi), () => paintDadi(look.dadi)),
        box: props[PROP.BOX],
        lantern: props[PROP.LANTERN],
        bottle: props[PROP.BOTTLE],
    });
}

