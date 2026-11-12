// Wet and dry ink layers. Each group of strokes is painted on two canvases:
// "wet" (soft bodies and masses) and "dry" (crisp bristles). flatten() bleeds
// the wet one like ink soaking into paper and puts the dry one on top.
import { rr, setSeed } from "./seed";
import type { InkLayer } from "../types";

export function makeCanvas(w: number, h: number): HTMLCanvasElement {
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    return c;
}

// getContext can return null in theory (unsupported browser); fail loudly then
export function context(c: HTMLCanvasElement): CanvasRenderingContext2D {
    const ctx = c.getContext("2d");
    if (!ctx) throw new Error("Canvas 2D is not available");
    return ctx;
}

export function group(w: number, h: number): InkLayer {
    const wetC = makeCanvas(w, h), dryC = makeCanvas(w, h);
    return { w, h, wetC, dryC, wet: context(wetC), dry: context(dryC) };
}

// wet layer: blurred, with extra pigment collected at its edges; dry layer: crisp
export function flatten(g: InkLayer): HTMLCanvasElement {
    const res = makeCanvas(g.w, g.h), ctx = context(res);
    // New here: ctx.filter applies a CSS filter (here a blur) to whatever is drawn next.
    // Docs: MDN, CanvasRenderingContext2D.filter
    ctx.filter = "blur(3px)";
    ctx.drawImage(g.wetC, 0, 0);

    // the edge: a slightly blurred copy minus a very blurred copy leaves a rim
    const edge = makeCanvas(g.w, g.h), ectx = context(edge);
    ectx.filter = "blur(1.2px)";
    ectx.drawImage(g.wetC, 0, 0);
    ectx.filter = "blur(9px)";
    ectx.globalCompositeOperation = "destination-out";
    ectx.globalAlpha = 0.92;
    ectx.drawImage(g.wetC, 0, 0);

    ctx.filter = "none";
    ctx.globalAlpha = 0.85;
    ctx.drawImage(edge, 0, 0);
    ctx.globalAlpha = 1;
    ctx.filter = "blur(0.35px)";
    ctx.drawImage(g.dryC, 0, 0);
    ctx.filter = "none";
    return res;
}

// fade a layer out between two heights, with a level mask (mist is never sloped)
export function fadeBetween(c: HTMLCanvasElement, yFull: number, yGone: number): void {
    const ctx = context(c);
    ctx.save();
    // "destination-in" keeps what is already drawn only where the new shape is opaque
    ctx.globalCompositeOperation = "destination-in";
    const gr = ctx.createLinearGradient(0, yFull, 0, yGone);
    gr.addColorStop(0, "rgba(0,0,0,1)");
    gr.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = gr;
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.restore();
}

// a broken, fading, wobbly reflection of `src` under a waterline
export function reflect(src: HTMLCanvasElement, waterY: number, alpha: number, depth: number, seed: number): HTMLCanvasElement {
    setSeed(seed);
    const w = src.width, h = src.height;

    // flip the picture upside down around the waterline
    const flipped = makeCanvas(w, h), ctx = context(flipped);
    ctx.save();
    ctx.translate(0, waterY * 2);
    ctx.scale(1, -1);
    ctx.drawImage(src, 0, 0);
    ctx.restore();
    ctx.clearRect(0, 0, w, waterY);

    // cut level gaps out of it and fade it with depth
    ctx.globalCompositeOperation = "destination-out";
    for (let y = waterY; y < waterY + depth; y += rr(2, 6)) {
        ctx.fillStyle = `rgba(0,0,0,${rr(0.4, 1)})`;
        ctx.fillRect(0, y, w, rr(1, 3.5));
    }
    const gr = ctx.createLinearGradient(0, waterY, 0, waterY + depth);
    gr.addColorStop(0, "rgba(0,0,0,0.25)");
    gr.addColorStop(1, "rgba(0,0,0,1)");
    ctx.fillStyle = gr;
    ctx.fillRect(0, waterY, w, h - waterY);

    // copy it in thin slices, each shifted sideways a little: the wobble
    const out = makeCanvas(w, h), octx = context(out);
    octx.globalAlpha = alpha;
    octx.filter = "blur(1.5px)";
    for (let y = waterY; y < Math.min(h, waterY + depth); y += 4) {
        const dx = Math.sin(y * 0.21) * 3;
        octx.drawImage(flipped, 0, y, w, 4, dx, y, w, 4);
    }
    return out;
}
