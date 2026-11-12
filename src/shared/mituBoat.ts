// Mitu's boat: sprite size, where the lantern sits, the stroke poses, and the
// oar's geometry. Shared because the renderer paints these poses and the game
// has to pick the matching sprite and put rings where the oar enters the water.
import type { MituPose, OarShape, Point, Ring, SpriteDef } from "../types";

// The journey rule (decision D18): home is on the left of every water scene.
// Going out from home, Mitu travels and faces left to right; coming back home,
// right to left. A scene picks one of these as its HEADING; it is also the
// sprite's sx (1 = facing right, -1 = facing left).
export const JOURNEY = {
    OUTWARD: 1,
    HOMEWARD: -1,
} as const;

export const MITU_BOAT = {
    SPRITE: { w: 560, h: 560, ax: 280, ay: 300 } as SpriteDef,
    LANTERN: [166, -38] as Point,             // from the anchor, in sprite pixels
    HULL_HALF: 210,                           // half the hull's length, in sprite pixels
    // the stroke positions the game has a sprite for (clips move smoothly)
    STROKE_FRAMES: [0, 0.33, 0.66, 1],
    REST: { side: "near", p: 0.5 } as MituPose,
    GIRL: [-140, -16] as Point,               // where Mitu stands at the stern: her feet, from the anchor
};

// How a stroke looks on the water, the same in clips and live play
export const WAKE = {
    PITCH: 0.022,                 // radians the bow lifts at the height of a stroke's pull
    GAP: 0.3,                     // seconds between small rings off the stern while moving
    MIN_SPEED: 40,                // px/s: slower than this leaves no wake
    SCALE: 0.5,                   // wake rings are smaller than oar rings
    STERN: 0.85,                  // share of HULL_HALF behind the anchor where they start
};

// New here: pitch. While the oar pulls (the first `power` seconds of a
// stroke) the boat surges and its bow lifts a little, then settles. `age` is
// seconds since the stroke began; facing turns "bow up" into the right
// rotation for a boat facing left (-1) or right (1).
export function strokePitch(age: number, power: number, facing: number): number {
    if (age < 0 || age >= power) return 0;
    return -facing * WAKE.PITCH * Math.sin((Math.PI * age) / power);
}

// a small ring off the stern, where the hull pushes the water aside
export function wakeRing(x: number, y: number, scale: number, facing: number, born: number, a0: number): Ring {
    return { x: x - facing * MITU_BOAT.HULL_HALF * WAKE.STERN * scale, y, born, scale: scale * WAKE.SCALE, a0 };
}

const OAR = {
    ANGLE_CATCH: 0.62,            // radians from vertical when the oar enters
    ANGLE_SWEEP: 1.1,
    HAND: [-122, -94] as Point,
    HAND_TRAVEL: 14,
    GRIP_TO_TOP: 46,
    GRIP_TO_TIP: 178,
    GRIP_TO_LOWER: 42,
};

// sprite file names: mitu_rest, mitu_near_0..3, mitu_far_0..3
export function mituSpriteNames(): string[] {
    const names = ["mitu_rest"];
    for (const side of ["near", "far"]) {
        MITU_BOAT.STROKE_FRAMES.forEach((_, i) => names.push(`mitu_${side}_${i}`));
    }
    return names;
}

// where every part of the oar is for a pose, measured from the sprite's anchor
export function oarGeometry(pose: MituPose): OarShape {
    const a = OAR.ANGLE_CATCH - OAR.ANGLE_SWEEP * pose.p;
    const hand: Point = [OAR.HAND[0] + OAR.HAND_TRAVEL * (0.5 - pose.p), OAR.HAND[1]];
    return oarAt(a, hand);
}

// the oar held at angle a (radians from pointing straight down, + towards the
// bow) with the grip at `hand`. oarGeometry() uses it for the stroke poses;
// S3 uses it for the oar lying in the boat and being picked up.
// entry: where it crosses the waterline (y = 0), or its tip if it doesn't reach the water
export function oarAt(a: number, hand: Point): OarShape {
    const dir: Point = [Math.sin(a), Math.cos(a)];
    const top: Point = [hand[0] - dir[0] * OAR.GRIP_TO_TOP, hand[1] - dir[1] * OAR.GRIP_TO_TOP];
    const tip: Point = [hand[0] + dir[0] * OAR.GRIP_TO_TIP, hand[1] + dir[1] * OAR.GRIP_TO_TIP];
    // where the oar crosses the waterline (y = 0)
    const k = (0 - top[1]) / (tip[1] - top[1]);
    const entry: Point = tip[1] > 0 ? [top[0] + (tip[0] - top[0]) * k, 0] : tip;
    const lower: Point = [hand[0] + dir[0] * OAR.GRIP_TO_LOWER, hand[1] + dir[1] * OAR.GRIP_TO_LOWER];
    return { a, hand, lower, top, tip, entry };
}
