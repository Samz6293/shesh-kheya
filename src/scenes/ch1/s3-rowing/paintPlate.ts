// The Scene 3 plate: the haor just after sunset. A warm wash low in the sky
// fading to rose and violet above (the sky turning from orange to purple, as
// the script asks), the same colours mirrored in the water, the afterglow
// where the sun went down, a far tree line, a few flooded hijol trees and
// clumps of hyacinth. Also the backing (paper and sky only) and the
// foreground: the ghat's bamboo jetty on the left and reeds in both corners,
// drawn live in front of everything. RENDER only.
import { STAGE } from "../../../shared/depth";
import { inkRGBA } from "../../../shared/ink";
import { stroke } from "../../../render/brush";
import { blob, mass } from "../../../render/mass";
import { context, fadeBetween, flatten, group, makeCanvas, reflect } from "../../../render/layers";
import { bakeGrainAndVignette, paintPaper } from "../../../render/paper";
import { frontPart, packFront, reed } from "../../../render/front";
import type { FrontPart } from "../../../render/front";
import { noise, rr, setSeed } from "../../../render/seed";
import { S3 } from "./layout";
import type { PaintedPlate, Point } from "../../../types";

const { W, H } = STAGE;
const HORIZON = 600;
const SEED = 31;
const GLOW = { x: 1450, r: 260, rgb: "214,104,62" };       // #D6683E, low: where the sun has just gone down
const JETTY = { THICK: 14, WATER: 924, POSTS: [-6, 92, 190, 288], MOOR: 326, MOOR_TOP: 796 };
const HIJOL: [number, number, number][] = [[1190, 630, 0.42], [1262, 634, 0.34], [372, 628, 0.3]];   // x, waterline, size
const HYACINTH: Point[] = [[520, 690], [1500, 872], [1760, 690], [210, 742]];

// warm low in the sky, rose then violet above; mirrored, fainter, in the water
function roseWash(ctx: CanvasRenderingContext2D): void {
    ctx.globalCompositeOperation = "multiply";
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, "rgba(196,170,196,0.42)");
    sky.addColorStop(0.3, "rgba(222,184,186,0.38)");
    sky.addColorStop(0.5, "rgba(240,186,146,0.44)");
    sky.addColorStop(0.555, "rgba(236,158,116,0.56)");
    sky.addColorStop(0.58, "rgba(236,176,140,0.42)");
    sky.addColorStop(0.72, "rgba(226,190,184,0.32)");
    sky.addColorStop(1, "rgba(196,178,196,0.4)");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);
}

// the last light where the sun went down, and its long smear on the water
function afterglow(ctx: CanvasRenderingContext2D): void {
    ctx.globalCompositeOperation = "multiply";
    const gr = ctx.createRadialGradient(GLOW.x, HORIZON, 0, GLOW.x, HORIZON, GLOW.r);
    gr.addColorStop(0, `rgba(${GLOW.rgb},0.22)`);
    gr.addColorStop(1, `rgba(${GLOW.rgb},0)`);
    ctx.fillStyle = gr;
    ctx.save();
    ctx.translate(GLOW.x, HORIZON);
    ctx.scale(1.6, 0.5);
    ctx.translate(-GLOW.x, -HORIZON);
    ctx.beginPath();
    ctx.arc(GLOW.x, HORIZON, GLOW.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    for (let i = 0; i < 12; i++) {
        const w = rr(60, 200) * (1 - i / 16);
        ctx.fillStyle = `rgba(${GLOW.rgb},${0.12 * (1 - i / 13)})`;
        ctx.fillRect(GLOW.x - w / 2 + rr(-14, 14), HORIZON + 12 + i * 15, w, 2.5);
    }
}

// a few long, faint clouds, lower than the text in the sky
function clouds(): HTMLCanvasElement {
    const g = group(W, H);
    for (let i = 0; i < 6; i++) {
        const cx = rr(-100, W + 100), cy = rr(180, 380), rw = rr(240, 480), rh = rr(20, 44);
        const poly: Point[] = [];
        for (let k = 0; k < 20; k++) {
            const a = (k / 20) * Math.PI * 2;
            const wob = 0.8 + 0.4 * noise(cx / 60 + Math.cos(a), cy / 60 + Math.sin(a));
            poly.push([cx + Math.cos(a) * rw * wob, cy + Math.sin(a) * rh * wob]);
        }
        mass(g.wet, poly, { tone: rr(0.07, 0.13), tone2: rr(0.03, 0.06), jitter: 5 });
    }
    const c = makeCanvas(W, H), cctx = context(c);
    cctx.filter = "blur(16px)";
    cctx.drawImage(flatten(g), 0, 0);
    return c;
}

// the far shore: a low band of trees along the horizon, with a gap of open water
function treeLine(): HTMLCanvasElement {
    const g = group(W, H);
    const crowns: Point[] = [];
    for (let x = -20; x < W + 40; x += rr(28, 76)) {
        if (x > 1340 && x < 1560) continue;
        crowns.push([x, rr(8, 26)]);
    }
    const poly: Point[] = [];
    for (let x = 0; x <= W; x += 6) {
        let h = 3 + 2 * noise(x / 20, 9);
        for (const [cx, r] of crowns) {
            const dd = r * r - (x - cx) * (x - cx);
            if (dd > 0) h = Math.max(h, Math.sqrt(dd) * 0.72 + 3);
        }
        poly.push([x, HORIZON - h]);
    }
    poly.push([W, HORIZON + 5], [0, HORIZON + 5]);
    mass(g.wet, poly, { tone: 0.2, tone2: 0.08, jitter: 2 });
    const c = flatten(g);
    fadeBetween(c, HORIZON - 24, HORIZON + 5);
    return c;
}

// hijol trees standing in the water, far off
function hijolTrees(): HTMLCanvasElement {
    const g = group(W, H);
    for (const [x, waterline, s] of HIJOL) {
        stroke(g, [[x, waterline + 3], [x - 2 * s, waterline - 30 * s], [x + 2 * s, waterline - 62 * s]], { w: 7 * s, tone: 0.42, dryness: 0.3, bristles: 6, profile: "rise", loaded: 0.8, body: 0.6 });
        for (let k = 0; k < 14; k++) {
            const dx = rr(-60, 60);
            blob(g.wet, x + dx * s, waterline - (86 + rr(-16, 16) - Math.abs(dx) * 0.12) * s, rr(16, 30) * s, rr(0.2, 0.34), 0.58);
        }
        for (let k = 0; k < 26; k++) {
            g.dry.fillStyle = inkRGBA(rr(0.35, 0.7));
            g.dry.beginPath();
            g.dry.ellipse(x + rr(-60, 60) * s, waterline - 92 * s + rr(-26, 18) * s, rr(1.5, 3) * s, rr(1, 2) * s, rr(0, 3), 0, Math.PI * 2);
            g.dry.fill();
        }
    }
    return flatten(g);
}

// birds going home over the water
function birds(): HTMLCanvasElement {
    const g = group(W, H);
    for (const [x, y, s] of [[640, 410, 0.9], [676, 396, 0.7], [702, 420, 0.8]]) {
        stroke(g, [[x - 9 * s, y - 3 * s], [x - 3 * s, y], [x, y + 1 * s]], { w: 2.2 * s, tone: 0.55, dryness: 0.2, bristles: 2, profile: "tip", body: 0.2 });
        stroke(g, [[x, y + 1 * s], [x + 4 * s, y - 2 * s], [x + 10 * s, y - 4 * s]], { w: 2.2 * s, tone: 0.55, dryness: 0.2, bristles: 2, profile: "tip", body: 0.2 });
    }
    return flatten(g);
}

// small clumps of water hyacinth, clear of the memories and the way out
function hyacinth(): HTMLCanvasElement {
    const g = group(W, H);
    for (const [cx, cy] of HYACINTH) {
        const s = 0.5 + 0.5 * ((cy - 650) / 255);
        for (let i = 0; i < 9; i++) blob(g.wet, cx + rr(-60, 60) * s, cy + rr(-6, 8) * s, rr(8, 15) * s, rr(0.26, 0.46), 0.5);
        for (let i = 0; i < 8; i++) {
            g.dry.fillStyle = inkRGBA(rr(0.5, 0.85));
            g.dry.beginPath();
            g.dry.ellipse(cx + rr(-64, 64) * s, cy + rr(-10, 8) * s, rr(1.5, 3) * s, rr(1.2, 2.2) * s, rr(0, 3), 0, Math.PI * 2);
            g.dry.fill();
        }
    }
    return flatten(g);
}

// water is blank paper with a few dry level streaks, longer and thicker near the camera
function waterStreaks(): HTMLCanvasElement {
    const g = group(W, H);
    for (let i = 0; i < 28; i++) {
        const y = rr(620, 1040), x = rr(-100, W - 100), len = rr(60, 320) * (0.5 + (y - 610) / 420);
        stroke(g, [[x, y], [x + len / 2, y + rr(-2, 2)], [x + len, y + rr(-1, 1)]], { w: rr(1.5, 3.2) * (0.6 + (y - 610) / 440), tone: rr(0.1, 0.22), dryness: 0.6, bristles: 3, profile: "even", body: 0 });
    }
    return flatten(g);
}

// the ghat: a bamboo jetty from the bank at the left edge, on posts in the
// water, with a taller post at its end where the boat is tied. A foreground
// piece (it never moves), so the boat can pass behind it
function jetty(): FrontPart {
    const { X0, X1, Y } = S3.JETTY;
    return frontPart(X0, X1 + 30, JETTY.MOOR_TOP - 10, 0, (g) => {
        // the bank it starts from, in the corner
        mass(g.wet, [[-60, H], [-60, Y - 6], [10, Y + 4], [70, Y + 60], [110, H]], { tone: 0.42, tone2: 0.6, jitter: 4 });
        for (const x of JETTY.POSTS) {
            stroke(g, [[x, Y + 4], [x + rr(-2, 2), (Y + JETTY.WATER) / 2], [x + rr(-4, 4), JETTY.WATER]], { w: 7, tone: 0.82, dryness: 0.28, bristles: 5, profile: "rise", loaded: 0.6, body: 0.4 });
        }
        stroke(g, [[JETTY.MOOR, JETTY.MOOR_TOP], [JETTY.MOOR + 1, Y], [JETTY.MOOR - 2, JETTY.WATER]], { w: 8, tone: 0.88, dryness: 0.25, bristles: 6, profile: "rise", loaded: 0.8, body: 0.4 });
        // the deck: split bamboo laid across, with some thickness
        mass(g.wet, [[X0, Y], [X1, Y], [X1, Y + JETTY.THICK], [X0, Y + JETTY.THICK]], { tone: 0.5, tone2: 0.66, jitter: 1 });
        stroke(g, [[X0, Y + 2], [(X0 + X1) / 2, Y + 3], [X1, Y + 1]], { w: 8, tone: 0.92, dryness: 0.22, bristles: 9, profile: "brush", loaded: 1, body: 0.4 });
        stroke(g, [[X0 + 6, Y + JETTY.THICK + 3], [X1 - 4, Y + JETTY.THICK + 3]], { w: 5, tone: 0.78, dryness: 0.3, bristles: 5, profile: "even", loaded: 0.8, body: 0.3 });
        for (let i = 0; i + 1 < JETTY.POSTS.length; i++) {
            const a = JETTY.POSTS[i], b = JETTY.POSTS[i + 1];
            stroke(g, [[a, Y + JETTY.THICK + 6], [b, JETTY.WATER - 10]], { w: 3, tone: 0.55, dryness: 0.4, bristles: 3, profile: "even", body: 0 });
        }
        // the rope round the post's head
        stroke(g, [[JETTY.MOOR - 6, JETTY.MOOR_TOP + 22], [JETTY.MOOR + 7, JETTY.MOOR_TOP + 26], [JETTY.MOOR - 5, JETTY.MOOR_TOP + 31]], { w: 2.4, tone: 0.75, dryness: 0.3, bristles: 2, profile: "even", body: 0 });
    });
}

// the foreground: the jetty, reeds in both bottom corners
function front(pier: FrontPart): PaintedPlate["front"] {
    const parts = [pier];
    const clump = (x0: number, x1: number, n: number, hMin: number, hMax: number, leanDir: number) => {
        for (let i = 0; i < n; i++) {
            parts.push(reed(rr(x0, x1), rr(hMin, hMax), rr(-30, 60) * leanDir, { w: rr(6, 11), tone: rr(0.5, 0.88), dryness: rr(0.3, 0.55), bristles: 8, profile: "tip", loaded: 1, body: 0.55, gap: 20 }));
        }
    };
    clump(1720, 1910, 13, 120, 250, -1);
    clump(0, 60, 5, 90, 170, 1);
    return packFront(parts);
}

// the plate with no scenery: the same paper (same seed), wash, grain and vignette
function paintBacking(): HTMLCanvasElement {
    setSeed(SEED);
    const backing = makeCanvas(W, H), ctx = context(backing);
    paintPaper(ctx);
    roseWash(ctx);
    bakeGrainAndVignette(ctx);
    return backing;
}

export default function paintPlate(): PaintedPlate {
    const backing = paintBacking();
    setSeed(SEED);
    const plate = makeCanvas(W, H), ctx = context(plate);
    paintPaper(ctx);
    roseWash(ctx);

    // the order of these calls matters: each one uses up seeded random numbers
    afterglow(ctx);
    const shore = treeLine();
    const shoreReflection = reflect(shore, HORIZON + 4, 0.28, 30, 5);
    const trees = hijolTrees();
    const treeReflection = reflect(trees, 634, 0.3, 60, 6);
    const pier = jetty();
    const pierPicture = makeCanvas(W, H);
    context(pierPicture).drawImage(pier.art, pier.piece.x, pier.piece.y);
    const pierReflection = reflect(pierPicture, JETTY.WATER, 0.3, 80, 7);
    const layers = [clouds(), shore, shoreReflection, birds(), trees, treeReflection, hyacinth(), waterStreaks(), pierReflection];
    // still "multiply" from the washes: ink layers darken the paper under them
    for (const layer of layers) ctx.drawImage(layer, 0, 0);
    bakeGrainAndVignette(ctx);
    return { img: plate, backing, front: front(pier) };
}
