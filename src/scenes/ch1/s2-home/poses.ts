// Scene 2 figures as a few joints: where Mitu's hips, knees, feet, shoulders,
// head and hands are for any pose (standing, walking, kneeling, sitting,
// leaning, reaching), and the same for Amma and Dadi. SHARED: the renderer
// paints from these joints, and the game uses them to put a prop in a hand
// and a speaker's light over a head, so both always agree.
// Points are measured from the figure's anchor (the floor under it), facing right.
import { lerp } from "../../../shared/math";
import type { AmmaPose, DadiPose, MituFloorPose, Point, Skeleton } from "../../../types";

type Body = Omit<Skeleton, "handF" | "handB">;

// Mitu's three body shapes; any pose is a blend of them
const BODY: Record<"STAND" | "KNEEL" | "SIT", Body> = {
    STAND: { hip: [0, -46], kneeF: [2, -23], footF: [0, 0], kneeB: [2, -23], footB: [0, 0], shoulder: [2, -89], head: [1, -104] },
    KNEEL: { hip: [0, -34], kneeF: [10, -3], footF: [-20, 0], kneeB: [6, -2], footB: [-22, -1], shoulder: [3, -77], head: [2, -92] },
    SIT: { hip: [-6, -9], kneeF: [22, -17], footF: [34, -2], kneeB: [18, -12], footB: [6, -2], shoulder: [-3, -52], head: [-2, -67] },
};

const MITU = {
    ARM: 34,                      // shoulder to hand, px
    LEG: 46,                      // hip to foot while walking
    SWING: 0.42,                  // radians a leg swings
    LIFT: 2,                      // px the body rises mid-step
    ARM_SWING: 0.5,
    CARRY: [8, 30] as Point,      // the lantern hand, from the shoulder
    LAP: [16, 22] as Point,       // hands resting in her lap when sitting, from the shoulder
};

const AMMA = {
    SHOULDER: [2, -78] as Point,
    HEAD: [-1, -93] as Point,
    LAP: [26, -20] as Point,      // her hand on her lap ...
    BELLY: [22, -46] as Point,    // ... and on her belly
    ELBOW_LAP: [8, -46] as Point,
    ELBOW_BELLY: [6, -56] as Point,
    GASP: [-3, -3] as Point,      // how far her head moves back and up
};

const DADI = {
    HIP: [-14, -10] as Point,     // she leans about this point
    SHOULDER: [4, -64] as Point,
    HEAD: [12, -76] as Point,
    WRIST: [34, -42] as Point,    // at rest, on her knee; the bangle is here
    CHUCKLE: 2.5,                 // px her shoulders rise
};

function lerpPoint(a: Point, b: Point, u: number): Point {
    return [lerp(a[0], b[0], u), lerp(a[1], b[1], u)];
}

function blend(a: Body, b: Body, u: number): Body {
    return {
        hip: lerpPoint(a.hip, b.hip, u),
        kneeF: lerpPoint(a.kneeF, b.kneeF, u),
        footF: lerpPoint(a.footF, b.footF, u),
        kneeB: lerpPoint(a.kneeB, b.kneeB, u),
        footB: lerpPoint(a.footB, b.footB, u),
        shoulder: lerpPoint(a.shoulder, b.shoulder, u),
        head: lerpPoint(a.head, b.head, u),
    };
}

// turn a point around a centre; + angle tips the top of the body forward (to +x)
function tip(p: Point, about: Point, angle: number): Point {
    const dx = p[0] - about[0], dy = p[1] - about[1];
    return [about[0] + dx * Math.cos(angle) - dy * Math.sin(angle), about[1] + dx * Math.sin(angle) + dy * Math.cos(angle)];
}

export function mituSkeleton(p: MituFloorPose): Skeleton {
    const body = blend(blend(BODY.STAND, BODY.KNEEL, p.low), BODY.SIT, p.sit);
    // walking only happens while standing
    const standing = (1 - p.low) * (1 - p.sit);
    const stride = Math.sin(2 * Math.PI * p.walk) * standing;
    const swing = MITU.SWING * stride;
    const lift = -MITU.LIFT * Math.abs(stride);
    body.hip[1] += lift;
    body.shoulder[1] += lift;
    body.head[1] += lift;
    body.footF = [body.footF[0] + MITU.LEG * Math.sin(swing), body.footF[1]];
    body.footB = [body.footB[0] - MITU.LEG * Math.sin(swing), body.footB[1]];
    body.kneeF = [body.kneeF[0] + (MITU.LEG / 2) * Math.sin(swing), body.kneeF[1]];
    body.kneeB = [body.kneeB[0] - (MITU.LEG / 2) * Math.sin(swing), body.kneeB[1]];
    body.shoulder = tip(body.shoulder, body.hip, p.lean);
    body.head = tip(body.head, body.hip, p.lean);

    // hands: reaching, carrying, in her lap, or hanging and swinging with the walk
    const hang = (dir: number): Point => {
        const a = -dir * MITU.ARM_SWING * stride;
        const down: Point = [body.shoulder[0] + MITU.ARM * Math.sin(a), body.shoulder[1] + MITU.ARM * Math.cos(a)];
        const lap: Point = [body.shoulder[0] + MITU.LAP[0], body.shoulder[1] + MITU.LAP[1]];
        return lerpPoint(down, lap, p.sit);
    };
    const carried: Point = [body.shoulder[0] + MITU.CARRY[0], body.shoulder[1] + MITU.CARRY[1]];
    const handF = p.reach ?? (p.carry ? carried : hang(1));
    return { ...body, handF, handB: hang(-1) };
}

export function ammaSkeleton(p: AmmaPose): { shoulder: Point, head: Point, elbow: Point, hand: Point } {
    return {
        shoulder: AMMA.SHOULDER,
        head: [AMMA.HEAD[0] + AMMA.GASP[0] * p.gasp, AMMA.HEAD[1] + AMMA.GASP[1] * p.gasp],
        elbow: lerpPoint(AMMA.ELBOW_LAP, AMMA.ELBOW_BELLY, p.hand),
        hand: lerpPoint(AMMA.LAP, AMMA.BELLY, p.hand),
    };
}

export function dadiSkeleton(p: DadiPose): { shoulder: Point, head: Point, elbow: Point, wrist: Point } {
    const up = DADI.CHUCKLE * p.chuckle;
    const shoulder = tip([DADI.SHOULDER[0], DADI.SHOULDER[1] - up], DADI.HIP, p.lean);
    const head = tip([DADI.HEAD[0], DADI.HEAD[1] - up * 1.2], DADI.HIP, p.lean);
    const wrist = p.reach ?? tip(DADI.WRIST, DADI.HIP, p.lean * 0.5);
    // the elbow sits between, pushed a little down and out, so the arm bends
    const mid = lerpPoint(shoulder, wrist, 0.5);
    const elbow: Point = [mid[0] - 4, mid[1] + 8];
    return { shoulder, head, elbow, wrist };
}

// poses that blend smoothly: u = 0 gives a, 1 gives b
export function lerpMitu(a: MituFloorPose, b: MituFloorPose, u: number): MituFloorPose {
    return {
        walk: u < 1 ? a.walk : b.walk,
        low: lerp(a.low, b.low, u),
        sit: lerp(a.sit, b.sit, u),
        lean: lerp(a.lean, b.lean, u),
        reach: a.reach && b.reach ? lerpPoint(a.reach, b.reach, u) : (u < 1 ? a.reach : b.reach),
        carry: u < 1 ? a.carry : b.carry,
    };
}
