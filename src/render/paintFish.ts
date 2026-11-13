// The aair fish Rahim gives Mitu, at any point of a flap. It comes up in his
// net in S4 and lies in her boat from then on, so every scene after S4 paints
// its sprites with this. RENDER only.
import { stroke } from "./brush";
import { blob, mass } from "./mass";
import { context, flatten, group, makeCanvas } from "./layers";
import { setSeed } from "./seed";
import { FISH, fishSpriteName } from "../shared/fish";
import type { Point, SpriteArt, SpriteJob } from "../types";

const SEED = { FISH: 422 };
const NO_REFLECTION = makeCanvas(1, 1);

// the aair: long and heavy, flat head, long whiskers, a forked tail.
// phase 0..1 through one flap: the body bends one way, then the other
export default function paintFish(phase: number): SpriteArt {
    const def = FISH.SPRITE;
    const P = ([x, y]: Point): Point => [x + def.ax, y + def.ay];
    const PP = (pts: Point[]) => pts.map(P);
    const bend = Math.sin(2 * Math.PI * phase);
    // the spine from tail (-46) to head (46); it bends most at the tail
    const spine = (x: number): Point => [x, -10 + bend * 9 * Math.pow((46 - x) / 92, 2)];
    const width = (x: number) => 10 * Math.sin(Math.PI * Math.min(1, (x + 50) / 100)) + 2;

    setSeed(SEED.FISH);
    const g = group(def.w, def.h);
    const upper: Point[] = [], lower: Point[] = [];
    for (let x = -46; x <= 48; x += 4) {
        const [sx, sy] = spine(x), w = width(x);
        upper.push([sx, sy - w * 0.9]);
        lower.push([sx, sy + w * 0.7]);
    }
    mass(g.wet, PP([...upper, ...lower.reverse()]), { tone: 0.5, tone2: 0.66, jitter: 1 });
    // a dark back, a pale belly left as paper
    stroke(g, PP(upper.filter((_, i) => i % 2 === 0)), { w: 3.5, tone: 0.9, dryness: 0.25, bristles: 4, profile: "brush", loaded: 1, body: 0.3 });
    // forked tail
    const [tx, ty] = spine(-46);
    stroke(g, PP([[tx, ty], [tx - 14, ty - 10 - bend * 4]]), { w: 5, tone: 0.8, dryness: 0.3, bristles: 4, profile: "tip", body: 0.4 });
    stroke(g, PP([[tx, ty], [tx - 14, ty + 8 - bend * 4]]), { w: 5, tone: 0.8, dryness: 0.3, bristles: 4, profile: "tip", body: 0.4 });
    // the eye and the long whiskers
    const [hx, hy] = spine(44);
    blob(g.wet, P([hx - 6, hy - 3])[0], P([hx - 6, hy - 3])[1], 1.6, 0.95);
    for (const [dx, dy] of [[26, -10], [30, 4], [18, 12]]) {
        stroke(g, PP([[hx, hy], [hx + dx * 0.6, hy + dy * 0.5 + bend * 2], [hx + dx, hy + dy]]), { w: 1.2, tone: 0.75, dryness: 0.3, bristles: 1, profile: "tip", body: 0 });
    }
    const out = makeCanvas(def.w, def.h);
    context(out).drawImage(flatten(g), 0, 0);
    return { img: out, refl: NO_REFLECTION };
}

// its flap sprites, for any scene it rides in
export function fishJobs(): SpriteJob[] {
    const jobs: SpriteJob[] = [];
    for (let i = 0; i < FISH.FRAMES; i++) jobs.push({ name: fishSpriteName(i), paint: () => paintFish(i / FISH.FRAMES) });
    return jobs;
}
