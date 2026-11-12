// The stage size and the water plane. The world is a side view with depth:
// x runs along the water, z runs from the far edge (0) to the near edge (1),
// and things get bigger as they come nearer.
// One formula for both programs, so a boat sits at the same pixel in a clip
// and in live play.
import type { Point } from "../types";

export const STAGE = { W: 1920, H: 1080, FPS: 24 };

// every clip starts and ends on a multiple of SYNC seconds, and every looping
// motion has a period that divides it, so loops are at phase 0 at every join
export const SYNC = 4;

const WATER = {
    FAR_Y: 650,
    NEAR_Y: 905,
    FAR_SCALE: 0.5,
    BOB_PERIOD: 4,
    BOB_PX: 3,
};

export function depthY(z: number): number {
    return WATER.FAR_Y + (WATER.NEAR_Y - WATER.FAR_Y) * z;
}

export function depthScale(z: number): number {
    return WATER.FAR_SCALE + (1 - WATER.FAR_SCALE) * z;
}

// boats breathe up and down; t is the clock in seconds
export function bob(t: number, scale: number): number {
    return Math.sin((2 * Math.PI * t) / WATER.BOB_PERIOD) * WATER.BOB_PX * scale;
}

// a point inside a sprite (measured from its anchor) -> a point on screen
export function localToScreen(pt: Point, x: number, y: number, scale: number, sx: number, roll = 0): Point {
    // the same order composeFrame draws a sprite in: scale and flip, then rotate
    const px = pt[0] * scale * sx, py = pt[1] * scale;
    const c = Math.cos(roll), s = Math.sin(roll);
    return [x + px * c - py * s, y + px * s + py * c];
}
