// Painters for Abba's three things: the gamchha (a checked cotton towel,
// wet and crumpled), the bamboo flute, and the stacked tiffin box. Each is
// painted facing right on its anchor, the point where it touches the water,
// with its reflection. In the boat the game draws the same picture without
// the reflection. Shared by every scene the memories appear in. RENDER only.
import { MEMORY, memorySpriteName } from "../shared/memories";
import { stroke } from "./brush";
import { blob, mass } from "./mass";
import { context, flatten, group, makeCanvas, reflect } from "./layers";
import { setSeed } from "./seed";
import type { InkLayer, MemoryId, Point, SpriteArt, SpriteJob } from "../types";

const SEED: Record<MemoryId, number> = { gamchha: 501, flute: 502, tiffin: 503 };
const SEED_REFLECTION = 504;
const REFLECTION = { ALPHA: 0.34, DEPTH: 50 };

// a towel crumpled in a low heap, the end trailing; the checks are dry lines across it
function gamchha(g: InkLayer, P: (p: Point) => Point): void {
    const PP = (pts: Point[]) => pts.map(P);
    mass(g.wet, PP([[-40, 2], [-30, -12], [-12, -18], [6, -14], [24, -20], [40, -8], [44, 2], [10, 5]]), { tone: 0.34, tone2: 0.46, jitter: 2 });
    // the trailing end, flatter, half in the water
    mass(g.wet, PP([[30, 1], [44, -4], [62, -2], [64, 3]]), { tone: 0.28, tone2: 0.36, jitter: 1.5 });
    // folds
    stroke(g, PP([[-30, -10], [-14, -6], [2, -10]]), { w: 3, tone: 0.75, dryness: 0.35, bristles: 3, profile: "tip", body: 0.2 });
    stroke(g, PP([[8, -12], [22, -6], [38, -6]]), { w: 3, tone: 0.75, dryness: 0.35, bristles: 3, profile: "tip", body: 0.2 });
    // the checks
    for (const x of [-28, -16, -4, 8, 20, 32]) {
        stroke(g, PP([[x, -14], [x + 3, 2]]), { w: 1.6, tone: 0.62, dryness: 0.5, bristles: 2, profile: "even", body: 0 });
    }
    for (const y of [-10, -4]) {
        stroke(g, PP([[-34, y], [40, y - 2]]), { w: 1.6, tone: 0.55, dryness: 0.55, bristles: 2, profile: "even", body: 0, gap: 10 });
    }
}

// a thin bamboo tube lying a little aslant: nodes, a thread wound at the end, six holes
function flute(g: InkLayer, P: (p: Point) => Point): void {
    const PP = (pts: Point[]) => pts.map(P);
    const a: Point = [-50, -2], b: Point = [50, -8];
    const at = (u: number): Point => [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u];
    stroke(g, PP([a, at(0.5), b]), { w: 7, tone: 0.62, dryness: 0.2, bristles: 6, profile: "even", loaded: 0.8, body: 0.5 });
    for (const u of [0.18, 0.82]) {
        const [x, y] = at(u);
        stroke(g, PP([[x, y - 4], [x + 1, y + 4]]), { w: 2.2, tone: 0.9, dryness: 0.1, bristles: 2, profile: "even", body: 0 });
    }
    for (let i = 0; i < 4; i++) {
        const [x, y] = at(0.03 + i * 0.02);
        stroke(g, PP([[x, y - 4], [x, y + 4]]), { w: 1.4, tone: 0.85, dryness: 0.2, bristles: 1, profile: "even", body: 0 });
    }
    for (let i = 0; i < 6; i++) {
        const [x, y] = at(0.4 + i * 0.07);
        blob(g.wet, P([x, y - 1])[0], P([x, y - 1])[1], 1.4, 0.95);
    }
}

// three round boxes stacked, a clamp up the side and a handle on top
function tiffin(g: InkLayer, P: (p: Point) => Point): void {
    const PP = (pts: Point[]) => pts.map(P);
    const HALF = 15, TIER = 13;
    for (let i = 0; i < 3; i++) {
        const y0 = -i * TIER;
        mass(g.wet, PP([[-HALF, y0], [HALF, y0], [HALF, y0 - TIER + 2], [-HALF, y0 - TIER + 2]]), { tone: 0.42, tone2: 0.54, jitter: 0.8 });
        stroke(g, PP([[-HALF - 1, y0 - TIER + 2], [HALF + 1, y0 - TIER + 2]]), { w: 2, tone: 0.9, dryness: 0.15, bristles: 2, profile: "even", body: 0 });
    }
    const top = -3 * TIER;
    // lid, clamp bars, handle
    mass(g.wet, PP([[-HALF + 2, top + 2], [HALF - 2, top + 2], [8, top - 4], [-8, top - 4]]), { tone: 0.55, jitter: 0.6 });
    for (const x of [-HALF - 2, HALF + 2]) {
        stroke(g, PP([[x, 0], [x, top - 6]]), { w: 2, tone: 0.85, dryness: 0.2, bristles: 2, profile: "even", body: 0 });
    }
    stroke(g, PP([[-HALF - 2, top - 6], [0, top - 16], [HALF + 2, top - 6]]), { w: 2.2, tone: 0.88, dryness: 0.2, bristles: 2, profile: "even", body: 0 });
}

const PAINT: Record<MemoryId, (g: InkLayer, P: (p: Point) => Point) => void> = { gamchha, flute, tiffin };

export function paintMemory(id: MemoryId): SpriteArt {
    const def = MEMORY.SPRITE;
    setSeed(SEED[id]);
    const g = group(def.w, def.h);
    PAINT[id](g, ([x, y]) => [x + def.ax, y + def.ay]);
    const out = makeCanvas(def.w, def.h);
    context(out).drawImage(flatten(g), 0, 0);
    return { img: out, refl: reflect(out, def.ay, REFLECTION.ALPHA, REFLECTION.DEPTH, SEED_REFLECTION) };
}

// the sprite files for a scene the memories appear in
export function memoryJobs(): SpriteJob[] {
    return MEMORY.IDS.map((id) => ({ name: memorySpriteName(id), paint: () => paintMemory(id) }));
}
