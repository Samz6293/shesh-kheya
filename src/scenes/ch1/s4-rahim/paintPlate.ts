// The Scene 4 plate: later dusk, the light going. A grey-violet wash with the
// last rose low on the horizon, clouds building, a far tree line, a village
// ghat on the far shore, and on the far right a dark grove of hijol trees
// standing in the water: the hijol forest Rahim says Abba went towards.
// Also the backing (paper and sky only) and the foreground reeds in both
// corners, drawn live in front of everything and swaying. RENDER only.
import { STAGE } from "../../../shared/depth";
import { inkRGBA } from "../../../shared/ink";
import { stroke } from "../../../render/brush";
import { blob, mass } from "../../../render/mass";
import { context, fadeBetween, flatten, group, makeCanvas, reflect } from "../../../render/layers";
import { bakeGrainAndVignette, paintPaper } from "../../../render/paper";
import { packFront, reed } from "../../../render/front";
import type { FrontPart } from "../../../render/front";
import { noise, rr, setSeed } from "../../../render/seed";
import type { PaintedPlate, Point } from "../../../types";

const { W, H } = STAGE;
const HORIZON = 606;
const SEED = 41;
const GROVE = { X0: 1440, X1: 1900, WATERLINE: 640 };       // the hijol forest, far right
const GHAT = { x: 300, y: 604 };                            // a village ghat on the far shore
const HYACINTH: Point[] = [[260, 700], [1300, 690], [1500, 900], [120, 880]];

// grey-violet above, a dull rose band at the horizon, mirrored in the water
function eveningWash(ctx: CanvasRenderingContext2D): void {
    ctx.globalCompositeOperation = "multiply";
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, "rgba(150,138,168,0.54)");
    sky.addColorStop(0.35, "rgba(190,166,180,0.4)");
    sky.addColorStop(0.53, "rgba(226,170,150,0.42)");
    sky.addColorStop(0.565, "rgba(222,160,140,0.44)");
    sky.addColorStop(0.6, "rgba(210,178,180,0.32)");
    sky.addColorStop(1, "rgba(150,140,164,0.44)");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);
}

// clouds building: wider and darker than in S3, soft, still below the text
function clouds(): HTMLCanvasElement {
    const g = group(W, H);
    for (let i = 0; i < 12; i++) {
        const cx = rr(-150, W + 150), cy = rr(120, 360), rw = rr(220, 460), rh = rr(30, 66);
        const poly: Point[] = [];
        for (let k = 0; k < 22; k++) {
            const a = (k / 22) * Math.PI * 2;
            const wob = 0.8 + 0.4 * noise(cx / 55 + Math.cos(a) * 2, cy / 55 + Math.sin(a) * 2);
            poly.push([cx + Math.cos(a) * rw * wob, cy + Math.sin(a) * rh * wob * (Math.sin(a) > 0 ? 0.6 : 1)]);
        }
        mass(g.wet, poly, { tone: rr(0.1, 0.19), tone2: rr(0.04, 0.09), jitter: 6 });
    }
    const c = makeCanvas(W, H), cctx = context(c);
    cctx.filter = "blur(15px)";
    cctx.drawImage(flatten(g), 0, 0);
    cctx.filter = "none";
    fadeBetween(c, 300, 520);
    return c;
}

// the far shore: a low band of trees, stopping where the hijol forest stands in the water
function treeLine(): HTMLCanvasElement {
    const g = group(W, H);
    const crowns: Point[] = [];
    for (let x = -20; x < GROVE.X0; x += rr(28, 72)) crowns.push([x, rr(8, 26)]);
    const poly: Point[] = [];
    for (let x = 0; x <= GROVE.X0 + 40; x += 6) {
        let h = 3 + 2 * noise(x / 20, 11);
        for (const [cx, r] of crowns) {
            const dd = r * r - (x - cx) * (x - cx);
            if (dd > 0) h = Math.max(h, Math.sqrt(dd) * 0.72 + 3);
        }
        poly.push([x, HORIZON - h * Math.min(1, (GROVE.X0 + 40 - x) / 60)]);
    }
    poly.push([GROVE.X0 + 40, HORIZON + 5], [0, HORIZON + 5]);
    mass(g.wet, poly, { tone: 0.22, tone2: 0.09, jitter: 2 });
    const c = flatten(g);
    fadeBetween(c, HORIZON - 24, HORIZON + 5);
    return c;
}

// the village ghat far off: a few steps down to the water, two roofs behind
function farGhat(): HTMLCanvasElement {
    const g = group(W, H);
    const { x, y } = GHAT;
    for (let i = 0; i < 4; i++) {
        stroke(g, [[x - 18 + i * 3, y - 2 - i * 3], [x + 18 - i * 3, y - 2 - i * 3]], { w: 2, tone: 0.32, dryness: 0.4, bristles: 2, profile: "even", body: 0 });
    }
    for (const [hx, w] of [[x - 46, 26], [x + 40, 22]]) {
        mass(g.wet, [[hx - w / 2, y - 8], [hx + w / 2, y - 8], [hx + w / 2, y - 18], [hx - w / 2, y - 18]], { tone: 0.3, jitter: 1 });
        mass(g.wet, [[hx - w / 2 - 5, y - 17], [hx + w / 2 + 5, y - 17], [hx + w / 4, y - 28], [hx - w / 4, y - 28]], { tone: 0.4, jitter: 1 });
    }
    return flatten(g);
}

// the hijol forest: many trees standing in the water, crowns merging into one dark mass
function hijolGrove(): HTMLCanvasElement {
    const g = group(W, H);
    for (let x = GROVE.X0; x < GROVE.X1 + 40; x += rr(34, 60)) {
        const s = rr(0.5, 0.78), wl = GROVE.WATERLINE + rr(-6, 6);
        stroke(g, [[x, wl + 3], [x - 2 * s, wl - 30 * s], [x + 2 * s, wl - 62 * s]], { w: 7 * s, tone: 0.5, dryness: 0.3, bristles: 6, profile: "rise", loaded: 0.8, body: 0.6 });
        for (let k = 0; k < 12; k++) {
            const dx = rr(-60, 60);
            blob(g.wet, x + dx * s, wl - (86 + rr(-18, 18) - Math.abs(dx) * 0.12) * s, rr(18, 32) * s, rr(0.26, 0.42), 0.6);
        }
        for (let k = 0; k < 16; k++) {
            g.dry.fillStyle = inkRGBA(rr(0.4, 0.75));
            g.dry.beginPath();
            g.dry.ellipse(x + rr(-60, 60) * s, wl - 92 * s + rr(-26, 18) * s, rr(1.5, 3) * s, rr(1, 2) * s, rr(0, 3), 0, Math.PI * 2);
            g.dry.fill();
        }
    }
    return flatten(g);
}

// small clumps of water hyacinth, clear of the boats
function hyacinth(): HTMLCanvasElement {
    const g = group(W, H);
    for (const [cx, cy] of HYACINTH) {
        const s = 0.5 + 0.5 * ((cy - 650) / 255);
        for (let i = 0; i < 10; i++) blob(g.wet, cx + rr(-64, 64) * s, cy + rr(-6, 8) * s, rr(8, 15) * s, rr(0.28, 0.48), 0.5);
        for (let i = 0; i < 9; i++) {
            g.dry.fillStyle = inkRGBA(rr(0.5, 0.85));
            g.dry.beginPath();
            g.dry.ellipse(cx + rr(-68, 68) * s, cy + rr(-10, 8) * s, rr(1.5, 3) * s, rr(1.2, 2.2) * s, rr(0, 3), 0, Math.PI * 2);
            g.dry.fill();
        }
    }
    return flatten(g);
}

// water is blank paper with a few dry level streaks, longer and thicker near the camera
function waterStreaks(): HTMLCanvasElement {
    const g = group(W, H);
    for (let i = 0; i < 30; i++) {
        const y = rr(626, 1040), x = rr(-100, W - 100), len = rr(60, 320) * (0.5 + (y - 616) / 420);
        stroke(g, [[x, y], [x + len / 2, y + rr(-2, 2)], [x + len, y + rr(-1, 1)]], { w: rr(1.5, 3.2) * (0.6 + (y - 616) / 440), tone: rr(0.12, 0.24), dryness: 0.6, bristles: 3, profile: "even", body: 0 });
    }
    return flatten(g);
}

// the foreground: reeds in both bottom corners
function front(): PaintedPlate["front"] {
    const parts: FrontPart[] = [];
    const clump = (x0: number, x1: number, n: number, leanDir: number) => {
        for (let i = 0; i < n; i++) {
            parts.push(reed(rr(x0, x1), rr(110, 240), rr(-30, 60) * leanDir, { w: rr(6, 11), tone: rr(0.5, 0.88), dryness: rr(0.3, 0.55), bristles: 8, profile: "tip", loaded: 1, body: 0.55, gap: 20 }));
        }
    };
    clump(10, 200, 12, 1);
    clump(1730, 1910, 11, -1);
    return packFront(parts);
}

// the plate with no scenery: the same paper (same seed), wash, grain and vignette
function paintBacking(): HTMLCanvasElement {
    setSeed(SEED);
    const backing = makeCanvas(W, H), ctx = context(backing);
    paintPaper(ctx);
    eveningWash(ctx);
    bakeGrainAndVignette(ctx);
    return backing;
}

export default function paintPlate(): PaintedPlate {
    const backing = paintBacking();
    setSeed(SEED);
    const plate = makeCanvas(W, H), ctx = context(plate);
    paintPaper(ctx);
    eveningWash(ctx);

    // the order of these calls matters: each one uses up seeded random numbers
    const shore = treeLine();
    const shoreReflection = reflect(shore, HORIZON + 4, 0.3, 30, 5);
    const grove = hijolGrove();
    const groveReflection = reflect(grove, GROVE.WATERLINE, 0.32, 70, 6);
    const layers = [clouds(), shore, shoreReflection, farGhat(), grove, groveReflection, hyacinth(), waterStreaks()];
    // still "multiply" from the wash: ink layers darken the paper under them
    for (const layer of layers) ctx.drawImage(layer, 0, 0);
    bakeGrainAndVignette(ctx);
    return { img: plate, backing, front: front() };
}
