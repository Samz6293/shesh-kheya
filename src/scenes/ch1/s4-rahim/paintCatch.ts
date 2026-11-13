// The catch: Rahim's net at any height out of the water, with or without
// the fish in it (the fish's painter is render/paintFish.ts, shared with the
// scenes it rides in after). Split from paint.ts because it is long.
// The net is painted from its anchor on the waterline: its top cord between
// the two corners `lift` px above the water, the bag hanging below; whatever
// is under the water is drawn faint. RENDER only.
import { FISH } from "../../../shared/fish";
import { stroke } from "../../../render/brush";
import { blob, mass } from "../../../render/mass";
import paintFish from "../../../render/paintFish";
import { context, flatten, group, makeCanvas } from "../../../render/layers";
import { setSeed } from "../../../render/seed";
import { S4 } from "./layout";
import type { Point, SpriteArt } from "../../../types";

const SEED = { NET: 421 };
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
