// Scene 2 close-ups for the offline renderer. Paan and lantern are activities
// for the hands, so each gets its own whole-screen picture, painted in the
// same ink, plus the loose pieces the player moves (leaf, lime pot, supari
// bowl, the folded paan, the kerosene bottle). The game draws the pieces on
// top of the close-up wherever they are. RENDER only.
import { STAGE } from "../../../shared/depth";
import { stroke } from "../../../render/brush";
import { blob, mass } from "../../../render/mass";
import { context, fadeBetween, flatten, group, makeCanvas } from "../../../render/layers";
import { bakeGrainAndVignette, paintPaper } from "../../../render/paper";
import { noise, rr, setSeed } from "../../../render/seed";
import { LANTERN, PAAN, STILL } from "./layout";
import type { InkLayer, Point, StillJob } from "../../../types";

const { W, H } = STAGE;
const SEED = { PAAN: 231, LANTERN: 232, PIECES: 233 };
const LIME = "rgba(247,243,234,0.97)";        // chun is white: bare paper colour, painted over the leaf
const PAPER_FILL = "rgb(238,226,208)";         // the paper under the warm wash, for solid shapes
const VIEW = { PAAN_HORIZON: 420, LANTERN_HORIZON: 600, LEDGE: 806 };
const SUN = { x: 1400, y: 566, r: 52, rgb: "214,104,62" };

// a warm wash like the wide shot's, so the close-ups belong to the same evening
function warmWash(ctx: CanvasRenderingContext2D, horizon: number): void {
    ctx.globalCompositeOperation = "multiply";
    const gr = ctx.createLinearGradient(0, 0, 0, H);
    gr.addColorStop(0, "rgba(234,212,190,0.32)");
    gr.addColorStop(horizon / H - 0.02, "rgba(238,176,134,0.5)");
    gr.addColorStop(horizon / H + 0.02, "rgba(232,204,180,0.34)");
    gr.addColorStop(1, "rgba(212,192,176,0.38)");
    ctx.fillStyle = gr;
    ctx.fillRect(0, 0, W, H);
}

// a faint far shore along the horizon; returns its outline (to cut the sun with)
function farShore(g: InkLayer, horizon: number): Point[] {
    const poly: Point[] = [];
    for (let x = 0; x <= W; x += 8) poly.push([x, horizon - 4 - 12 * noise(x / 60, 3)]);
    poly.push([W, horizon + 4], [0, horizon + 4]);
    mass(g.wet, poly, { tone: 0.14, tone2: 0.06, jitter: 2 });
    return poly;
}

// floor boards: level dry strokes, further apart nearer the camera
function boards(g: InkLayer, top: number): void {
    for (let y = top, gap = 30; y < H + 20; y += gap, gap *= 1.12) {
        stroke(g, [[-20, y], [W / 2, y + rr(-2, 2)], [W + 20, y + rr(-2, 2)]], { w: rr(2, 4), tone: rr(0.22, 0.34), dryness: 0.6, bristles: 4, profile: "even", body: 0, gap: 40 });
    }
}

// an ellipse as a list of points, for rims
function ellipse(cx: number, cy: number, rx: number, ry: number, n = 28): Point[] {
    const pts: Point[] = [];
    for (let i = 0; i <= n; i++) pts.push([cx + rx * Math.cos((i / n) * Math.PI * 2), cy + ry * Math.sin((i / n) * Math.PI * 2)]);
    return pts;
}

// Dadi sits facing us across the plate; we see her lap, her arms and hands,
// the bangle on her wrist; her face is above the picture. The paan box is
// open in front of Mitu, with the leaves, the lime pot and the supari in it
function paintPaanPlate(): HTMLCanvasElement {
    setSeed(SEED.PAAN);
    const c = makeCanvas(W, H), ctx = context(c);
    paintPaper(ctx);
    warmWash(ctx, VIEW.PAAN_HORIZON);

    // each part is its own layer, drawn back to front: a layer's dry strokes
    // would otherwise land on top of everything in it (floor lines across Dadi)
    const back = group(W, H);
    for (let x = 20; x < W; x += rr(26, 40)) {
        stroke(back, [[x, -10], [x + rr(-2, 2), 470]], { w: 2, tone: rr(0.12, 0.2), dryness: 0.6, bristles: 2, profile: "even", body: 0, gap: 22 });
    }
    boards(back, 600);
    ctx.drawImage(flatten(back), 0, 0);

    // Dadi: one rounded seated shape (shoulders, arms at her sides, a wide lap);
    // her face is above the picture
    const [hx, hy] = PAAN.HAND, [ex, ey] = PAAN.ELBOW, [wx, wy] = PAAN.WRIST;
    const body: Point[] = [[800, -20], [760, 40], [735, 120], [730, 220], [738, 330], [748, 380], [640, 420], [575, 480], [560, 560], [590, 630],
        [700, 662], [965, 672], [1230, 662], [1340, 630], [1375, 560], [1360, 480], [1290, 420], [ex + 5, ey + 8], [1215, 330], [1222, 220], [1215, 120], [1190, 40], [1150, -20]];
    const rightFore = taper([760, 372], [hx - 34, hy - 6], 36, 24);
    const leftFore = taper([ex, ey], [wx, wy], 34, 24);
    solid(ctx, [body, rightFore, leftFore]);
    const dadi = group(W, H);
    mass(dadi.wet, body, { tone: 0.14, tone2: 0.22, jitter: 2.5 });
    // where her arms meet her sides
    for (const [x0, x1] of [[776, 768], [1176, 1184]]) stroke(dadi, [[x0, 70], [(x0 + x1) / 2 - 3, 220], [x1, 360]], { w: 3, tone: 0.32, dryness: 0.5, bristles: 3, profile: "tip", body: 0 });
    // the pallu: the sari's end over her left shoulder, falling across to her right hip, with its border
    mass(dadi.wet, [[800, -20], [910, -20], [1010, 110], [1130, 270], [1200, 390], [1120, 408], [1030, 300], [900, 150], [820, 60]], { tone: 0.2, tone2: 0.27, jitter: 3 });
    stroke(dadi, [[808, -10], [880, 120], [1010, 280], [1118, 404]], { w: 7, tone: 0.5, dryness: 0.35, bristles: 6, profile: "even", loaded: 0.6, body: 0.2 });
    // soft folds over her knees and the dark border at the hem
    for (const pts of [[[620, 470], [760, 452], [900, 478]], [[1020, 470], [1160, 450], [1310, 476]], [[700, 590], [900, 610], [1100, 600]]] as Point[][]) {
        stroke(dadi, pts, { w: 3, tone: 0.26, dryness: 0.55, bristles: 3, profile: "tip", body: 0 });
    }
    stroke(dadi, [[575, 604], [760, 646], [965, 660], [1170, 646], [1360, 604]], { w: 9, tone: 0.5, dryness: 0.4, bristles: 8, profile: "even", loaded: 0.7, body: 0.3 });
    // forearms coming forward onto her lap
    mass(dadi.wet, rightFore, { tone: 0.6, tone2: 0.7, jitter: 1.4 });
    mass(dadi.wet, leftFore, { tone: 0.6, tone2: 0.7, jitter: 1.4 });
    // her right hand, open on her lap: a palm and four fingers
    blob(dadi.wet, hx - 12, hy - 4, 24, 0.66, 0.62);
    for (const [dx, dy] of [[16, -18], [24, -8], [26, 4], [20, 14]]) stroke(dadi, [[hx + 2, hy - 6 + dy / 3], [hx + dx + 12, hy + dy]], { w: 6, tone: 0.7, dryness: 0.1, bristles: 3, profile: "nail", body: 0.5 });
    // her left hand, resting on her knee below the bangle
    const leftHand: Point[] = [[wx - 16, wy + 6], [wx + 18, wy + 8], [wx + 22, wy + 34], [wx + 16, wy + 50], [wx - 14, wy + 50], [wx - 20, wy + 32]];
    solid(ctx, [leftHand]);
    mass(dadi.wet, leftHand, { tone: 0.66, tone2: 0.74, jitter: 1.2 });
    for (const dx of [-11, -3, 5, 13]) stroke(dadi, [[wx + dx, wy + 42], [wx + dx * 1.1, wy + 60]], { w: 8, tone: 0.7, dryness: 0.1, bristles: 4, profile: "nail", body: 0.6 });
    // the bangle: a dark gold band round the wrist (its glint is drawn live)
    const B = PAAN.BANGLE;
    const ring: Point[] = [];
    for (let i = 0; i <= 24; i++) {
        const a = (i / 24) * Math.PI * 2, x = B.RX * Math.cos(a), y = B.RY * Math.sin(a);
        ring.push([wx + x * Math.cos(B.TILT) - y * Math.sin(B.TILT), wy + x * Math.sin(B.TILT) + y * Math.cos(B.TILT)]);
    }
    stroke(dadi, ring, { w: 5, tone: 0.88, dryness: 0, bristles: 4, profile: "even", body: 0.4 });
    ctx.drawImage(flatten(dadi), 0, 0);

    // the brass plate
    const [px, py] = PAAN.PLATE;
    solid(ctx, [ellipse(px, py, 232, 86)]);
    const plateG = group(W, H);
    mass(plateG.wet, ellipse(px, py, 230, 84), { tone: 0.26, tone2: 0.36, jitter: 1.5 });
    stroke(plateG, ellipse(px, py, 230, 84), { w: 6, tone: 0.78, dryness: 0.3, bristles: 5, profile: "even", loaded: 0.6, body: 0.2 });
    stroke(plateG, ellipse(px, py + 6, 196, 68), { w: 2, tone: 0.45, dryness: 0.5, bristles: 2, profile: "even", body: 0 });
    ctx.drawImage(flatten(plateG), 0, 0);

    // the paan box, open: lid tipped back, three compartments, a pile of leaves
    // (one more lies on top: the piece the player drags)
    const X = PAAN.BOX;
    const lid: Point[] = [[X.X0 + 20, X.TOP], [X.X1 - 20, X.TOP], [X.X1 - 50, X.TOP - 60], [X.X0 + 50, X.TOP - 60]];
    const boxBody: Point[] = [[X.X0, X.TOP], [X.X1, X.TOP], [X.X1 + 20, H + 20], [X.X0 - 20, H + 20]];
    solid(ctx, [lid, boxBody]);
    const boxG = group(W, H);
    mass(boxG.wet, lid, { tone: 0.46, tone2: 0.56, jitter: 1.5 });
    mass(boxG.wet, boxBody, { tone: 0.36, tone2: 0.48, jitter: 1.5 });
    stroke(boxG, [[X.X0, X.TOP], [X.X1, X.TOP]], { w: 7, tone: 0.8, dryness: 0.3, bristles: 6, profile: "even", loaded: 0.6, body: 0.2 });
    for (const x of X.DIVIDERS) stroke(boxG, [[x, X.TOP + 4], [x + 6, H]], { w: 4, tone: 0.7, dryness: 0.3, bristles: 3, profile: "even", body: 0 });
    const [lx, ly] = PAAN.LEAF_HOME;
    for (const [dx, dy, a] of [[-14, 18, -0.3], [12, 10, 0.25]]) leafShape(boxG, lx + dx, ly + dy, a, 0.38);
    ctx.drawImage(flatten(boxG), 0, 0);

    bakeGrainAndVignette(ctx);
    return c;
}

// a limb from a to b as a shape that narrows from w0 to w1
function taper(a: Point, b: Point, w0: number, w1: number): Point[] {
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
    const nx = -(b[1] - a[1]) / len, ny = (b[0] - a[0]) / len;
    return [
        [a[0] + nx * w0 / 2, a[1] + ny * w0 / 2], [b[0] + nx * w1 / 2, b[1] + ny * w1 / 2],
        [b[0] - nx * w1 / 2, b[1] - ny * w1 / 2], [a[0] - nx * w0 / 2, a[1] - ny * w0 / 2],
    ];
}

// fill shapes with plain paper colour, so what is behind (floor lines, the
// wall) doesn't show through the washes painted over them. The grain comes
// back when it is baked in at the end
function solid(ctx: CanvasRenderingContext2D, shapes: Point[][]): void {
    ctx.save();
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = PAPER_FILL;
    for (const shape of shapes) {
        ctx.beginPath();
        shape.forEach(([x, y], i) => (i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)));
        ctx.closePath();
        ctx.fill();
    }
    ctx.restore();
}

// "touch here": an open hand in ink, shown pulsing over Amma's belly
function paintHandIcon(): HTMLCanvasElement {
    return piece(110, 120, (g, x, y) => {
        mass(g.wet, [[x - 22, y + 2], [x + 20, y + 2], [x + 22, y + 34], [x - 18, y + 40]], { tone: 0.8, tone2: 0.9, jitter: 1 });
        for (const [dx, len] of [[-16, 34], [-5, 42], [6, 40], [16, 32]]) {
            stroke(g, [[x + dx, y + 4], [x + dx * 1.1, y + 4 - len]], { w: 8, tone: 0.86, dryness: 0.1, bristles: 4, profile: "nail", body: 0.6 });
        }
        stroke(g, [[x + 20, y + 24], [x + 36, y + 8], [x + 42, y - 6]], { w: 8, tone: 0.86, dryness: 0.1, bristles: 4, profile: "nail", body: 0.6 });
    });
}

function paintLanternPlate(): HTMLCanvasElement {
    setSeed(SEED.LANTERN);
    const c = makeCanvas(W, H), ctx = context(c);
    paintPaper(ctx);
    warmWash(ctx, VIEW.LANTERN_HORIZON);

    const far = group(W, H);
    const shorePoly = farShore(far, VIEW.LANTERN_HORIZON);
    const farC = flatten(far);
    fadeBetween(farC, VIEW.LANTERN_HORIZON - 20, VIEW.LANTERN_HORIZON + 6);

    // the sun low on the water, through the veranda frame, setting behind the far shore
    const disc = makeCanvas(W, H), dctx = context(disc);
    const sun = dctx.createRadialGradient(SUN.x, SUN.y, 0, SUN.x, SUN.y, SUN.r);
    sun.addColorStop(0, `rgba(${SUN.rgb},0.4)`);
    sun.addColorStop(0.88, `rgba(${SUN.rgb},0.34)`);
    sun.addColorStop(1, `rgba(${SUN.rgb},0)`);
    dctx.fillStyle = sun;
    dctx.beginPath();
    dctx.arc(SUN.x, SUN.y, SUN.r, 0, Math.PI * 2);
    dctx.fill();
    dctx.globalCompositeOperation = "destination-out";
    dctx.fillStyle = "#000";                     // any solid colour: only its coverage matters here
    dctx.beginPath();
    shorePoly.forEach(([x, y], i) => (i === 0 ? dctx.moveTo(x, y) : dctx.lineTo(x, y)));
    dctx.closePath();
    dctx.fill();
    dctx.fillRect(0, VIEW.LANTERN_HORIZON, W, H - VIEW.LANTERN_HORIZON);
    ctx.drawImage(disc, 0, 0);
    ctx.drawImage(farC, 0, 0);

    const g = group(W, H);
    // the veranda frame: beam, two posts, the ledge, the floor below
    stroke(g, [[-20, 72], [W / 2, 66], [W + 20, 72]], { w: 26, tone: 0.7, dryness: 0.45, bristles: 16, profile: "even", loaded: 0.8, body: 0.5 });
    for (const x of [150, 1770]) stroke(g, [[x, 60], [x + rr(-3, 3), 420], [x, VIEW.LEDGE + 4]], { w: 22, tone: 0.66, dryness: 0.45, bristles: 14, profile: "even", loaded: 0.8, body: 0.5 });
    stroke(g, [[-20, VIEW.LEDGE + 8], [W / 2, VIEW.LEDGE + 10], [W + 20, VIEW.LEDGE + 6]], { w: 18, tone: 0.8, dryness: 0.3, bristles: 14, profile: "even", loaded: 0.8, body: 0.4 });
    boards(g, 850);

    // the hurricane lantern, unlit: tank, filler cap, glass, hood, chimney, handle
    const [cx, cy] = LANTERN.CAP;
    mass(g.wet, [[470, 802], [730, 802], [742, 732], [458, 732]], { tone: 0.64, tone2: 0.8, jitter: 1.5 });
    mass(g.wet, [[cx - 12, 734], [cx + 12, 734], [cx + 12, cy], [cx - 12, cy]], { tone: 0.85, jitter: 0.8 });
    for (const dir of [-1, 1]) {
        stroke(g, [[600 + dir * 104, 728], [600 + dir * 136, 590], [600 + dir * 70, 452]], { w: 4, tone: 0.55, dryness: 0.4, bristles: 4, profile: "even", body: 0.1 });
        stroke(g, [[600 + dir * 70, 726], [600 + dir * 94, 590], [600 + dir * 44, 456]], { w: 2, tone: 0.3, dryness: 0.6, bristles: 2, profile: "even", body: 0 });
    }
    mass(g.wet, [[480, 454], [720, 454], [662, 412], [538, 412]], { tone: 0.74, tone2: 0.84, jitter: 1.5 });
    mass(g.wet, [[570, 414], [630, 414], [624, 380], [576, 380]], { tone: 0.82, jitter: 1 });
    stroke(g, [[462, 740], [452, 520], [520, 360], [600, 340], [680, 360], [748, 520], [738, 740]], { w: 3, tone: 0.7, dryness: 0.3, bristles: 3, profile: "even", body: 0 });
    mass(g.wet, [[588, 726], [612, 726], [610, 696], [590, 696]], { tone: 0.6, jitter: 0.6 });

    ctx.drawImage(flatten(g), 0, 0);
    bakeGrainAndVignette(ctx);
    return c;
}

// a betel leaf: heart-shaped, a midrib and curved veins. a = rotation
function leafShape(g: InkLayer, x: number, y: number, a: number, tone: number): void {
    const local: Point[] = [[0, -70], [-28, -96], [-66, -88], [-86, -40], [-78, 20], [-44, 70], [0, 108], [44, 70], [78, 20], [86, -40], [66, -88], [28, -96]];
    const rot = ([px, py]: Point): Point => [x + px * Math.cos(a) - py * Math.sin(a), y + px * Math.sin(a) + py * Math.cos(a)];
    mass(g.wet, local.map(rot), { tone, tone2: tone * 1.25, jitter: 1.5 });
    stroke(g, [[0, -72], [2, 10], [0, 104]].map((p) => rot(p as Point)), { w: 3, tone: tone + 0.35, dryness: 0.3, bristles: 3, profile: "tip", body: 0 });
    for (const [vy, side] of [[-40, 1], [-40, -1], [0, 1], [0, -1], [40, 1], [40, -1]]) {
        stroke(g, [[1, vy], [side * 34, vy - 10], [side * 62, vy + 6]].map((p) => rot(p as Point)), { w: 1.6, tone: tone + 0.2, dryness: 0.5, bristles: 2, profile: "tip", body: 0 });
    }
}

// a piece on its own transparent canvas, painted around its middle
function piece(w: number, h: number, paint: (g: InkLayer, cx: number, cy: number) => void, lime?: (ctx: CanvasRenderingContext2D, cx: number, cy: number) => void): HTMLCanvasElement {
    setSeed(SEED.PIECES);
    const g = group(w, h);
    paint(g, w / 2, h / 2);
    const out = makeCanvas(w, h), octx = context(out);
    octx.drawImage(flatten(g), 0, 0);
    lime?.(octx, w / 2, h / 2);
    return out;
}

function limeDab(ctx: CanvasRenderingContext2D, x: number, y: number, rx: number, ry: number): void {
    ctx.fillStyle = LIME;
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
}

// every close-up picture the game loads
export function stillJobs(): StillJob[] {
    const [bw, bh] = LANTERN.BOTTLE_SIZE;
    return [
        { name: STILL.PAAN_PLATE, paint: paintPaanPlate },
        { name: STILL.LANTERN_PLATE, paint: paintLanternPlate },
        { name: STILL.HAND_ICON, paint: paintHandIcon },
        { name: STILL.LEAF, paint: () => piece(240, 260, (g, x, y) => leafShape(g, x, y, 0, 0.48)) },
        {
            name: STILL.CHUN, paint: () => piece(140, 130, (g, x, y) => {
                mass(g.wet, ellipse(x, y + 12, 46, 36), { tone: 0.5, tone2: 0.66, jitter: 1.2 });
                stroke(g, ellipse(x, y - 22, 30, 9, 20), { w: 4, tone: 0.85, dryness: 0.2, bristles: 3, profile: "even", body: 0 });
            }, (ctx, x, y) => limeDab(ctx, x, y - 22, 25, 6)),
        },
        {
            name: STILL.SUPARI, paint: () => piece(180, 120, (g, x, y) => {
                mass(g.wet, [[x - 72, y + 4], [x + 72, y + 4], [x + 52, y + 32], [x - 52, y + 32]], { tone: 0.46, tone2: 0.6, jitter: 1.4 });
                for (let i = 0; i < 9; i++) blob(g.wet, x + rr(-48, 48), y + rr(-10, 4), rr(6, 10), rr(0.6, 0.82), 0.8);
            }),
        },
        { name: STILL.CHUN_DAB, paint: () => piece(90, 60, (g, x, y) => stroke(g, ellipse(x, y, 26, 11, 18), { w: 1.5, tone: 0.35, dryness: 0.5, bristles: 2, profile: "even", body: 0 }), (ctx, x, y) => limeDab(ctx, x, y, 25, 10)) },
        {
            name: STILL.SUPARI_BITS, paint: () => piece(100, 70, (g, x, y) => {
                for (let i = 0; i < 7; i++) blob(g.wet, x + rr(-26, 26), y + rr(-12, 12), rr(5, 8), rr(0.62, 0.85), 0.8);
            }),
        },
        {
            name: STILL.PAAN_FOLDED, paint: () => piece(150, 150, (g, x, y) => {
                mass(g.wet, [[x - 46, y - 30], [x + 48, y - 38], [x + 6, y + 54]], { tone: 0.5, tone2: 0.64, jitter: 1.5 });
                stroke(g, [[x - 40, y - 26], [x + 2, y - 6], [x + 6, y + 48]], { w: 3, tone: 0.85, dryness: 0.3, bristles: 3, profile: "tip", body: 0 });
            }),
        },
        {
            name: STILL.BOTTLE, paint: () => piece(bw, bh, (g, x, y) => {
                const B: Point[] = [[-50, 140], [50, 140], [50, -50], [30, -80], [14, -84], [14, -140], [-14, -140], [-14, -84], [-30, -80], [-50, -50]];
                mass(g.wet, B.map(([px, py]): Point => [x + px, y + py]), { tone: 0.12, tone2: 0.18, jitter: 1 });
                for (const dir of [-1, 1]) {
                    stroke(g, [[x + dir * 50, y + 140], [x + dir * 50, y - 50], [x + dir * 30, y - 80], [x + dir * 14, y - 84], [x + dir * 14, y - 140]], { w: 3, tone: 0.62, dryness: 0.3, bristles: 3, profile: "even", body: 0 });
                }
                stroke(g, [[x - 50, y + 140], [x + 50, y + 140]], { w: 3, tone: 0.62, dryness: 0.3, bristles: 3, profile: "even", body: 0 });
                mass(g.wet, [[x - 16, y - 140], [x + 16, y - 140], [x + 16, y - 150], [x - 16, y - 150]], { tone: 0.85, jitter: 0.6 });
            }),
        },
    ];
}
