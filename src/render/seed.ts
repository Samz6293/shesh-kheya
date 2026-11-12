// Seeded random numbers and smooth noise for the renderer.
// Math.random() gives different numbers on every run; these give the same
// numbers for the same seed, so a pose always paints the same pixels and a
// re-render of unchanged code produces identical frames.

let seed = 1;
let strokeIndex = 0;

// every painter calls this first
export function setSeed(n: number): void {
    seed = n;
    strokeIndex = 0;
}

// New here: a seeded random generator ("mulberry32"). It scrambles the seed
// with integer maths and returns a number from 0 to 1, like Math.random(),
// but repeatable. Docs: search "mulberry32 PRNG"
export function rand(): number {
    seed |= 0;
    seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

// a random number between a and b
export function rr(a: number, b: number): number {
    return a + (b - a) * rand();
}

// a different number for each stroke, so no two strokes break up the same way
export function strokeSalt(): number {
    return strokeIndex++ * 17.31;
}

// a fixed pseudo-random value for a grid point
function hash(x: number, y: number): number {
    const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
    return s - Math.floor(s);
}

// smooth noise: random values on a grid, blended between the grid points
export function noise(x: number, y: number): number {
    const xi = Math.floor(x), yi = Math.floor(y);
    const xf = x - xi, yf = y - yi;
    const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
    const a = hash(xi, yi), b = hash(xi + 1, yi), c = hash(xi, yi + 1), d = hash(xi + 1, yi + 1);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}

// several layers of noise, each finer and fainter: gives cloud-like mottling
export function fbm(x: number, y: number, octaves = 4): number {
    let sum = 0, amp = 0.5, freq = 1;
    for (let i = 0; i < octaves; i++) {
        sum += amp * noise(x * freq, y * freq);
        freq *= 2;
        amp *= 0.5;
    }
    return sum;
}
