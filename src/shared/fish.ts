// Rahim's big aair fish. It comes up in his net in S4, Mitu lifts it into her
// boat, and it lies there, now and then flapping, for the rest of the chapter
// (in S6 she gives it to Amma). SHARED: the renderer paints its flaps at this
// size; the game draws it in the net, while it is dragged, and in the boat.
import type { Point, SpriteDef } from "../types";

export const FISH = {
    SPRITE: { w: 180, h: 110, ax: 90, ay: 70 } as SpriteDef,   // anchor: under its belly
    FRAMES: 4,                    // sprites through one flap
    FLAP: 1,                      // seconds per flap while it thrashes (divides SYNC)
    IN_BOAT: [100, -12] as Point, // where it lies in Mitu's boat, from the boat's anchor (facing right)
    // in the boat it lies still, and every so often gives one flap and a small hop
    HOP: { EVERY: 6, LENGTH: 0.5, HEIGHT: 8 },
};

export function fishSpriteName(i: number): string {
    return `fish_${i}`;
}

// which flap sprite shows at clock time t while it thrashes
export function fishFrame(t: number): number {
    return Math.floor((((t / FISH.FLAP) % 1) + 1) % 1 * FISH.FRAMES) % FISH.FRAMES;
}

// in the boat: 0 lying still, 0..1 through a hop
export function fishHop(t: number): number {
    const u = (((t % FISH.HOP.EVERY) + FISH.HOP.EVERY) % FISH.HOP.EVERY) / FISH.HOP.LENGTH;
    return u < 1 ? u : 0;
}
