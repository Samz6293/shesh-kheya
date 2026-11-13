// The catch: Rahim's net at any height out of the water, and the aair fish
// at any point of a flap. Split from paint.ts because both are long.
// The net is painted from its anchor on the waterline: its top cord between
// the two corners `lift` px above the water, the bag hanging below; whatever
// is under the water is drawn faint. RENDER only.
import { FISH } from "../../../shared/fish";
import { stroke } from "../../../render/brush";
import { blob, mass } from "../../../render/mass";
import { context, flatten, group, makeCanvas } from "../../../render/layers";
import { setSeed } from "../../../render/seed";
import { S4 } from "./layout";
import type { Point, SpriteArt } from "../../../types";

const SEED = { NET: 421, FISH: 422 };
const UNDER_WATER = 0.3;          // how strongly the part under the water shows
const MESH = 7;                   // diamonds across the net
const NO_REFLECTION = makeCanvas(1, 1);

// the net `lift` px out of the water; fish: the fish lying in it (0..1
// through a flap), painted first so the mesh lies over it; null = empty
export function paintNet(lift: number, fish: number | null = null): SpriteArt {
    const def = S4.NET_SPRITE, { HALF, BAG } = S4.NET;
    const P = ([x, y]: Point): Point => [x + def.ax, y + def.ay];
    const PP = (pts: Point[]) => pts.map(P);
    const top = -lift;
    // the bag's edge: from each corner, round and full (a U, so the fish lies in it), to the bottom
    const edge = (u: number): Point => [-HALF + 2 * HALF * u, top + BAG * Math.sqrt(Math.sin(Math.PI * u))];

    const net = makeCanvas(def.w, def.h), nctx = context(net);
    if (fish !== null) {
        const f = paintFish(fish).img, fd = FISH.SPRITE;
        nctx.drawImage(f, def.ax - fd.ax, def.ay + top + S4.FISH_IN_NET - fd.ay);
    }
    setSeed(SEED.NET);
    const g = group(def.w, def.h);
    const bag: Point[] = [];
    for (let i = 0; i <= 16; i++) bag.push(edge(i / 16));
    mass(g.wet, PP(bag), { tone: 0.12, tone2: 0.2, jitter: 1.5 });
    // the mesh: lines from the top cord down to the bag's edge, both ways
    for (let i = 0; i <= MESH; i++) {
        const u = i / MESH;
        const a: Point = [-HALF + 2 * HALF * u, top];
        for (const dir of [-1, 1]) {
            const b = edge(Math.max(0, Math.min(1, u + dir * 0.35)));
            stroke(g, PP([a, b]), { w: 1.2, tone: 0.55, dryness: 0.5, bristles: 1, profile: "even", body: 0 });
        }
    }
    stroke(g, PP(bag), { w: 2, tone: 0.7, dryness: 0.4, bristles: 2, profile: "even", body: 0 });
    // the top cord with its floats
    stroke(g, PP([[-HALF, top], [0, top + 3], [HALF, top]]), { w: 3, tone: 0.85, dryness: 0.25, bristles: 3, profile: "even", body: 0.2 });
    for (let i = 0; i < 4; i++) {
        const [fx, fy] = P([-HALF + 14 + i * ((2 * HALF - 28) / 3), top + 1]);
        blob(g.wet, fx, fy, 3.5, 0.6);
    }
    nctx.drawImage(flatten(g), 0, 0);

    // above the waterline as painted, below it faint
    const out = makeCanvas(def.w, def.h), ctx = context(out);
    ctx.drawImage(net, 0, 0, def.w, def.ay, 0, 0, def.w, def.ay);
    ctx.globalAlpha = UNDER_WATER;
    ctx.drawImage(net, 0, def.ay, def.w, def.h - def.ay, 0, def.ay, def.w, def.h - def.ay);
    return { img: out, refl: NO_REFLECTION };
}

// the aair: long and heavy, flat head, long whiskers, a forked tail.
// phase 0..1 through one flap: the body bends one way, then the other
export function paintFish(phase: number): SpriteArt {
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
