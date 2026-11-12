// The paper every plate is painted on: a warm base with cloud-like mottling
// and fine fibres, plus the grain and vignette that are baked in at the end.
// Grain is baked into the plate, and ink drawn later uses "multiply", so
// sprites drawn on top by the game still pick up the paper texture.
import { STAGE } from "../shared/depth";
import { fbm, noise, rr } from "./seed";
import { context, makeCanvas } from "./layers";

const PAPER = {
    BASE: [242, 236, 222],                    // #F2ECDE
    FIBRES: 2600,
    FIBRE_ANGLES: [0.3, 1.9, 2.7],            // three directions
    FIBRE_LIGHT: "rgba(255,252,244,0.35)",
    FIBRE_DARK: "rgba(120,105,85,0.10)",
    GRAIN: 0.6,
    VIGNETTE: "rgba(140,125,110,0.3)",
};

export function paintPaper(ctx: CanvasRenderingContext2D): void {
    const { W, H } = STAGE;
    const img = ctx.createImageData(W, H), d = img.data;
    for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
            // big soft mottling + a tiny bit of fine noise
            const l = 1 + (fbm(x / 260, y / 260, 4) - 0.5) * 0.12 + (noise(x / 2.2, y / 2.2) - 0.5) * 0.025;
            const i = (y * W + x) * 4;
            d[i] = PAPER.BASE[0] * l;
            d[i + 1] = PAPER.BASE[1] * l;
            d[i + 2] = PAPER.BASE[2] * l;
            d[i + 3] = 255;
        }
    }
    ctx.putImageData(img, 0, 0);

    // fibres: short light lines, every fifth one dark
    for (let i = 0; i < PAPER.FIBRES; i++) {
        const x = rr(0, W), y = rr(0, H), len = rr(6, 26);
        const ang = PAPER.FIBRE_ANGLES[i % 3] + rr(-0.3, 0.3);
        ctx.strokeStyle = i % 5 === 0 ? PAPER.FIBRE_DARK : PAPER.FIBRE_LIGHT;
        ctx.lineWidth = rr(0.4, 1);
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + Math.cos(ang) * len, y + Math.sin(ang) * len);
        ctx.stroke();
    }
}

// call with ctx in "multiply" mode, after all ink layers are on the plate
export function bakeGrainAndVignette(ctx: CanvasRenderingContext2D): void {
    const { W, H } = STAGE;
    const grain = makeCanvas(W, H), gctx = context(grain);
    const img = gctx.createImageData(W, H), d = img.data;
    for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
            const v = 255 * (1 - 0.1 * (noise(x / 3, y / 3) * 0.6 + noise(x / 11, y / 11) * 0.4));
            const i = (y * W + x) * 4;
            d[i] = v;
            d[i + 1] = v;
            d[i + 2] = v;
            d[i + 3] = 255;
        }
    }
    gctx.putImageData(img, 0, 0);
    ctx.globalAlpha = PAPER.GRAIN;
    ctx.drawImage(grain, 0, 0);
    ctx.globalAlpha = 1;

    // darker corners; radii come from the short and long side so it also works on tall canvases
    const v = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.45, W / 2, H / 2, Math.max(W, H) * 0.62);
    v.addColorStop(0, "rgba(255,255,255,0)");
    v.addColorStop(1, PAPER.VIGNETTE);
    ctx.fillStyle = v;
    ctx.fillRect(0, 0, W, H);
}
