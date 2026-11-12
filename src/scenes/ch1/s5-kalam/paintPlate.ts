// The Scene 5 plate: everything that never moves. Paper, a grey-violet evening
// wash, storm clouds, the far tree line with home's kupi light, two flooded
// hijol trees, the hyacinth that traps Kalam, water streaks. Also the backing
// (the same paper and sky with none of the scenery) and the foreground: the
// near bank and reeds, drawn in front of the boats and swaying.
// Split from paint.ts because a plate is long. RENDER only.
import { depthScale, depthY, STAGE } from "../../../shared/depth";
import { inkRGBA } from "../../../shared/ink";
import { stroke } from "../../../render/brush";
import { blob, mass } from "../../../render/mass";
import { context, fadeBetween, flatten, group, makeCanvas, reflect } from "../../../render/layers";
import { bakeGrainAndVignette, paintPaper } from "../../../render/paper";
import { noise, rr, setSeed } from "../../../render/seed";
import { S5 } from "./layout";
import type { FrontPiece, PaintedPlate, Point, StrokeOptions } from "../../../types";

const { W, H } = STAGE;
const HORIZON = 612;
const HOME = { x: 232, y: 598 };              // the tiny house far away, and its lamp

// heavy wet masses along the top, dissolving downward, with dry wind streaks
function stormClouds(): HTMLCanvasElement {
    const g = group(W, H);
    for (let i = 0; i < 22; i++) {
        const cx = rr(-150, W + 150), cy = rr(20, 210), rw = rr(160, 340), rh = rr(40, 90);
        const poly: Point[] = [];
        for (let k = 0; k < 24; k++) {
            const a = (k / 24) * Math.PI * 2;
            const wob = 0.8 + 0.4 * noise(cx / 50 + Math.cos(a) * 2, cy / 50 + Math.sin(a) * 2);
            poly.push([cx + Math.cos(a) * rw * wob, cy + Math.sin(a) * rh * wob * (Math.sin(a) > 0 ? 0.6 : 1)]);
        }
        mass(g.wet, poly, { tone: rr(0.14, 0.26), tone2: rr(0.06, 0.12), jitter: 6 });
    }
    // blurred a lot, so they read as rain clouds, not shapes
    const c = makeCanvas(W, H), cctx = context(c);
    cctx.filter = "blur(14px)";
    cctx.drawImage(flatten(g), 0, 0);
    cctx.filter = "none";

    const streaks = group(W, H);
    for (let i = 0; i < 9; i++) {
        const x = rr(-100, W), y = rr(90, 280), len = rr(260, 620);
        stroke(streaks, [[x, y], [x + len * 0.5, y + rr(-6, 6)], [x + len, y + rr(-4, 4)]], { w: rr(5, 12), tone: rr(0.16, 0.26), dryness: 0.7, bristles: 9, profile: "tip", body: 0.2, gap: 30 });
    }
    cctx.drawImage(flatten(streaks), 0, 0);
    fadeBetween(c, 170, 400);
    return c;
}

// the far shore: a low bumpy band of trees, and home far to the left
function treeLine(): HTMLCanvasElement {
    const g = group(W, H);
    const crowns: Point[] = [];
    for (let x = -20; x < W + 40; x += rr(26, 70)) {
        if (x > 900 && x < 1100) continue;            // a gap of open horizon
        crowns.push([x, rr(12, 34)]);
    }
    const top = (x: number) => {
        let h = 4 + 2 * noise(x / 20, 3);
        for (const [cx, r] of crowns) {
            const dd = r * r - (x - cx) * (x - cx);
            if (dd > 0) h = Math.max(h, Math.sqrt(dd) * 0.75 + 4);
        }
        return HORIZON - h;
    };
    const poly: Point[] = [];
    for (let x = 0; x <= W; x += 6) poly.push([x, top(x)]);
    poly.push([W, HORIZON + 6], [0, HORIZON + 6]);
    mass(g.wet, poly, { tone: 0.24, tone2: 0.1, jitter: 2 });

    // home: walls and roof, a few pixels tall
    mass(g.wet, [[HOME.x - 24, 604], [HOME.x + 20, 604], [HOME.x + 20, 590], [HOME.x - 24, 590]], { tone: 0.42, jitter: 1 });
    mass(g.wet, [[HOME.x - 30, 592], [HOME.x + 26, 592], [HOME.x + 12, 580], [HOME.x - 16, 580]], { tone: 0.55, jitter: 1 });
    const c = flatten(g);
    fadeBetween(c, HORIZON - 26, HORIZON + 6);
    return c;
}

// two hijol trees standing in the water, on the right, clear of Kalam
function hijolTrees(): HTMLCanvasElement {
    const g = group(W, H);
    const trees = [[1220, 662, 0.55], [1130, 660, 0.45]];
    for (const [x, waterline, s] of trees) {
        stroke(g, [[x, waterline + 3], [x - 2 * s, waterline - 30 * s], [x + 2 * s, waterline - 62 * s]], { w: 7 * s, tone: 0.45, dryness: 0.3, bristles: 6, profile: "rise", loaded: 0.8, body: 0.6 });
        for (let k = 0; k < 14; k++) {
            const dx = rr(-60, 60);
            blob(g.wet, x + dx * s, waterline - (86 + rr(-16, 16) - Math.abs(dx) * 0.12) * s, rr(16, 30) * s, rr(0.24, 0.38), 0.58);
        }
        for (let k = 0; k < 30; k++) {
            g.dry.fillStyle = inkRGBA(rr(0.4, 0.75));
            g.dry.beginPath();
            g.dry.ellipse(x + rr(-60, 60) * s, waterline - 92 * s + rr(-26, 18) * s, rr(1.5, 3) * s, rr(1, 2) * s, rr(0, 3), 0, Math.PI * 2);
            g.dry.fill();
        }
    }
    return flatten(g);
}

// water hyacinth around Kalam's boat, a few clumps drifting nearer
function hyacinth(): HTMLCanvasElement {
    const g = group(W, H);
    const ky = depthY(S5.KALAM.z), ks = depthScale(S5.KALAM.z);
    // the clumps sit around S5.KALAM.x, reaching further ahead of him (HEADING mirrors the offsets)
    const kx = S5.KALAM.x;
    for (let i = 0; i < 46; i++) blob(g.wet, kx + rr(-240, 380) * S5.HEADING, ky + rr(-16, 22), rr(9, 19) * ks, rr(0.3, 0.55), 0.5);
    for (let i = 0; i < 28; i++) {
        g.dry.fillStyle = inkRGBA(rr(0.55, 0.9));
        g.dry.beginPath();
        g.dry.ellipse(kx + rr(-250, 390) * S5.HEADING, ky + rr(-22, 22), rr(1.5, 3.5), rr(1.2, 2.5), rr(0, 3), 0, Math.PI * 2);
        g.dry.fill();
    }
    for (let i = 0; i < 10; i++) blob(g.wet, kx + rr(-120, 260) * S5.HEADING, ky + rr(34, 60), rr(8, 14) * ks, rr(0.25, 0.4), 0.5);
    return flatten(g);
}

// water is blank paper with a few dry level streaks, longer and thicker near the camera
function waterStreaks(): HTMLCanvasElement {
    const g = group(W, H);
    for (let i = 0; i < 30; i++) {
        const y = rr(668, 1020), x = rr(-100, W - 100), len = rr(60, 340) * (0.5 + (y - 660) / 400);
        stroke(g, [[x, y], [x + len / 2, y + rr(-2, 2)], [x + len, y + rr(-1, 1)]], { w: rr(1.5, 3.5) * (0.6 + (y - 660) / 420), tone: rr(0.12, 0.26), dryness: 0.6, bristles: 3, profile: "even", body: 0 });
    }
    return flatten(g);
}

const FRONT = {
    PAD: 24,                      // px of room round each piece for the ink's bleed
    REED_SWAY: 0.05,              // how far a reed's tip moves, as a share of its height
    GAP: 2,                       // px between pieces in the atlas
};

// one stroke painted on its own small canvas, cut to the screen's bottom edge
function frontPiece(pts: Point[], options: StrokeOptions, sway: number): { art: HTMLCanvasElement, piece: FrontPiece } {
    const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
    const x = Math.floor(Math.min(...xs) - FRONT.PAD), y = Math.floor(Math.min(...ys) - FRONT.PAD);
    const w = Math.ceil(Math.max(...xs) + FRONT.PAD) - x, h = H - y;
    const g = group(w, h);
    stroke(g, pts.map(([px, py]): Point => [px - x, py - y]), options);
    // the atlas position (sx) is filled in when the pieces are packed
    return { art: flatten(g), piece: { sx: 0, sy: 0, w, h, x, y, sway, phase: rr(0, Math.PI * 2) } };
}

// the foreground, in front of every boat: the near bank and reeds in both
// bottom corners. Each reed is its own piece so the game can sway it.
function front(): PaintedPlate["front"] {
    const parts = [frontPiece([[-40, 1052], [160, 1036], [400, 1050]], { w: 70, tone: 0.18, dryness: 0.55, bristles: 22, profile: "brush", loaded: 0.6, body: 0.9, gap: 40 }, 0)];
    const clump = (x0: number, x1: number, n: number) => {
        for (let i = 0; i < n; i++) {
            const x = rr(x0, x1), h = rr(110, 260), lean = rr(-30, 60) * (x0 > 900 ? -1 : 1);
            const pts: Point[] = [[x, H + 10], [x + lean * 0.15, H - h * 0.45], [x + lean * 0.55, H - h * 0.8], [x + lean, H - h]];
            parts.push(frontPiece(pts, { w: rr(6, 12), tone: rr(0.5, 0.9), dryness: rr(0.3, 0.55), bristles: 8, profile: "tip", loaded: 1, body: 0.55, gap: 20 }, h * FRONT.REED_SWAY));
        }
    };
    clump(10, 260, 16);
    clump(1700, 1910, 12);

    // pack the pieces side by side into one picture: one file for the game to load
    const width = parts.reduce((sum, p) => sum + p.piece.w + FRONT.GAP, 0);
    const height = Math.max(...parts.map((p) => p.piece.h));
    const atlas = makeCanvas(width, height), actx = context(atlas);
    let sx = 0;
    for (const p of parts) {
        p.piece.sx = sx;
        actx.drawImage(p.art, sx, 0);
        sx += p.piece.w + FRONT.GAP;
    }
    return { img: atlas, pieces: parts.map((p) => p.piece) };
}

// evening wash: grey-violet sky, a dull rose band of last light at the horizon
function eveningWash(ctx: CanvasRenderingContext2D): void {
    ctx.globalCompositeOperation = "multiply";
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, "rgba(118,110,142,0.62)");
    sky.addColorStop(0.45, "rgba(176,150,168,0.34)");
    sky.addColorStop(0.565, "rgba(214,168,160,0.30)");
    sky.addColorStop(0.6, "rgba(190,170,180,0.22)");
    sky.addColorStop(1, "rgba(120,110,134,0.42)");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);
}

// the plate with no scenery: the same paper (same seed), wash, grain and vignette
function paintBacking(): HTMLCanvasElement {
    setSeed(11);
    const backing = makeCanvas(W, H), ctx = context(backing);
    paintPaper(ctx);
    eveningWash(ctx);
    bakeGrainAndVignette(ctx);
    return backing;
}

export default function paintPlate(): PaintedPlate {
    const backing = paintBacking();
    setSeed(11);
    const plate = makeCanvas(W, H), ctx = context(plate);
    paintPaper(ctx);
    eveningWash(ctx);

    // the order of these calls matters: each one uses up seeded random numbers
    const clouds = stormClouds();
    const shore = treeLine();
    const shoreReflection = reflect(shore, HORIZON + 4, 0.32, 36, 5);
    const trees = hijolTrees();
    const treeReflection = reflect(trees, 664, 0.36, 70, 6);
    const layers = [clouds, shore, shoreReflection, trees, treeReflection, hyacinth(), waterStreaks()];
    for (const layer of layers) ctx.drawImage(layer, 0, 0);
    bakeGrainAndVignette(ctx);

    // the kupi light at home: the only colour on the plate
    ctx.globalCompositeOperation = "screen";
    const kupi = ctx.createRadialGradient(HOME.x, HOME.y, 0, HOME.x, HOME.y, 14);
    kupi.addColorStop(0, "rgba(255,180,90,0.7)");
    kupi.addColorStop(1, "rgba(255,180,90,0)");
    ctx.fillStyle = kupi;
    ctx.beginPath();
    ctx.arc(HOME.x, HOME.y, 14, 0, Math.PI * 2);
    ctx.fill();
    return { img: plate, backing, front: front() };
}
