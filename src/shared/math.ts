// Small maths helpers used by both the renderer and the game.
// Kept here so each one is written once.

export function clamp01(v: number): number {
    return Math.max(0, Math.min(1, v));
}

// the value u of the way from a to b (u is clamped to 0..1)
export function lerp(a: number, b: number, u: number): number {
    return a + (b - a) * clamp01(u);
}

// 0..1 in, 0..1 out, but slow at both ends (an "ease in and out")
export function smooth(u: number): number {
    return u * u * (3 - 2 * u);
}
