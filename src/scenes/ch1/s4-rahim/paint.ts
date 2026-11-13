// Scene 4 painters for the offline renderer: Rahim standing in his fishing
// boat (any heave, laugh or look, from the joints in layout.ts), Mitu's boat
// seen end-on (the middle of her turn for home), and the list of sprites the
// game loads. The net and the fish are in paintCatch.ts; Mitu on her feet is
// S3's figure (paintGirl). RENDER only: the game never imports this file.
import { MITU_BOAT, OAR_LYING } from "../../../shared/mituBoat";
import { FISH, fishSpriteName } from "../../../shared/fish";
import { stroke } from "../../../render/brush";
import { blob, mass } from "../../../render/mass";
import { context, flatten, group, makeCanvas, reflect } from "../../../render/layers";
import { setSeed } from "../../../render/seed";
import paintMitu from "../../../render/paintMitu";
import { memoryJobs } from "../../../render/paintMemories";
import { paintGirl } from "../s3-rowing/paint";
import { paintFish, paintNet } from "./paintCatch";
import { RAHIM_POSE, S4, haulPose, hauling, rahimJoints } from "./layout";
import type { Point, RahimPose, SpriteArt, SpriteJob, StrokeOptions } from "../../../types";

const SEED = { RAHIM: 411, REFLECTION: 412, END_ON: 413 };
// Mitu's boat as it is with her on her feet: the oar lying in it
const EMPTY = { hull: true, lantern: true, girl: false, oar: OAR_LYING };
// her boat end-on, bow towards the camera: as wide as the boat's beam, deep as its hull (px at scale 1)
const END_ON = { HALF: 44, GUNWALE: -40, KEEL: 12, STEM: -54 };
const LIMB: StrokeOptions = { w: 3.4, tone: 0.95, dryness: 0.12, bristles: 3, profile: "even", body: 0.3 };

// a fisherman: broad, bare-armed, a checked lungi, a gamchha tied round his
// head (bare paper, rimmed). His boat is wider than Kalam's, a net basket aboard
export function paintRahim(pose: RahimPose): SpriteArt {
    const def = S4.RAHIM_SPRITE;
    const out = makeCanvas(def.w, def.h), octx = context(out);
    const P = ([x, y]: Point): Point => [x + def.ax, y + def.ay];
    const PP = (pts: Point[]) => pts.map(P);
    const k = rahimJoints(pose);

    setSeed(SEED.RAHIM);
    const g = group(def.w, def.h);

    // hull
    const h = S4.RAHIM_HULL_HALF;
    mass(g.wet, PP([[-h, -38], [-200, -16], [0, -8], [200, -18], [h, -42], [216, -10], [160, 6], [0, 14], [-170, 6], [-220, -10]]), { tone: 0.62, tone2: 0.84, jitter: 2 });
    stroke(g, PP([[-h + 2, -38], [-200, -6], [-90, 10], [0, 14], [110, 8], [212, -10], [h, -41]]), { w: 10, tone: 0.92, dryness: 0.4, bristles: 10, profile: "brush", loaded: 1, body: 0.35 });
    stroke(g, PP([[-226, -38], [-170, -17], [0, -7], [168, -16], [226, -40]]), { w: 3, tone: 0.8, dryness: 0.5, bristles: 4, profile: "even", body: 0 });

    // a round basket and the heap of net behind him
    mass(g.wet, PP([[-120, -10], [-74, -10], [-70, -38], [-124, -38]]), { tone: 0.5, tone2: 0.62, jitter: 1.5 });
    for (const y of [-18, -28]) stroke(g, PP([[-122, y], [-72, y]]), { w: 1.6, tone: 0.75, dryness: 0.5, bristles: 2, profile: "even", body: 0 });
    mass(g.wet, PP([[-50, -10], [-6, -10], [-14, -24], [-40, -26]]), { tone: 0.3, tone2: 0.4, jitter: 2 });

    // legs, the lungi over them
    stroke(g, PP([k.hip, [k.feet[0] - 14, k.feet[1] - 22], [k.feet[0] - 16, k.feet[1]]]), LIMB);
    stroke(g, PP([k.hip, [k.feet[0] + 12, k.feet[1] - 20], [k.feet[0] + 12, k.feet[1]]]), LIMB);
    mass(g.wet, PP([[k.hip[0] - 13, k.hip[1] - 4], [k.hip[0] + 13, k.hip[1] - 4], [k.feet[0] + 18, k.feet[1] - 12], [k.feet[0] - 20, k.feet[1] - 12]]), { tone: 0.44, tone2: 0.56, jitter: 1.5 });
    for (const u of [0.35, 0.7]) {
        const a: Point = [k.hip[0] - 12 + (k.feet[0] - 20 - k.hip[0] + 12) * u, k.hip[1] + (k.feet[1] - 12 - k.hip[1]) * u];
        stroke(g, PP([a, [a[0] + 28, a[1] - 1]]), { w: 1.5, tone: 0.7, dryness: 0.55, bristles: 2, profile: "even", body: 0 });
    }

    // a broad bare back, the head with the gamchha wound round it
    stroke(g, PP([k.hip, [(k.hip[0] + k.sh[0]) / 2 - 2, (k.hip[1] + k.sh[1]) / 2], k.sh]), { w: 11, tone: 0.9, dryness: 0.2, bristles: 7, profile: "rise", loaded: 1, body: 0.55 });
    const head = P(k.hd);
    blob(g.wet, head[0], head[1], 9.5, 0.88);
    stroke(g, PP([[k.hd[0] - 10, k.hd[1] - 3], [k.hd[0], k.hd[1] - 9], [k.hd[0] + 10, k.hd[1] - 4]]), { w: 4, tone: 0.55, dryness: 0.35, bristles: 4, profile: "even", body: 0.2 });
    stroke(g, PP([[k.hd[0] - 9, k.hd[1] - 4], [k.hd[0] - 18, k.hd[1] + 2]]), { w: 3, tone: 0.5, dryness: 0.4, bristles: 3, profile: "tip", body: 0.2 });

    // both arms out to the rope (or down by his side)
    stroke(g, PP([k.sh, [(k.sh[0] + k.handsB[0]) / 2 - 2, (k.sh[1] + k.handsB[1]) / 2 + 6], k.handsB]), LIMB);
    stroke(g, PP([[k.sh[0] + 3, k.sh[1] + 1], [(k.sh[0] + k.hands[0]) / 2 + 2, (k.sh[1] + k.hands[1]) / 2 + 5], k.hands]), LIMB);
    blob(g.wet, P(k.hands)[0], P(k.hands)[1], 3.5, 0.92);

    octx.drawImage(flatten(g), 0, 0);
    return { img: out, refl: reflect(out, def.ay, 0.34, 130, SEED.REFLECTION) };
}

// Mitu's boat seen from the bow, for the moment of her turn when it points at
// the camera: a deep curved hull, the stem rising in the middle, no lantern,
// oar or girl (the clip draws those on their own, so they never squash)
export function paintBoatEndOn(): SpriteArt {
    const def = MITU_BOAT.SPRITE, { HALF, GUNWALE, KEEL, STEM } = END_ON;
    const P = ([x, y]: Point): Point => [x + def.ax, y + def.ay];
    const PP = (pts: Point[]) => pts.map(P);
    setSeed(SEED.END_ON);
    const g = group(def.w, def.h);
    const hull: Point[] = [];
    for (let i = 0; i <= 12; i++) {
        const a = Math.PI * (i / 12);
        hull.push([-HALF * Math.cos(a), GUNWALE + (KEEL - GUNWALE) * Math.sin(a)]);
    }
    mass(g.wet, PP([...hull, [HALF * 0.7, GUNWALE + 4], [0, GUNWALE + 10], [-HALF * 0.7, GUNWALE + 4]]), { tone: 0.72, tone2: 0.9, jitter: 1.4 });
    stroke(g, PP([[-HALF, GUNWALE], [0, GUNWALE + 8], [HALF, GUNWALE]]), { w: 4, tone: 0.95, dryness: 0.25, bristles: 4, profile: "even", body: 0.2 });
    stroke(g, PP([[0, KEEL - 4], [0, GUNWALE], [1, STEM]]), { w: 5, tone: 0.95, dryness: 0.2, bristles: 4, profile: "rise", loaded: 1, body: 0.3 });
    const out = makeCanvas(def.w, def.h);
    context(out).drawImage(flatten(g), 0, 0);
    return { img: out, refl: reflect(out, def.ay, 0.38, 130, SEED.REFLECTION) };
}

// every sprite file the game loads for this scene
export function spriteJobs(): SpriteJob[] {
    const jobs: SpriteJob[] = [
        { name: "mitu_rest", paint: () => paintMitu(MITU_BOAT.REST) },
        { name: "mitu_empty", paint: () => paintMitu(MITU_BOAT.REST, EMPTY) },
    ];
    for (let i = 0; i < S4.HAUL_FRAMES; i++) jobs.push({ name: `girl_haul_${i}`, paint: () => paintGirl(haulPose(i / (S4.HAUL_FRAMES - 1))) });
    for (let i = 0; i < S4.RAHIM_FRAMES; i++) jobs.push({ name: `rahim_${i}`, paint: () => paintRahim(hauling(i / S4.RAHIM_FRAMES)) });
    for (const [name, pose] of Object.entries(RAHIM_POSE)) jobs.push({ name, paint: () => paintRahim(pose) });
    for (let i = 0; i <= S4.NET.LEVELS; i++) jobs.push({ name: `net_${i}`, paint: () => paintNet(i * S4.NET.LEVEL) });
    jobs.push({ name: "net_up", paint: () => paintNet(S4.NET.UP) });
    for (let i = 0; i < FISH.FRAMES; i++) {
        jobs.push({ name: `net_fish_${i}`, paint: () => paintNet(S4.NET.UP, i / FISH.FRAMES) });
        jobs.push({ name: fishSpriteName(i), paint: () => paintFish(i / FISH.FRAMES) });
    }
    return [...jobs, ...memoryJobs()];
}

// Mitu's boat with her on her feet (the oar lying in it), for the clips
export function paintEmptyBoat(): SpriteArt {
    return paintMitu(MITU_BOAT.REST, EMPTY);
}
