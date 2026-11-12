// composeFrame(): draws one whole frame from a plate, sprites and a few numbers.
// The renderer calls it for every video frame and the game calls it for every
// live frame, which is why a clip's last frame and the first live frame match
// (handoff rule 1). Order: plate, glints behind the figures (a kupi in the
// house), reflections, rings, sprites (far to near, each solid against what
// is behind it), swaying foreground, darkness, glints on the figures (a
// bangle), light.
import { depthScale, depthY, bob, STAGE, SYNC } from "./depth";
import { inkRGBA } from "./ink";
import { drawFlashAndFade, drawGlints, drawLightRing, drawLights, drawMarker } from "./lights";
import type { FrameSprite, FrameState, Front, Plate, Ring } from "../types";

// the night wash, top to bottom of the picture, as "r,g,b" + strength at darkness 1
const NIGHT = [
    { at: 0, rgb: "58,52,82", a: 0.62 },
    { at: 0.55, rgb: "92,82,108", a: 0.42 },
    { at: 1, rgb: "70,64,86", a: 0.5 },
];

const RING = {
    LIFE: 2.4,                    // seconds until a ring has faded
    COUNT: 3,                     // each stroke leaves three rings, one after another
    DELAY: 0.18,
    START: 14,
    GROW: 70,
    POWER: 0.6,                   // radius grows as age^0.6: fast, then slower
    ARC: Math.PI * 1.86,          // an open ring, like a brush circle
};

// reeds in the wind: two waves whose periods divide SYNC, so the sway is at
// the same point at every join and clips meet live play without a jump
const SWAY = {
    SLOW: SYNC,                   // seconds
    FAST: SYNC / 2,
    FAST_SHARE: 0.25,             // how much of the movement is the quick flutter
    SLICE: 4,                     // px: a reed bends by drawing it in thin rows, each shifted
};

const SOLID = {
    BLUR: "blur(1.5px)",          // closes the gaps between bristle marks, and leaves a hair of paper round each figure
    STACK: 8,                     // copies drawn on top of each other: even a pale wash becomes fully solid
    PAD: 12,                      // px of slack round a sprite's on-screen box (bob, roll)
};

// withLights = false is for the renderer: clips never contain the lantern glow,
// the game draws it on top of the video from the clip's track.
// withFront = false leaves the foreground out (a scene whose reeds are drawn live over its clips)
export function composeFrame(ctx: CanvasRenderingContext2D, plate: Plate, st: FrameState, withLights = true, withFront = true): void {
    ctx.save();
    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = 1;
    ctx.drawImage(plate.img, 0, 0);
    // glints are the same for every player, so clips have them too
    drawGlints(ctx, st.glints, st.t, true);

    // far things first, so nearer boats cover them
    st.sprites.sort((a, b) => a.z - b.z);

    // ink is drawn with multiply, so it picks up the paper grain under it
    ctx.globalCompositeOperation = "multiply";
    for (const s of st.sprites) drawSprite(ctx, s, s.art.refl, st.t);
    drawRings(ctx, st.rings, st.t);
    drawSolid(ctx, st.sprites, plate.backing, st.t);
    if (withFront) drawFront(ctx, plate.front, st.t);

    drawDarkness(ctx, st.darkness);
    ctx.restore();
    drawGlints(ctx, st.glints, st.t, false);
    if (st.ring) drawLightRing(ctx, st.ring.x, st.ring.y, st.ring.radius, st.ring.u);

    if (withLights) {
        if (st.marker) drawMarker(ctx, st.marker, st.t);
        drawLights(ctx, st.boat, st.oil, st.darkness, st.boat?.lit ?? 1);
    }
    drawFlashAndFade(ctx, st.flash, st.fade);
}

// sprites drawn on top of a finished frame (S3's memories, over a clip or a
// live frame): reflections first, then each one solid, exactly as in a frame
export function drawFigures(ctx: CanvasRenderingContext2D, sprites: FrameSprite[], backing: CanvasImageSource, t: number): void {
    ctx.save();
    ctx.globalCompositeOperation = "multiply";
    for (const s of sprites) drawSprite(ctx, s, s.art.refl, t);
    drawSolid(ctx, sprites, backing, t);
    ctx.restore();
}

function drawSolid(ctx: CanvasRenderingContext2D, sprites: FrameSprite[], backing: CanvasImageSource, t: number): void {
    for (const s of sprites) {
        clearBehind(ctx, s, backing, t);
        drawSprite(ctx, s, s.art.img, t);
    }
}

// a figure on a floor (s.y set) stands still, at full size unless it says
// otherwise; anything on the water sits at its depth and bobs
function spriteScale(s: FrameSprite): number {
    return s.y === undefined ? depthScale(s.z) : s.scale ?? 1;
}

function spriteY(s: FrameSprite, t: number): number {
    return s.y ?? depthY(s.z) + bob(t, depthScale(s.z));
}

function drawSprite(ctx: CanvasRenderingContext2D, s: FrameSprite, img: CanvasImageSource, t: number): void {
    const scale = spriteScale(s);
    ctx.save();
    ctx.translate(s.x, spriteY(s, t));
    ctx.rotate(s.roll);
    ctx.scale(scale * s.sx, scale);
    ctx.drawImage(img, -s.def.ax, -s.def.ay);
    ctx.restore();
}

// New here: bending a picture without a mesh. Each reed is drawn in thin
// horizontal rows; a row is shifted sideways by sway × (height above the
// root)², so the root stays put and the tip moves most, like a real stem.
export function drawFront(ctx: CanvasRenderingContext2D, front: Front, t: number): void {
    ctx.save();
    ctx.globalCompositeOperation = "multiply";
    drawFrontPieces(ctx, front, t);
    ctx.restore();
}

function drawFrontPieces(ctx: CanvasRenderingContext2D, front: Front, t: number): void {
    for (const p of front.pieces) {
        if (p.sway === 0) {
            ctx.drawImage(front.img, p.sx, p.sy, p.w, p.h, p.x, p.y, p.w, p.h);
            continue;
        }
        const wind = (1 - SWAY.FAST_SHARE) * Math.sin((2 * Math.PI * t) / SWAY.SLOW + p.phase)
            + SWAY.FAST_SHARE * Math.sin((2 * Math.PI * t) / SWAY.FAST + 2 * p.phase);
        const root = p.root ?? p.h;
        for (let y = 0; y < p.h; y += SWAY.SLICE) {
            const rows = Math.min(SWAY.SLICE, p.h - y);
            const up = Math.max(0, 1 - (y + rows / 2) / root);     // 1 at the tip, 0 at the root and below
            const dx = p.sway * wind * up * up;
            ctx.drawImage(front.img, p.sx, p.sy + y, p.w, rows, p.x + dx, p.y + y, p.w, rows);
        }
    }
}

// New here: solid figures on see-through ink. Ink is drawn with "multiply",
// so a pale wash lets whatever is behind it show through (hyacinth through a
// hull, one boat through the other). Before a figure's ink goes on, we:
//   1. punch a hole in its outline ("destination-out" erases where we draw),
//   2. fill only the hole with the backing, plain paper and sky
//      ("destination-over" draws only where the canvas is see-through).
// The ink then lands on clean paper, exactly as it was painted, and the paper
// grain stays continuous because the backing is the plate's own paper.
// Docs: MDN, globalCompositeOperation
function clearBehind(ctx: CanvasRenderingContext2D, s: FrameSprite, backing: CanvasImageSource, t: number): void {
    const scale = spriteScale(s), y = spriteY(s, t), d = s.def;
    const op = ctx.globalCompositeOperation;
    ctx.globalCompositeOperation = "destination-out";
    drawSprite(ctx, s, solidMask(s.art.img, d.w, d.h), t);

    // only the sprite's box needs the backing, which keeps this cheap
    const half = Math.max(d.ax, d.w - d.ax) * scale + SOLID.PAD;
    const x0 = Math.max(0, Math.floor(s.x - half)), x1 = Math.min(STAGE.W, Math.ceil(s.x + half));
    const y0 = Math.max(0, Math.floor(y - d.ay * scale - SOLID.PAD)), y1 = Math.min(STAGE.H, Math.ceil(y + (d.h - d.ay) * scale + SOLID.PAD));
    ctx.globalCompositeOperation = "destination-over";
    if (x1 > x0 && y1 > y0) ctx.drawImage(backing, x0, y0, x1 - x0, y1 - y0, x0, y0, x1 - x0, y1 - y0);
    ctx.globalCompositeOperation = op;
}

// each sprite's solid outline, made once and kept (WeakMap: dropped with the sprite)
const masks = new WeakMap<CanvasImageSource, HTMLCanvasElement>();
function solidMask(img: CanvasImageSource, w: number, h: number): HTMLCanvasElement {
    let mask = masks.get(img);
    if (mask) return mask;
    mask = document.createElement("canvas");
    mask.width = w;
    mask.height = h;
    const mctx = mask.getContext("2d");
    if (!mctx) throw new Error("Canvas 2D is not available");
    mctx.filter = SOLID.BLUR;
    for (let i = 0; i < SOLID.STACK; i++) mctx.drawImage(img, 0, 0);
    masks.set(img, mask);
    return mask;
}

// open ink rings where an oar touched the water
function drawRings(ctx: CanvasRenderingContext2D, rings: Ring[], t: number): void {
    for (const r of rings) {
        const age = t - r.born;
        if (age < 0 || age > RING.LIFE) continue;
        const life = 1 - age / RING.LIFE;
        for (let k = 0; k < RING.COUNT; k++) {
            const ageK = age - k * RING.DELAY;
            if (ageK <= 0) continue;
            const rad = (RING.START + RING.GROW * Math.pow(ageK, RING.POWER)) * r.scale;
            ctx.strokeStyle = inkRGBA(0.42 * life * (1 - k * 0.28));
            ctx.lineWidth = Math.max(0.8, (2.4 - k * 0.5) * r.scale * life);
            ctx.beginPath();
            ctx.ellipse(r.x, r.y, rad * 1.4, rad * 0.24, 0, r.a0 + k, r.a0 + k + RING.ARC);
            ctx.stroke();
        }
    }
}

// extra night on top of the plate: 0 = as painted, 1 = darkest
function drawDarkness(ctx: CanvasRenderingContext2D, d: number): void {
    if (d <= 0) return;
    const gr = ctx.createLinearGradient(0, 0, 0, STAGE.H);
    for (const stop of NIGHT) gr.addColorStop(stop.at, `rgba(${stop.rgb},${stop.a * d})`);
    ctx.fillStyle = gr;
    ctx.fillRect(0, 0, STAGE.W, STAGE.H);
}
