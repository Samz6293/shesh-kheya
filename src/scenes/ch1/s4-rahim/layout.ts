// Scene 4 (Rahim Chacha): positions, rest poses, Rahim's joints, Mitu's
// hauling stance, the net and the ropes. SHARED: the only file of this scene
// (with S2's poses.ts) that both the renderer and the game import. Changing
// anything here means re-rendering the scene (`npm run render -- s4`) and
// running `npm run check-joins`.
// Mitu arrives outward, left to right, and stops just past Rahim's boat; she
// leaves homeward, right to left, after turning round on screen (D18, D21).
// The net pull happens in this wide shot (D21): the net rises between them.
// For the net Mitu is on her feet (S2's figure, as in S3's boarding), at the
// stern's edge facing the net, hauling like Rahim: knees bent, leaning back.
// The reeds are drawn live over the clips (isFrontLive), because what lies in
// Mitu's boat (live, per player) must sit behind them.
import { bob, depthScale, depthY, localToScreen } from "../../../shared/depth";
import { lerp } from "../../../shared/math";
import { JOURNEY, MITU_BOAT } from "../../../shared/mituBoat";
import { FISH, fishSpriteName } from "../../../shared/fish";
import { MEMORY, memorySpriteName } from "../../../shared/memories";
import { mituSkeleton } from "../s2-home/poses";
import { S2 } from "../s2-home/layout";
import type { BoatAnchor, FrameSprite, FrameState, GirlOnFoot, Join, MituFloorPose, Point, RahimPose, Rope, S4Art, S4Look, S4State, SpriteArt, SpriteDef } from "../../../types";

export const S4 = {
    ID: "s4",
    HEADING: JOURNEY.OUTWARD,                 // as she arrives; `leave` turns her for home
    MITU: { x: 1000, z: 0.55 },               // where she stops, just past Rahim
    RAHIM: { x: 600, z: 0.3 },                // his boat, behind hers, facing the net
    RAHIM_SPRITE: { w: 720, h: 620, ax: 360, ay: 330 } as SpriteDef,
    RAHIM_HULL_HALF: 236,                     // half his hull's length, in sprite pixels
    RAHIM_STANDS: 40,                         // his feet, from his boat's anchor
    RAHIM_LOOP: 2,                            // seconds per heave on the net (divides SYNC)
    RAHIM_FRAMES: 8,                          // sprites the game has for that loop
    // the net in the water between the two boats (px at scale 1, from its own anchor).
    // UP: held just clear of the water, below their hands, so the lines slope down to it
    NET: { x: 760, z: 0.42, HALF: 52, BAG: 62, LEVEL: 10, LEVELS: 5, UP: 64 },
    NET_SPRITE: { w: 240, h: 240, ax: 120, ay: 140 } as SpriteDef,
    FISH_IN_NET: 44,                          // the fish lies this far below the net's top edge (inside the bag)
    HAUL_AT: -176,                            // where Mitu stands to haul: the stern's edge (boat's coordinates)
    HAUL_FRAMES: 4,                           // her heave on the line: sprites the game has
    CLIP: { meet: 8, grab: 4, fish: 8, look: 4, leave: 13 },
    HEAD: { mitu: [-139, -126] as Point },
    SPEAKER_ABOVE: 26,
    ROW_GAP: 0.65,
    MEET_ROW: { t0: 0.3, n: 10 },             // rowing in
    LEAVE_ROW: { t0: 4.2, n: 12 },            // rowing away home, after the turn
    TURN: [1.4, 3.8],                         // seconds into `leave` while the boat swings round
    ROPE: { WIDTH: 1.8, SAG: 16, TAUT: 0.85 },   // px at scale 1; TAUT: how much of the sag a heave takes out
    TIMING_BAR: { X: 960, Y: 950, HALF: 230 },   // the net's timing bar, above the key hint
};

// ---------- Rahim ----------
// 0..1 through his heave on the net
export function rahimPhase(t: number): number {
    return (((t / S4.RAHIM_LOOP) % 1) + 1) % 1;
}

// the still poses the game has a sprite for
export const RAHIM_POSE: Record<string, RahimPose> = {
    rahim_hold: { haul: 0.5, laugh: 0, look: 0 },     // holding the net up out of the water
    rahim_look: { haul: 0, laugh: 0, look: 1 },       // the net let go, looking at the sky
};

// a heave of the loop at phase u
export function hauling(u: number): RahimPose {
    return { haul: u, laugh: 0, look: 0 };
}

// how hard he is heaving right now, 0..1 (his line goes taut with it)
export function rahimHeave(p: RahimPose): number {
    return Math.pow(Math.sin(Math.PI * p.haul), 2) * (1 - p.look);
}

// Rahim's joints, from his boat's anchor (he faces right, towards the net).
// haul: leans back and draws his hands in at the middle of each heave
export function rahimJoints(p: RahimPose): { feet: Point, hip: Point, sh: Point, hd: Point, hands: Point, handsB: Point } {
    const heave = rahimHeave(p);
    const lean = -0.06 - 0.3 * heave - 0.12 * p.laugh - 0.06 * p.look;      // minus: backwards
    const feet: Point = [S4.RAHIM_STANDS, -20];
    const hip: Point = [feet[0] + 46 * Math.sin(lean), feet[1] - 46 * Math.cos(lean)];
    const up = lean * 1.2;
    const sh: Point = [hip[0] + 48 * Math.sin(up), hip[1] - 48 * Math.cos(up)];
    const tilt = up - 0.5 * p.look - 0.4 * p.laugh;
    const hd: Point = [sh[0] + 16 * Math.sin(tilt), sh[1] - 16 * Math.cos(tilt)];
    // on the rope: reaching out, drawn in at the heave; let go: down by his side
    const onRope: Point = [sh[0] + lerp(38, 16, heave), sh[1] + lerp(28, 12, heave)];
    const bySide: Point = [sh[0] + 6, sh[1] + 40];
    const hands: Point = [lerp(onRope[0], bySide[0], p.look), lerp(onRope[1], bySide[1], p.look)];
    return { feet, hip, sh, hd, hands, handsB: [hands[0] - 8, hands[1] + 6] };
}

// ---------- Mitu on her feet ----------
// her hauling stance, p 0..1 through a heave: knees bent, leaning back from
// the net, both hands out on the line at arm's length; at the heave she sinks
// lower, leans further back and draws her hands in
export function haulPose(p: number): MituFloorPose {
    const base: MituFloorPose = { walk: 0, low: 0.45 + 0.15 * p, sit: 0, lean: -0.3 - 0.3 * p, reach: null, carry: false };
    const sh = mituSkeleton(base).shoulder;
    const reach: Point = [sh[0] + lerp(30, 20, p), sh[1] + lerp(18, 22, p)];
    return { ...base, reach, reachB: [reach[0] - 6, reach[1] + 5] };
}

// how much bigger the figure is drawn than its painter's size, in this boat
export function girlScale(): number {
    return MITU_BOAT.ON_FOOT_SCALE * depthScale(S4.MITU.z);
}

// her feet at x (boat's coordinates) in the boat, at clock time t (the boat bobs)
export function girlInBoat(pose: MituFloorPose, x: number, sx: number, t: number): GirlOnFoot {
    const scale = depthScale(S4.MITU.z);
    return {
        pose, sx, isInBoat: true,
        x: S4.MITU.x + x * scale,
        y: depthY(S4.MITU.z) + bob(t, scale) + MITU_BOAT.GIRL[1] * scale,
    };
}

// hauling at the stern's edge, facing the net (left)
export function haulingGirl(p: number, t: number): GirlOnFoot {
    return girlInBoat(haulPose(p), S4.HAUL_AT, -1, t);
}

// a point of her skeleton on screen
export function girlPoint(g: GirlOnFoot, [lx, ly]: Point): Point {
    const k = girlScale();
    return [g.x + lx * k * g.sx, g.y + ly * k];
}

// the heave the game has a sprite for nearest to p
export function haulFrame(p: number): number {
    return Math.round(Math.max(0, Math.min(1, p)) * (S4.HAUL_FRAMES - 1));
}

// ---------- the net ----------
// the net's two top corners on screen when it has come up `lift` px (it bobs with the water)
export function netCorners(lift: number, t: number): [Point, Point] {
    const scale = depthScale(S4.NET.z);
    const y = depthY(S4.NET.z) + bob(t, scale) - lift * scale;
    return [[S4.NET.x - S4.NET.HALF * scale, y], [S4.NET.x + S4.NET.HALF * scale, y]];
}

// where the fish lies in the net (its belly), when the net has come up `lift` px
export function fishInNet(lift: number, t: number): Point {
    return [S4.NET.x, netCorners(lift, t)[0][1] + S4.FISH_IN_NET * depthScale(S4.NET.z)];
}

// the net picture: one per level while pulling, `net_up` once it is out, with
// the fish inside it (its flap) until the player lifts it out
export function netArtName(lift: number, fish: number | null): string {
    if (lift >= S4.NET.UP) return fish === null ? "net_up" : `net_fish_${fish}`;
    return `net_${Math.round(lift / S4.NET.LEVEL)}`;
}

// every sprite the game loads
export function s4SpriteNames(): string[] {
    const names = ["mitu_rest", "mitu_empty", "rahim_hold", "rahim_look", "net_up"];
    for (let i = 0; i < S4.HAUL_FRAMES; i++) names.push(`girl_haul_${i}`);
    for (let i = 0; i < S4.RAHIM_FRAMES; i++) names.push(`rahim_${i}`);
    for (let i = 0; i <= S4.NET.LEVELS; i++) names.push(`net_${i}`);
    for (let i = 0; i < FISH.FRAMES; i++) names.push(`net_fish_${i}`, fishSpriteName(i));
    return [...names, ...MEMORY.IDS.map(memorySpriteName)];
}

// ---------- the frame ----------
// one frame object, reused every frame so the game loop creates no garbage.
// (`null as unknown as SpriteArt` is safe: s4Frame() fills the art in before anyone reads it)
const noArt = null as unknown as SpriteArt;
const mituSprite: FrameSprite = { def: MITU_BOAT.SPRITE, art: noArt, x: 0, z: 0, sx: 1, roll: 0 };
const rahimSprite: FrameSprite = { def: S4.RAHIM_SPRITE, art: noArt, x: S4.RAHIM.x, z: S4.RAHIM.z, sx: 1, roll: 0 };
const netSprite: FrameSprite = { def: S4.NET_SPRITE, art: noArt, x: S4.NET.x, z: S4.NET.z, sx: 1, roll: 0 };
// S2's figure, drawn at her size in this boat; in front of the hull (she is in the boat)
const girlSprite: FrameSprite = { def: S2.MITU_SPRITE, art: noArt, x: 0, z: S4.MITU.z + 0.01, sx: 1, roll: 0, y: 0 };
const boat: BoatAnchor = { x: 0, y: 0, scale: 1, sx: 1, roll: 0 };
const ropes: Rope[] = [
    { a: [0, 0], b: [0, 0], sag: 0, width: 0 },
    { a: [0, 0], b: [0, 0], sag: 0, width: 0 },
];
const frame: FrameState = {
    t: 0, darkness: 0, flash: 0, fade: 0, rings: [], oil: 0, marker: null, glints: [], ring: null,
    boat, sprites: [], ropes: [],
};

// a line from a to b; the harder it is pulled (tension 0..1), the less it sags
function setRope(r: Rope, a: Point, b: Point, scale: number, tension: number): Rope {
    r.a = a;
    r.b = b;
    r.sag = S4.ROPE.SAG * scale * (1 - S4.ROPE.TAUT * tension);
    r.width = S4.ROPE.WIDTH * scale;
    return r;
}

// turn "where things are" into what composeFrame() draws. rahim: his pose,
// for the end of his line; girl: Mitu on her feet (null: she is the boat
// sprite); others: anything else this frame (the fish while it is dragged)
export function s4Frame(look: S4Look, art: S4Art, rahim: RahimPose, girl: GirlOnFoot | null, others: FrameSprite[], oil: number): FrameState {
    const scale = depthScale(look.mitu.z), t = look.t;
    frame.t = t;
    frame.fade = look.fade;
    frame.rings = look.rings;
    frame.oil = oil;

    mituSprite.art = art.mitu;
    mituSprite.x = look.mitu.x;
    mituSprite.z = look.mitu.z;
    mituSprite.sx = look.mitu.sx;
    mituSprite.roll = look.mitu.roll;
    rahimSprite.art = art.rahim;
    // refilled every frame: composeFrame() sorts this list in place
    frame.sprites.length = 0;
    frame.sprites.push(mituSprite, rahimSprite);
    if (art.net && look.net >= 0) {
        netSprite.art = art.net;
        frame.sprites.push(netSprite);
    }
    if (girl && art.girl) {
        girlSprite.art = art.girl;
        girlSprite.x = girl.x;
        girlSprite.y = girl.y;
        girlSprite.sx = girl.sx;
        girlSprite.scale = girlScale();
        frame.sprites.push(girlSprite);
    }
    for (const s of others) frame.sprites.push(s);

    // the lantern glow follows the boat, bob included
    boat.x = look.mitu.x;
    boat.y = depthY(look.mitu.z) + bob(t, scale);
    boat.scale = scale;
    boat.sx = look.mitu.sx;
    boat.roll = look.mitu.roll;

    // the lines: from Rahim's hands to the net's near corner, from Mitu's hands to its far one
    const list = frame.ropes ?? [];
    list.length = 0;
    if (look.net >= 0) {
        const [left, right] = netCorners(look.net, t);
        if (look.rahimHolds) {
            const rs = depthScale(S4.RAHIM.z);
            const hands = localToScreen(rahimJoints(rahim).hands, S4.RAHIM.x, depthY(S4.RAHIM.z) + bob(t, rs), rs, 1);
            list.push(setRope(ropes[0], hands, left, rs, rahimHeave(rahim)));
        }
        if (look.mituPull !== null && girl) {
            const hand = girlPoint(girl, mituSkeleton(girl.pose).handF);
            list.push(setRope(ropes[1], hand, right, scale, look.mituPull));
        }
    }
    frame.ropes = list;
    return frame;
}

// where the light over a speaker's head goes; null = not in view
export function speakerPoint(id: string, look: S4Look, rahim: RahimPose, girl: GirlOnFoot | null): Point | null {
    if (id === "mitu") {
        const scale = depthScale(look.mitu.z);
        if (girl) {
            const [x, y] = girlPoint(girl, mituSkeleton(girl.pose).head);
            return [x, y - S4.SPEAKER_ABOVE * scale];
        }
        const [x, y] = localToScreen(S4.HEAD.mitu, look.mitu.x, depthY(look.mitu.z) + bob(look.t, scale), scale, look.mitu.sx);
        return [x, y - S4.SPEAKER_ABOVE * scale];
    }
    if (id === "rahim") {
        const scale = depthScale(S4.RAHIM.z);
        const [x, y] = localToScreen(rahimJoints(rahim).hd, S4.RAHIM.x, depthY(S4.RAHIM.z) + bob(look.t, scale), scale, 1);
        return [x, y - S4.SPEAKER_ABOVE * scale];
    }
    return null;
}

// ---------- the live states between clips ----------
export const STATES: Record<string, S4State> = {
    arrived: { mitu: "mitu_rest", rahim: null, net: 0, rahimHolds: true, mituPull: null, fish: false },
    holding: { mitu: "mitu_empty", rahim: null, net: 0, rahimHolds: true, mituPull: 0, fish: false },
    pulled: { mitu: "mitu_empty", rahim: null, net: S4.NET.LEVELS * S4.NET.LEVEL, rahimHolds: true, mituPull: 0, fish: false },
    netUp: { mitu: "mitu_empty", rahim: "rahim_hold", net: S4.NET.UP, rahimHolds: true, mituPull: 0, fish: true },
    // the fish is in Mitu's boat now (Cargo draws it there)
    emptyNet: { mitu: "mitu_empty", rahim: "rahim_hold", net: S4.NET.UP, rahimHolds: true, mituPull: 0, fish: false },
    // the empty net back in the water; Rahim keeps its line in his hand while he looks at the sky
    done: { mitu: "mitu_rest", rahim: "rahim_look", net: 0, rahimHolds: true, mituPull: null, fish: false },
};

// Rahim's pose and sprite in a state at clock time t
export function stateRahim(state: S4State, t: number): { pose: RahimPose, name: string } {
    if (state.rahim) return { pose: RAHIM_POSE[state.rahim], name: state.rahim };
    const frameIndex = Math.floor(rahimPhase(t) * S4.RAHIM_FRAMES) % S4.RAHIM_FRAMES;
    return { pose: hauling(frameIndex / S4.RAHIM_FRAMES), name: `rahim_${frameIndex}` };
}

// a live state as a look at clock time t
export function stateLook(state: S4State, t: number, look: S4Look): S4Look {
    look.t = t;
    look.fade = 0;
    look.mitu.x = S4.MITU.x;
    look.mitu.z = S4.MITU.z;
    look.mitu.sx = S4.HEADING;
    look.mitu.roll = 0;
    look.net = state.net;
    look.rahimHolds = state.rahimHolds;
    look.mituPull = state.mituPull;
    return look;
}

// the moments where a clip meets live play; check-joins compares both sides
const join = (clip: string, at: "start" | "end", state: string): Join => ({ clip, at, state, mitu: S4.MITU, darkness: 0 });
export const JOINS: Join[] = [
    join("meet", "end", "arrived"),
    join("grab", "start", "arrived"), join("grab", "end", "holding"),
    join("fish", "start", "pulled"), join("fish", "end", "netUp"),
    join("look", "start", "emptyNet"), join("look", "end", "done"),
    join("leave", "start", "done"),
];

// the game's frame at a join (t = 0). What lies in Mitu's boat is left out:
// it is drawn live over clips and live frames alike, as the memories are
export function s4JoinFrame(j: Join, sprites: Record<string, SpriteArt>, oil: number): FrameState {
    const state = STATES[j.state ?? ""];
    if (!state) throw new Error(`S4 join without a state: ${j.clip} ${j.at}`);
    const look = stateLook(state, 0, { t: 0, fade: 0, rings: [], mitu: { x: 0, z: 0, sx: 1, roll: 0 }, net: 0, rahimHolds: false, mituPull: null });
    const rahim = stateRahim(state, 0);
    const girl = state.mituPull === null ? null : haulingGirl(state.mituPull, 0);
    const art: S4Art = {
        mitu: sprites[state.mitu],
        rahim: sprites[rahim.name],
        net: state.net >= 0 ? sprites[netArtName(state.net, state.fish ? 0 : null)] : null,
        girl: girl ? sprites[`girl_haul_${haulFrame(state.mituPull ?? 0)}`] : null,
    };
    return s4Frame(look, art, rahim.pose, girl, [], oil);
}
