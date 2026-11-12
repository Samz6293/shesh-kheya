// The Scene 2 plate: home at dusk. Paper with a saffron evening wash, a pale
// sun on the horizon, a faint far tree line, banana trees on a mound, and the
// tin-roofed house on stilts with its veranda, where Amma and Dadi sit, and a
// bamboo walkway from the veranda down to the ghat, off the right edge. Also
// the backing (the same paper and sky, no scenery) and the foreground reeds
// and hyacinth, drawn in front of everything and swaying. RENDER only.
import { STAGE } from "../../../shared/depth";
import { inkRGBA } from "../../../shared/ink";
import { stroke } from "../../../render/brush";
import { blob, mass } from "../../../render/mass";
import { context, fadeBetween, flatten, group, makeCanvas, reflect } from "../../../render/layers";
import { bakeGrainAndVignette, paintPaper } from "../../../render/paper";
import { frontPart, packFront, reed } from "../../../render/front";
import type { FrontPart } from "../../../render/front";
import { noise, rr, setSeed } from "../../../render/seed";
import { S2, floorY } from "./layout";
import type { PaintedPlate, Point } from "../../../types";

const { W, H } = STAGE;
const HORIZON = 590;
const WATER_UNDER_HOUSE = 878;                // where the stilts go into the water
const SEED = 21;
const SUN = { x: 1480, y: 560, r: 58, rgb: "214,104,62" };   // #D6683E, low opacity: the only colour besides the lights
const DECK = { THICK: 16, BRACE_TOP: 26, BRACE_LOW: 96 };     // px below the floor line
const BANANA = {
    TREES: [[150, 560, 1], [228, 604, 0.85]] as [number, number, number][],   // x, top of trunk, size
    FOOT: 786,                    // where the trunks stand on the mound
    SWAY: 7,                      // px the crowns move at most
};
const HOUSE = {
    X0: 300, X1: 770, WALL_TOP: 560,
    DOOR: [522, 598, 640] as const,           // left, right, top
    WINDOW: [662, 718, 624, 672] as const,    // left, right, top, bottom
    ROOF: [[272, 575], [798, 575], [758, 452], [318, 452]] as Point[],
    VERANDA_X1: 1252,
    STILTS: [286, 400, 520, 640, 760, 880, 1000, 1120, 1236],
};

// dusk: warm all over, strongest in a saffron band at the horizon
function duskWash(ctx: CanvasRenderingContext2D): void {
    ctx.globalCompositeOperation = "multiply";
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, "rgba(232,214,194,0.30)");
    sky.addColorStop(0.38, "rgba(240,198,162,0.42)");
    sky.addColorStop(0.53, "rgba(238,172,130,0.55)");
    sky.addColorStop(0.56, "rgba(236,200,176,0.32)");
    sky.addColorStop(1, "rgba(214,198,184,0.34)");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);
}

// a few long, very faint clouds; the top of the sky stays open for the text
function clouds(): HTMLCanvasElement {
    const g = group(W, H);
    for (let i = 0; i < 7; i++) {
        const cx = rr(-100, W + 100), cy = rr(110, 300), rw = rr(260, 520), rh = rr(24, 50);
        const poly: Point[] = [];
        for (let k = 0; k < 20; k++) {
            const a = (k / 20) * Math.PI * 2;
            const wob = 0.8 + 0.4 * noise(cx / 60 + Math.cos(a), cy / 60 + Math.sin(a));
            poly.push([cx + Math.cos(a) * rw * wob, cy + Math.sin(a) * rh * wob]);
        }
        mass(g.wet, poly, { tone: rr(0.06, 0.11), tone2: rr(0.03, 0.06), jitter: 5 });
    }
    const c = makeCanvas(W, H), cctx = context(c);
    cctx.filter = "blur(18px)";
    cctx.drawImage(flatten(g), 0, 0);
    return c;
}

// the far shore: a low, pale band of trees along the horizon
// returns the painted band, and its shape as a solid mask (to cut the sun with)
function treeLine(): { img: HTMLCanvasElement, mask: HTMLCanvasElement } {
    const g = group(W, H);
    const crowns: Point[] = [];
    for (let x = -20; x < W + 40; x += rr(30, 80)) crowns.push([x, rr(8, 24)]);
    const poly: Point[] = [];
    for (let x = 0; x <= W; x += 6) {
        let h = 3 + 2 * noise(x / 20, 7);
        for (const [cx, r] of crowns) {
            const dd = r * r - (x - cx) * (x - cx);
            if (dd > 0) h = Math.max(h, Math.sqrt(dd) * 0.7 + 3);
        }
        poly.push([x, HORIZON - h]);
    }
    poly.push([W, HORIZON + 5], [0, HORIZON + 5]);
    mass(g.wet, poly, { tone: 0.16, tone2: 0.07, jitter: 2 });
    const c = flatten(g);
    fadeBetween(c, HORIZON - 22, HORIZON + 5);

    const mask = makeCanvas(W, H), mctx = context(mask);
    mctx.filter = "blur(1.5px)";                  // soft edge, like the band's own
    mctx.fillStyle = "#000";
    mctx.beginPath();
    poly.forEach(([x, y], i) => (i === 0 ? mctx.moveTo(x, y) : mctx.lineTo(x, y)));
    mctx.closePath();
    mctx.fill();
    return { img: c, mask };
}

// birds going home: five small brush ticks
function birds(): HTMLCanvasElement {
    const g = group(W, H);
    for (const [x, y, s] of [[1060, 330, 1], [1100, 312, 0.8], [1130, 342, 0.9], [1175, 322, 0.7], [1012, 350, 0.75]]) {
        stroke(g, [[x - 9 * s, y - 3 * s], [x - 3 * s, y], [x, y + 1 * s]], { w: 2.2 * s, tone: 0.6, dryness: 0.2, bristles: 2, profile: "tip", body: 0.2 });
        stroke(g, [[x, y + 1 * s], [x + 4 * s, y - 2 * s], [x + 10 * s, y - 4 * s]], { w: 2.2 * s, tone: 0.6, dryness: 0.2, bristles: 2, profile: "tip", body: 0.2 });
    }
    return flatten(g);
}

// the small mound left of the house, where the banana trees stand
function mound(): HTMLCanvasElement {
    const g = group(W, H);
    mass(g.wet, [[40, 806], [330, 806], [292, 784], [170, 772], [80, 786]], { tone: 0.34, tone2: 0.2, jitter: 3 });
    return flatten(g);
}

// two banana trees on the mound: foreground pieces, so their crowns sway in
// the wind like the reeds while the foot of each trunk stays put
function bananaTrees(): FrontPart[] {
    return BANANA.TREES.map(([x, top, s]) => frontPart(x - 170 * s, x + 170 * s, top - 70 * s, BANANA.SWAY * s, (g) => {
        stroke(g, [[x, BANANA.FOOT], [x + 3, 680], [x - 2, top]], { w: 13 * s, tone: 0.62, dryness: 0.35, bristles: 9, profile: "rise", loaded: 0.8, body: 0.6 });
        // long leaves arching out and drooping, a few torn
        const leaves: [number, number][] = [[-1, 0.9], [-1, 0.55], [1, 0.7], [1, 1], [0.2, 0.3]];
        for (const [dir, droop] of leaves) {
            const len = rr(110, 150) * s;
            const pts: Point[] = [[x, top + 4], [x + dir * len * 0.45, top - 30 * s * (1 - droop)], [x + dir * len * 0.85, top + 10 * s + 40 * droop * s], [x + dir * len, top + 30 * s + 70 * droop * s]];
            stroke(g, pts, { w: rr(14, 20) * s, tone: rr(0.45, 0.62), dryness: 0.45, bristles: 10, profile: "brush", loaded: 0.7, body: 0.55, gap: 14 });
        }
    }, BANANA.FOOT));
}

// the trees as one picture, only to paint their reflection into the plate
function treesPicture(parts: FrontPart[]): HTMLCanvasElement {
    const c = makeCanvas(W, H), ctx = context(c);
    for (const p of parts) ctx.drawImage(p.art, p.piece.x, p.piece.y);
    return c;
}

// the house: stilts, floor and veranda, bamboo walls, door, window, tin roof
function house(): HTMLCanvasElement {
    const g = group(W, H);
    const F = S2.FLOOR_Y;

    for (const x of HOUSE.STILTS) {
        stroke(g, [[x, F + 10], [x + rr(-3, 3), (F + WATER_UNDER_HOUSE) / 2], [x + rr(-5, 5), WATER_UNDER_HOUSE]], { w: 8, tone: 0.85, dryness: 0.25, bristles: 5, profile: "rise", loaded: 0.6, body: 0.4 });
    }

    // walls: a pale wash with bamboo lines
    mass(g.wet, [[HOUSE.X0, F], [HOUSE.X1, F], [HOUSE.X1, HOUSE.WALL_TOP], [HOUSE.X0, HOUSE.WALL_TOP]], { tone: 0.16, tone2: 0.24, jitter: 1.5 });
    for (let x = HOUSE.X0 + 14; x < HOUSE.X1; x += rr(20, 30)) {
        stroke(g, [[x, HOUSE.WALL_TOP + 6], [x + rr(-1, 1), F - 4]], { w: 2, tone: rr(0.2, 0.32), dryness: 0.6, bristles: 2, profile: "even", body: 0, gap: 18 });
    }
    const [dl, dr, dt] = HOUSE.DOOR;
    mass(g.wet, [[dl, F], [dr, F], [dr, dt], [dl, dt]], { tone: 0.68, tone2: 0.8, jitter: 1 });
    const [wl, wr, wt, wb] = HOUSE.WINDOW;
    mass(g.wet, [[wl, wb], [wr, wb], [wr, wt], [wl, wt]], { tone: 0.5, tone2: 0.62, jitter: 1 });
    for (const x of [wl + 14, (wl + wr) / 2, wr - 14]) {
        stroke(g, [[x, wt + 2], [x, wb - 2]], { w: 2.5, tone: 0.9, dryness: 0.1, bristles: 2, profile: "even", body: 0 });
    }

    // tin roof: a dark wash with ridges, a heavy eave
    mass(g.wet, HOUSE.ROOF, { tone: 0.46, tone2: 0.64, jitter: 1.8 });
    for (let x = HOUSE.ROOF[3][0] + 10; x < HOUSE.ROOF[2][0]; x += 18) {
        const u = (x - HOUSE.ROOF[3][0]) / (HOUSE.ROOF[2][0] - HOUSE.ROOF[3][0]);
        const xb = HOUSE.ROOF[0][0] + u * (HOUSE.ROOF[1][0] - HOUSE.ROOF[0][0]);
        stroke(g, [[x, HOUSE.ROOF[3][1] + 4], [xb, HOUSE.ROOF[0][1] - 4]], { w: 2, tone: 0.62, dryness: 0.55, bristles: 2, profile: "even", body: 0, gap: 16 });
    }
    stroke(g, [[HOUSE.ROOF[0][0] - 4, HOUSE.ROOF[0][1] - 1], [HOUSE.ROOF[1][0] + 2, HOUSE.ROOF[1][1] + 2]], { w: 8, tone: 0.92, dryness: 0.25, bristles: 8, profile: "brush", loaded: 1, body: 0.3 });
    stroke(g, [HOUSE.ROOF[3], HOUSE.ROOF[2]], { w: 4, tone: 0.8, dryness: 0.3, bristles: 4, profile: "even", body: 0 });

    // veranda awning out to a single post, and the long floor
    mass(g.wet, [[HOUSE.X1, 588], [HOUSE.VERANDA_X1, 614], [HOUSE.VERANDA_X1, 626], [HOUSE.X1, 602]], { tone: 0.5, tone2: 0.6, jitter: 1.2 });
    stroke(g, [[HOUSE.X1 - 6, 600], [HOUSE.VERANDA_X1 + 4, 627]], { w: 5, tone: 0.9, dryness: 0.25, bristles: 4, profile: "even", body: 0.2 });
    stroke(g, [[HOUSE.VERANDA_X1 - 14, 622], [HOUSE.VERANDA_X1 - 12, F]], { w: 7, tone: 0.88, dryness: 0.25, bristles: 5, profile: "even", loaded: 0.6, body: 0.4 });
    // the deck: planks with some thickness, a beam under them, braces between the stilts
    mass(g.wet, [[248, F], [HOUSE.VERANDA_X1 + 4, F], [HOUSE.VERANDA_X1 + 4, F + DECK.THICK], [248, F + DECK.THICK]], { tone: 0.5, tone2: 0.66, jitter: 1 });
    stroke(g, [[248, F + 2], [750, F + 4], [HOUSE.VERANDA_X1 + 4, F + 1]], { w: 9, tone: 0.92, dryness: 0.22, bristles: 10, profile: "brush", loaded: 1, body: 0.4 });
    stroke(g, [[256, F + DECK.THICK + 4], [HOUSE.VERANDA_X1, F + DECK.THICK + 4]], { w: 7, tone: 0.82, dryness: 0.3, bristles: 6, profile: "even", loaded: 0.8, body: 0.3 });
    for (let i = 0; i + 1 < HOUSE.STILTS.length; i++) {
        const a = HOUSE.STILTS[i], b = HOUSE.STILTS[i + 1], down = i % 2 === 0;
        stroke(g, [[a, F + (down ? DECK.BRACE_TOP : DECK.BRACE_LOW)], [b, F + (down ? DECK.BRACE_LOW : DECK.BRACE_TOP)]], { w: 3, tone: 0.55, dryness: 0.4, bristles: 3, profile: "even", body: 0 });
    }

    // the walkway to the ghat: two bamboo poles sloping down to the right, on thin posts
    const { X0, X1 } = S2.WALKWAY;
    stroke(g, [[X0 - 4, floorY(X0) + 2], [(X0 + X1) / 2, floorY((X0 + X1) / 2) + 2], [X1, floorY(X1) + 2]], { w: 6, tone: 0.86, dryness: 0.3, bristles: 5, profile: "even", loaded: 0.8, body: 0.3 });
    stroke(g, [[X0, floorY(X0) + 10], [X1, floorY(X1) + 10]], { w: 3, tone: 0.6, dryness: 0.45, bristles: 3, profile: "even", body: 0 });
    for (let x = X0 + 120; x < X1; x += 150) {
        stroke(g, [[x, floorY(x) + 8], [x + rr(-3, 3), WATER_UNDER_HOUSE + 10]], { w: 4, tone: 0.75, dryness: 0.3, bristles: 3, profile: "rise", body: 0.3 });
    }
    return flatten(g);
}

// water is blank paper with a few dry level streaks, longer and thicker near the camera
function waterStreaks(): HTMLCanvasElement {
    const g = group(W, H);
    for (let i = 0; i < 28; i++) {
        const y = rr(612, 1040), x = rr(-100, W - 100), len = rr(60, 320) * (0.5 + (y - 600) / 420);
        stroke(g, [[x, y], [x + len / 2, y + rr(-2, 2)], [x + len, y + rr(-1, 1)]], { w: rr(1.5, 3.2) * (0.6 + (y - 600) / 440), tone: rr(0.1, 0.22), dryness: 0.6, bristles: 3, profile: "even", body: 0 });
    }
    return flatten(g);
}

// the sun, setting behind the far shore: painted on its own layer, then the
// shore and everything below the horizon are cut out of it, so the trees stand
// in front of it. Its broken path on the water is painted straight onto the plate
function sun(ctx: CanvasRenderingContext2D, shoreMask: HTMLCanvasElement): void {
    const disc = makeCanvas(W, H), dctx = context(disc);
    const gr = dctx.createRadialGradient(SUN.x, SUN.y, 0, SUN.x, SUN.y, SUN.r);
    gr.addColorStop(0, `rgba(${SUN.rgb},0.42)`);
    gr.addColorStop(0.88, `rgba(${SUN.rgb},0.36)`);
    gr.addColorStop(1, `rgba(${SUN.rgb},0)`);
    dctx.fillStyle = gr;
    dctx.beginPath();
    dctx.arc(SUN.x, SUN.y, SUN.r, 0, Math.PI * 2);
    dctx.fill();
    dctx.globalCompositeOperation = "destination-out";
    dctx.drawImage(shoreMask, 0, 0);
    dctx.fillStyle = "#000";                     // any solid colour: only its coverage matters here
    dctx.fillRect(0, HORIZON, W, H - HORIZON);

    ctx.globalCompositeOperation = "multiply";
    ctx.drawImage(disc, 0, 0);
    for (let i = 0; i < 9; i++) {
        const w = (SUN.r * 1.6 - i * 8) * rr(0.7, 1.1);
        ctx.fillStyle = `rgba(${SUN.rgb},${0.22 * (1 - i / 10)})`;
        ctx.fillRect(SUN.x - w / 2 + rr(-6, 6), HORIZON + 10 + i * 13, w, 2.5);
    }
}

// the foreground: reeds in both bottom corners, a few clumps of hyacinth
function front(trees: FrontPart[]): PaintedPlate["front"] {
    const parts = [...trees, frontPart(1380, 1700, 990, 0, (g) => {
        for (let i = 0; i < 18; i++) blob(g.wet, rr(1400, 1680), rr(1010, 1050), rr(10, 18), rr(0.3, 0.5), 0.5);
        for (let i = 0; i < 14; i++) {
            g.dry.fillStyle = inkRGBA(rr(0.5, 0.85));
            g.dry.beginPath();
            g.dry.ellipse(rr(1400, 1680), rr(1004, 1050), rr(1.5, 3.2), rr(1.2, 2.4), rr(0, 3), 0, Math.PI * 2);
            g.dry.fill();
        }
    })];
    const clump = (x0: number, x1: number, n: number, leanDir: number) => {
        for (let i = 0; i < n; i++) {
            parts.push(reed(rr(x0, x1), rr(120, 250), rr(-30, 60) * leanDir, { w: rr(6, 11), tone: rr(0.5, 0.88), dryness: rr(0.3, 0.55), bristles: 8, profile: "tip", loaded: 1, body: 0.55, gap: 20 }));
        }
    };
    clump(1700, 1910, 13, -1);
    clump(10, 150, 7, 1);
    return packFront(parts);
}

// the plate with no scenery: the same paper (same seed), wash, grain and vignette
function paintBacking(): HTMLCanvasElement {
    setSeed(SEED);
    const backing = makeCanvas(W, H), ctx = context(backing);
    paintPaper(ctx);
    duskWash(ctx);
    bakeGrainAndVignette(ctx);
    return backing;
}

export default function paintPlate(): PaintedPlate {
    const backing = paintBacking();
    setSeed(SEED);
    const plate = makeCanvas(W, H), ctx = context(plate);
    paintPaper(ctx);
    duskWash(ctx);

    // the order of these calls matters: each one uses up seeded random numbers
    const { img: shore, mask: shoreMask } = treeLine();
    sun(ctx, shoreMask);
    const shoreReflection = reflect(shore, HORIZON + 4, 0.28, 30, 5);
    const trees = bananaTrees();
    const home = house();
    const homeReflection = reflect(home, WATER_UNDER_HOUSE, 0.3, 120, 6);
    const treeReflection = reflect(treesPicture(trees), 806, 0.26, 80, 7);
    const layers = [clouds(), shore, shoreReflection, birds(), treeReflection, homeReflection, waterStreaks(), mound(), home];
    for (const layer of layers) ctx.drawImage(layer, 0, 0);
    bakeGrainAndVignette(ctx);
    return { img: plate, backing, front: front(trees) };
}
