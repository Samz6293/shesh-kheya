// Scene 5 painters for the offline renderer: Kalam's sprite for any moment of
// his pole push, the list of sprites the game needs, and (in paintPlate.ts)
// the background. RENDER only: the game never imports this file.
import { MITU_BOAT } from "../../../shared/mituBoat";
import { stroke } from "../../../render/brush";
import { blob, mass } from "../../../render/mass";
import { context, flatten, group, makeCanvas, reflect } from "../../../render/layers";
import { setSeed } from "../../../render/seed";
import paintMitu from "../../../render/paintMitu";
import { S5 } from "./layout";
import type { Point, SpriteArt, SpriteJob } from "../../../types";

const SEED = { KALAM: 401, REFLECTION: 402 };

// where Kalam's joints are. phase 0..1 = one push of the pole, nod 0..1 = head bowed
function kalamPose(phase: number, nod: number) {
    const push = Math.pow(Math.sin(Math.PI * phase), 2);
    const lean = 0.12 + 0.4 * push;
    const feet: Point = [36, -20];
    const hip: Point = [feet[0] + 44 * Math.sin(lean), feet[1] - 44 * Math.cos(lean)];
    const up = lean * 1.3;
    const sh: Point = [hip[0] + 46 * Math.sin(up), hip[1] - 46 * Math.cos(up)];
    const hd: Point = [sh[0] + 15 * Math.sin(up + nod * 0.7), sh[1] - 15 * Math.cos(up + nod * 0.7)];
    const hands: Point = [sh[0] + 4, sh[1] + 16];
    const base: Point = [-70 - 18 * push, 74];
    const dx = hands[0] - base[0], dy = hands[1] - base[1], l = Math.hypot(dx, dy);
    const poleTop: Point = [hands[0] + (dx / l) * 50, hands[1] + (dy / l) * 50];
    return { feet, hip, sh, hd, hands, base, poleTop };
}

// the old boatman: a longer, drier hull and a thin bent man pushing a pole
export function paintKalam(phase: number, nod = 0): SpriteArt {
    const def = S5.KALAM_SPRITE;
    const out = makeCanvas(def.w, def.h), octx = context(out);
    const P = ([x, y]: Point): Point => [x + def.ax, y + def.ay];
    const PP = (pts: Point[]) => pts.map(P);
    const k = kalamPose(phase, nod);

    setSeed(SEED.KALAM);
    const g = group(def.w, def.h);

    // old hull
    const h = S5.KALAM_HULL_HALF;
    mass(g.wet, PP([[-h, -40], [-196, -18], [0, -10], [196, -20], [h - 2, -44], [214, -12], [160, 4], [0, 12], [-170, 4], [-222, -12]]), { tone: 0.6, tone2: 0.82, jitter: 2.2 });
    stroke(g, PP([[-h + 2, -40], [-200, -8], [-90, 8], [0, 12], [110, 6], [210, -12], [h, -43]]), { w: 10, tone: 0.92, dryness: 0.42, bristles: 10, profile: "brush", loaded: 1, body: 0.35 });
    stroke(g, PP([[-240, -41], [-170, -19], [0, -9], [168, -18], [240, -43]]), { w: 3, tone: 0.8, dryness: 0.55, bristles: 4, profile: "even", body: 0 });

    // the pole: dark above the water, faint below
    const waterline: Point = [k.base[0] + (k.hands[0] - k.base[0]) * 0.55, k.base[1] + (k.hands[1] - k.base[1]) * 0.55];
    stroke(g, PP([k.poleTop, k.hands, waterline]), { w: 4, tone: 0.95, dryness: 0.15, bristles: 4, profile: "even", loaded: 1, body: 0.3 });
    stroke(g, PP([waterline, k.base]), { w: 3.5, tone: 0.28, dryness: 0.4, bristles: 3, profile: "even", body: 0.2 });

    // legs, then the pale lungi over them
    stroke(g, PP([k.hip, [k.feet[0] - 16, k.feet[1] - 22], [k.feet[0] - 20, k.feet[1]]]), { w: 3.4, tone: 0.95, dryness: 0.15, bristles: 3, profile: "even", body: 0.3 });
    stroke(g, PP([k.hip, [k.feet[0] + 14, k.feet[1] - 20], [k.feet[0] + 12, k.feet[1]]]), { w: 3.4, tone: 0.95, dryness: 0.15, bristles: 3, profile: "even", body: 0.3 });
    mass(g.wet, PP([[k.hip[0] - 10, k.hip[1] - 4], [k.hip[0] + 10, k.hip[1] - 4], [k.feet[0] + 16, k.feet[1] - 16], [k.feet[0] - 18, k.feet[1] - 16]]), { tone: 0.32, tone2: 0.42, jitter: 1.5 });

    // thin bent body, head, the rim of his white cap (the cap itself is bare paper)
    stroke(g, PP([k.hip, [(k.hip[0] + k.sh[0]) / 2 + 3, (k.hip[1] + k.sh[1]) / 2], k.sh]), { w: 8, tone: 0.9, dryness: 0.2, bristles: 6, profile: "rise", loaded: 1, body: 0.5 });
    const head = P(k.hd);
    blob(g.wet, head[0], head[1], 8.5, 0.88);
    stroke(g, PP([[k.hd[0] - 8, k.hd[1] - 4], [k.hd[0], k.hd[1] - 10], [k.hd[0] + 8, k.hd[1] - 5]]), { w: 2, tone: 0.7, dryness: 0.4, bristles: 2, profile: "even", body: 0 });

    // arms on the pole, gamchha over the shoulder
    stroke(g, PP([k.sh, [k.sh[0] + 10, k.sh[1] + 8], k.hands]), { w: 3, tone: 0.95, dryness: 0.1, bristles: 3, profile: "even", body: 0.3 });
    stroke(g, PP([[k.sh[0] - 2, k.sh[1] - 2], [k.sh[0] - 14, k.sh[1] + 10], [k.sh[0] - 18, k.sh[1] + 26]]), { w: 5, tone: 0.45, dryness: 0.45, bristles: 5, profile: "tip", body: 0.4 });

    octx.drawImage(flatten(g), 0, 0);
    return { img: out, refl: reflect(out, def.ay, 0.34, 130, SEED.REFLECTION) };
}

// every sprite file the game loads for this scene
export function spriteJobs(): SpriteJob[] {
    const jobs: SpriteJob[] = [{ name: "mitu_rest", paint: () => paintMitu(MITU_BOAT.REST) }];
    for (const side of ["near", "far"] as const) {
        MITU_BOAT.STROKE_FRAMES.forEach((p, i) => jobs.push({ name: `mitu_${side}_${i}`, paint: () => paintMitu({ side, p }) }));
    }
    for (let i = 0; i < S5.KALAM_FRAMES; i++) {
        jobs.push({ name: `kalam_${i}`, paint: () => paintKalam(i / S5.KALAM_FRAMES) });
    }
    return jobs;
}
