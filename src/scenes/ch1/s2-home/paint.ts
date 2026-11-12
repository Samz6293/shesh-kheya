// Scene 2 figure painters for the offline renderer: Mitu (standing, walking,
// kneeling, sitting, reaching), Amma (seated, pregnant), Dadi (seated, bent,
// a bangle on her wrist), and the props they move: the paan box, the lantern,
// the small kerosene bottle. Figures are painted from the joints in poses.ts,
// facing right and anchored at the floor; the frame flips Amma and Dadi to
// face Mitu. Plate: paintPlate.ts; close-ups: paintCloseups.ts. RENDER only.
import { stroke } from "../../../render/brush";
import { blob, mass } from "../../../render/mass";
import { context, flatten, group, makeCanvas } from "../../../render/layers";
import { setSeed } from "../../../render/seed";
import { ammaSkeleton, dadiSkeleton, mituSkeleton } from "./poses";
import { AMMA_POSE, DADI_POSE, MITU_POSE, PROP, S2 } from "./layout";
import type { AmmaPose, DadiPose, InkLayer, MituFloorPose, Point, SpriteArt, SpriteDef, SpriteJob, StrokeOptions } from "../../../types";

const SEED = { MITU: 201, AMMA: 202, DADI: 203, PROPS: 204 };
const LIMB: StrokeOptions = { w: 3, tone: 0.95, dryness: 0.1, bristles: 3, profile: "even", body: 0.3 };

// a figure on the floor has no reflection; the game still loads one, so it is an empty picture
function noReflection(): HTMLCanvasElement {
    return makeCanvas(1, 1);
}

// paints with points measured from the anchor, then returns the finished picture
function figure(def: SpriteDef, seed: number, paint: (g: InkLayer, P: (p: Point) => Point) => void): SpriteArt {
    setSeed(seed);
    const g = group(def.w, def.h);
    paint(g, ([x, y]) => [x + def.ax, y + def.ay]);
    const out = makeCanvas(def.w, def.h);
    context(out).drawImage(flatten(g), 0, 0);
    return { img: out, refl: noReflection() };
}

// a limb from a to b that bends at the middle, pushed `bend` px sideways
function limb(a: Point, b: Point, bend: number): Point[] {
    const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2;
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
    return [a, [mx + (-(b[1] - a[1]) / len) * bend, my + ((b[0] - a[0]) / len) * bend], b];
}

export function paintMitu(pose: MituFloorPose): SpriteArt {
    return figure(S2.MITU_SPRITE, SEED.MITU, (g, P) => {
        const PP = (pts: Point[]) => pts.map(P);
        const k = mituSkeleton(pose);
        const sh = k.shoulder, hip = k.hip;

        // legs (the far one first)
        stroke(g, PP([hip, k.kneeB, k.footB]), LIMB);
        stroke(g, PP([hip, k.kneeF, k.footF]), LIMB);

        // the frock: from the shoulders to a hem that follows the knees as she kneels or sits
        const hemF: Point = [Math.max(hip[0] + 18, k.kneeF[0] + 2 * pose.sit), Math.min(hip[1] + 2, k.kneeF[1] + 4)];
        const hemB: Point = [hip[0] - 17, hip[1] + 2];
        mass(g.wet, PP([[sh[0] - 11, sh[1] - 3], [sh[0] + 7, sh[1] - 3], hemF, hemB]), { tone: 0.38, tone2: 0.5, jitter: 1.5 });
        stroke(g, PP([[sh[0] + 6, sh[1] - 2], [(sh[0] + hemF[0]) / 2 + 3, (sh[1] + hemF[1]) / 2], hemF]), { w: 4, tone: 0.95, dryness: 0.15, bristles: 4, profile: "brush", loaded: 1, body: 0.3 });
        stroke(g, PP([hemB, [(hemB[0] + hemF[0]) / 2, Math.max(hemB[1], hemF[1]) + 2], hemF]), { w: 3, tone: 0.9, dryness: 0.3, bristles: 3, profile: "even", body: 0 });

        // head and plaited hair
        const head = P(k.head);
        blob(g.wet, head[0], head[1], 10, 0.9);
        stroke(g, PP([[k.head[0] - 6, k.head[1] - 4], [k.head[0] - 15, k.head[1] + 6], [k.head[0] - 18, k.head[1] + 24]]), { w: 4, tone: 0.95, dryness: 0.25, bristles: 4, profile: "tip", body: 0.3 });
        // orna over the shoulder, trailing behind
        stroke(g, PP([[sh[0] - 6, sh[1] - 2], [sh[0] - 20, sh[1] + 4], [sh[0] - 28, sh[1] + 20]]), { w: 6, tone: 0.42, dryness: 0.45, bristles: 6, profile: "tip", loaded: 0.7, body: 0.5 });

        // arms: the back one first, the front one (reaching, carrying) over the dress
        stroke(g, PP(limb(sh, k.handB, -3)), LIMB);
        stroke(g, PP(limb([sh[0] + 3, sh[1] + 1], k.handF, 4)), LIMB);
    });
}

export function paintAmma(pose: AmmaPose): SpriteArt {
    return figure(S2.AMMA_SPRITE, SEED.AMMA, (g, P) => {
        const PP = (pts: Point[]) => pts.map(P);
        const k = ammaSkeleton(pose);
        // sari over the folded legs, then the body with the belly forward
        mass(g.wet, PP([[-28, 0], [46, 0], [40, -18], [30, -28], [8, -26], [-20, -22]]), { tone: 0.5, tone2: 0.62, jitter: 1.8 });
        mass(g.wet, PP([[-20, -22], [-14, -60], [-8, -80], [8, -80], [16, -66], [30, -50], [32, -36], [24, -24]]), { tone: 0.46, tone2: 0.58, jitter: 1.6 });
        // the belly's line, so the shape reads at a glance
        stroke(g, PP([[12, -72], [28, -56], [32, -40], [24, -25]]), { w: 4, tone: 0.9, dryness: 0.2, bristles: 4, profile: "brush", loaded: 1, body: 0.3 });
        stroke(g, PP([[-10, -80], [-18, -50], [-24, -18], [-28, 0]]), { w: 4, tone: 0.85, dryness: 0.3, bristles: 4, profile: "brush", body: 0.2 });
        stroke(g, PP([[-28, -1], [10, 1], [46, -1]]), { w: 4, tone: 0.9, dryness: 0.25, bristles: 4, profile: "even", body: 0 });

        // head under the end of her sari (ghomta); it follows the head when she gasps
        const [hx, hy] = k.head;
        const head = P(k.head);
        blob(g.wet, head[0], head[1], 10.5, 0.85);
        stroke(g, PP([[hx + 7, hy - 9], [hx - 5, hy - 14], [hx - 15, hy - 5], [-20, -78]]), { w: 6, tone: 0.55, dryness: 0.35, bristles: 6, profile: "brush", loaded: 0.6, body: 0.5 });

        // arm: shoulder, elbow, hand (on her lap or her belly)
        stroke(g, PP([k.shoulder, k.elbow, k.hand]), LIMB);
        blob(g.wet, P(k.hand)[0], P(k.hand)[1], 3.5, 0.9);
    });
}

export function paintDadi(pose: DadiPose): SpriteArt {
    return figure(S2.DADI_SPRITE, SEED.DADI, (g, P) => {
        const PP = (pts: Point[]) => pts.map(P);
        const k = dadiSkeleton(pose);
        const [sx, sy] = k.shoulder, [hx, hy] = k.head;
        // folded legs, then the bent back, in a thin wash: her sari is white
        mass(g.wet, PP([[-30, 0], [40, 0], [34, -16], [24, -24], [-4, -24], [-24, -18]]), { tone: 0.26, tone2: 0.34, jitter: 1.8 });
        mass(g.wet, PP([[-24, -18], [-26, -42], [sx - 20, sy + 2], [sx - 4, sy - 6], [sx + 8, sy - 2], [sx + 12, sy + 16], [10, -24]]), { tone: 0.22, tone2: 0.3, jitter: 1.6 });
        // the curve of her back and the hem carry the shape
        stroke(g, PP([[sx - 2, sy - 8], [sx - 18, sy], [-24, -44], [-28, -16], [-30, 0]]), { w: 5, tone: 0.85, dryness: 0.3, bristles: 5, profile: "brush", loaded: 1, body: 0.3 });
        stroke(g, PP([[-30, -1], [6, 1], [40, -1]]), { w: 3.5, tone: 0.8, dryness: 0.3, bristles: 4, profile: "even", body: 0 });

        // head, low and forward, under the sari end
        const head = P(k.head);
        blob(g.wet, head[0], head[1], 9.5, 0.8);
        stroke(g, PP([[hx + 6, hy - 8], [hx - 6, hy - 12], [hx - 18, hy - 4], [hx - 24, hy + 10]]), { w: 5, tone: 0.4, dryness: 0.35, bristles: 5, profile: "brush", body: 0.4 });

        // arm out to the wrist and hand; the bangle is a small dark ring at the wrist (its glint is live)
        const w = k.wrist;
        const dir = Math.atan2(w[1] - k.elbow[1], w[0] - k.elbow[0]);
        const hand: Point = [w[0] + 7 * Math.cos(dir), w[1] + 7 * Math.sin(dir)];
        stroke(g, PP([k.shoulder, k.elbow, w, hand]), LIMB);
        blob(g.wet, P(hand)[0], P(hand)[1], 3.5, 0.9);
        const n: Point = [-Math.sin(dir) * 4, Math.cos(dir) * 4];
        stroke(g, PP([[w[0] - n[0], w[1] - n[1]], [w[0] + 1.5 * Math.cos(dir), w[1] + 1.5 * Math.sin(dir)], [w[0] + n[0], w[1] + n[1]]]), { w: 2.4, tone: 0.95, dryness: 0, bristles: 2, profile: "even", body: 0 });
    });
}

// ---------- props ----------
// the paan box (paanbata): a small brass box with a domed lid
function paintBox(): SpriteArt {
    return figure(S2.BOX_SPRITE, SEED.PROPS, (g, P) => {
        const PP = (pts: Point[]) => pts.map(P);
        mass(g.wet, PP([[-26, 0], [26, 0], [26, -16], [-26, -16]]), { tone: 0.55, tone2: 0.7, jitter: 1 });
        mass(g.wet, PP([[-28, -16], [28, -16], [20, -24], [-20, -24]]), { tone: 0.66, jitter: 1 });
        stroke(g, PP([[-26, -8], [26, -8]]), { w: 1.6, tone: 0.85, dryness: 0.3, bristles: 2, profile: "even", body: 0 });
    });
}

// the hurricane lantern, small, unlit: tank, glass, hood and the wire handle.
// Drawn at a 62 px design size and scaled down to LANTERN_HANDLE high
const LANTERN_DESIGN = 62;
function paintLantern(): SpriteArt {
    return figure(S2.LANTERN_SPRITE, SEED.PROPS, (g, P) => {
        const k = S2.LANTERN_HANDLE / LANTERN_DESIGN;
        const PP = (pts: Point[]) => pts.map(([x, y]) => P([x * k, y * k]));
        const top = -LANTERN_DESIGN;
        mass(g.wet, PP([[-16, 0], [16, 0], [17, -10], [-17, -10]]), { tone: 0.78, jitter: 0.8 });
        for (const dir of [-1, 1]) stroke(g, PP([[dir * 12, -10], [dir * 16, -24], [dir * 9, -38]]), { w: 2, tone: 0.55, dryness: 0.3, bristles: 2, profile: "even", body: 0 });
        mass(g.wet, PP([[-14, -38], [14, -38], [8, -45], [-8, -45]]), { tone: 0.8, jitter: 0.6 });
        stroke(g, PP([[-17, -8], [-20, -36], [0, top], [20, -36], [17, -8]]), { w: 1.6, tone: 0.75, dryness: 0.2, bristles: 2, profile: "even", body: 0 });
    });
}

// the small kerosene bottle, as it stands on the veranda in the wide shot
function paintBottleSmall(): SpriteArt {
    return figure(S2.BOTTLE_SPRITE, SEED.PROPS, (g, P) => {
        const PP = (pts: Point[]) => pts.map(P);
        mass(g.wet, PP([[-9, 0], [9, 0], [9, -26], [4, -32], [4, -44], [-4, -44], [-4, -32], [-9, -26]]), { tone: 0.3, tone2: 0.4, jitter: 0.6 });
        stroke(g, PP([[-9, -1], [-9, -26], [-4, -32], [-4, -44]]), { w: 1.6, tone: 0.7, dryness: 0.2, bristles: 2, profile: "even", body: 0 });
        stroke(g, PP([[9, -1], [9, -26], [4, -32], [4, -44]]), { w: 1.6, tone: 0.7, dryness: 0.2, bristles: 2, profile: "even", body: 0 });
    });
}

// every sprite file the game loads for this scene: each live pose, and the props
export function spriteJobs(): SpriteJob[] {
    const jobs: SpriteJob[] = [];
    for (const [name, pose] of Object.entries(MITU_POSE)) jobs.push({ name, paint: () => paintMitu(pose) });
    for (const [name, pose] of Object.entries(AMMA_POSE)) jobs.push({ name, paint: () => paintAmma(pose) });
    for (const [name, pose] of Object.entries(DADI_POSE)) jobs.push({ name, paint: () => paintDadi(pose) });
    jobs.push({ name: PROP.BOX, paint: paintBox }, { name: PROP.LANTERN, paint: paintLantern }, { name: PROP.BOTTLE, paint: paintBottleSmall });
    return jobs;
}
