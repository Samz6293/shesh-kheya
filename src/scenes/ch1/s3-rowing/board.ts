// The `board` clip, step by step: Mitu walks out along the jetty with the
// lantern, steps down into the stern, walks up the boat and sets the lantern
// on the bow (it lights), turns, walks back, turns again, and takes up the
// oar. From that frame on she is the ordinary rowing sprite at rest, the pose
// live play starts from. A pure function of time, like every clip. RENDER only.
import { bob, depthY } from "../../../shared/depth";
import { clamp01, lerp, smooth } from "../../../shared/math";
import { MITU_BOAT, OAR_LYING, oarBetween } from "../../../shared/mituBoat";
import { mituSkeleton } from "../s2-home/poses";
import { S3 } from "./layout";
import type { BoatParts, MituFloorPose, Point, S3ClipLook, GirlOnFoot } from "../../../types";

const FIGURE_SCALE = MITU_BOAT.ON_FOOT_SCALE;
const STAND: MituFloorPose = { walk: 0, low: 0, sit: 0, lean: 0, reach: null, carry: false };
const STRIDE = 0.8;                           // seconds per stride (two steps), as in S2's `leave`
const LANTERN_HANDLE = 28;                    // px from the lantern's middle up to its handle

// the moments of the clip, in seconds
const T = {
    WALK_IN: [0.2, 3.3], STEP: [3.3, S3.STEP_IN], TO_BOW: [4.1, 6.3], SET: [6.3, 7.3], LIGHT: [7.3, 8.3],
    RISE: [7.5, 8.2], TURN_BACK: 8.35, BACK: [8.5, 10.7], TURN_ROUND: 10.85, BEND: [10.9, 11.3], LIFT: [11.3, 11.85],
};

// where she stands along the way (screen x)
const X = {
    START: -70,                                                // off the left edge
    JETTY_END: S3.JETTY.X1 - 36,
    STERN: S3.MOORED.x + MITU_BOAT.GIRL[0],                    // her place at the oar
    BOW: S3.MOORED.x + 130,                                    // close enough to reach the bow
    HULL_START: S3.MOORED.x - MITU_BOAT.HULL_HALF,             // past this she is over the boat
};

const OAR_RESTING = OAR_LYING;
const BEND: MituFloorPose = { ...STAND, low: 0.6, lean: 0.45 };

// 0..1 between times a and b, eased at both ends
function span(t: number, [a, b]: number[]): number {
    return smooth(clamp01((t - a) / (b - a)));
}

// 0..1 through the current stride while walking between a and b, else 0
function walkPhase(t: number, [a, b]: number[]): number {
    return t > a && t < b ? ((t - a) / STRIDE) % 1 : 0;
}

function lerpPoint(a: Point, b: Point, u: number): Point {
    return [lerp(a[0], b[0], u), lerp(a[1], b[1], u)];
}

// the boat floor under her feet at the stern (it bobs)
function floorY(t: number): number {
    return depthY(S3.MOORED.z) + bob(t, 1) + MITU_BOAT.GIRL[1];
}

// a point on screen -> the same point measured from her feet, the way her skeleton measures
function toLocal(girl: { x: number, y: number, sx: number }, [px, py]: Point): Point {
    return [((px - girl.x) / FIGURE_SCALE) * girl.sx, (py - girl.y) / FIGURE_SCALE];
}

function toScreen(girl: { x: number, y: number, sx: number }, [lx, ly]: Point): Point {
    return [girl.x + lx * FIGURE_SCALE * girl.sx, girl.y + ly * FIGURE_SCALE];
}

// a point inside the boat (from its anchor) on screen at time t
function inBoat([lx, ly]: Point, t: number): Point {
    return [S3.MOORED.x + lx, depthY(S3.MOORED.z) + bob(t, 1) + ly];
}

export function boardLook(t: number): S3ClipLook {
    const look: S3ClipLook = {
        t, fade: 0, lit: span(t, T.LIGHT), rings: [],
        mitu: { x: S3.MOORED.x, z: S3.MOORED.z, sx: S3.HEADING, roll: 0 },
        pose: MITU_BOAT.REST,
        parts: { hull: true, lantern: t >= T.SET[1], girl: false, oar: OAR_RESTING },
        girl: null,
        lantern: null,
    };
    // the ring where her foot lands
    if (t >= S3.STEP_IN) look.rings = [{ x: X.STERN, y: depthY(S3.MOORED.z) + 2, born: S3.STEP_IN, scale: 1, a0: 1.2 }];

    // she has the oar: from here on she is the rowing sprite at rest
    if (t >= T.LIFT[1]) {
        look.parts = { hull: true, lantern: true, girl: true, oar: null };
        return look;
    }

    const girl: GirlOnFoot = { pose: { ...STAND, carry: true }, x: X.START, y: S3.JETTY.Y, sx: 1, isInBoat: false };
    if (t < T.STEP[0]) {
        // along the jetty
        girl.x = lerp(X.START, X.JETTY_END, (t - T.WALK_IN[0]) / (T.WALK_IN[1] - T.WALK_IN[0]));
        girl.pose.walk = walkPhase(t, T.WALK_IN);
    }
    else if (t < T.TO_BOW[0]) {
        // down into the stern: a small hop, knees bending as she lands
        const u = span(t, T.STEP);
        girl.x = lerp(X.JETTY_END, X.STERN, u);
        girl.y = lerp(S3.JETTY.Y, floorY(t), u) - 10 * Math.sin(Math.PI * u);
        girl.pose.low = 0.35 * Math.sin(Math.PI * clamp01((t - T.STEP[0]) / (T.TO_BOW[0] - T.STEP[0])));
    }
    else if (t < T.SET[0]) {
        // up the boat to the bow
        girl.x = lerp(X.STERN, X.BOW, (t - T.TO_BOW[0]) / (T.TO_BOW[1] - T.TO_BOW[0]));
        girl.y = floorY(t);
        girl.pose.walk = walkPhase(t, T.TO_BOW);
    }
    else if (t < T.TURN_BACK) {
        // kneel, set the lantern on the bow, stand up again
        girl.x = X.BOW;
        girl.y = floorY(t);
        const handle = inBoat([MITU_BOAT.LANTERN[0], MITU_BOAT.LANTERN[1] - LANTERN_HANDLE], t);
        const carried = mituSkeleton({ ...STAND, carry: true }).handF;
        const hanging = mituSkeleton(STAND).handF;
        const down = span(t, T.SET) * (1 - span(t, T.RISE));
        const reach = t < T.SET[1] ? lerpPoint(carried, toLocal(girl, handle), span(t, T.SET)) : lerpPoint(toLocal(girl, handle), hanging, span(t, T.RISE));
        girl.pose = { ...STAND, low: 0.8 * down, lean: 0.3 * down, reach };
    }
    else if (t < T.TURN_ROUND) {
        // turn and walk back to the stern
        girl.sx = -1;
        girl.x = lerp(X.BOW, X.STERN, (t - T.BACK[0]) / (T.BACK[1] - T.BACK[0]));
        girl.y = floorY(t);
        girl.pose = { ...STAND, walk: walkPhase(t, T.BACK) };
    }
    else {
        // turn round, bend to the oar, lift it with both hands
        girl.x = X.STERN;
        girl.y = floorY(t);
        const lift = span(t, T.LIFT);
        const oar = t < T.LIFT[0] ? OAR_RESTING : oarBetween(lift);
        const bent = span(t, T.BEND) * (1 - lift);
        const reach = toLocal(girl, inBoat(oar.hand, t)), reachB = toLocal(girl, inBoat(oar.lower, t));
        const hands = span(t, T.BEND);
        const hang = mituSkeleton(STAND);
        girl.pose = { ...STAND, low: BEND.low * bent, lean: BEND.lean * bent, reach: lerpPoint(hang.handF, reach, hands), reachB: lerpPoint(hang.handB, reachB, hands) };
        look.parts = { ...look.parts, oar };
    }
    girl.isInBoat = girl.x > X.HULL_START;
    look.girl = girl;

    // the lantern hangs from her hand until it is on the bow
    if (!look.parts.lantern) {
        const hand = toScreen(girl, mituSkeleton(girl.pose).handF);
        look.lantern = [hand[0], hand[1] + LANTERN_HANDLE];
    }
    return look;
}

// how big the figure is drawn, for the frame builder
export const GIRL_SCALE = FIGURE_SCALE;

// a boat with these parts, as a cache key (painting is slow; equal parts paint equal pixels)
export function partsKey(p: BoatParts): string {
    const oar = p.oar ? `${p.oar.a.toFixed(4)} ${p.oar.hand[0].toFixed(2)} ${p.oar.hand[1].toFixed(2)}` : "-";
    return `${Number(p.hull)}${Number(p.lantern)}${Number(p.girl)} ${oar}`;
}
