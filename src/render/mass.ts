// Ink masses: roofs, hulls, tree crowns, clouds. A mass is a shape with
// slightly wobbly edges and a top-to-bottom gradient, never a flat fill,
// so it reads as a wash of ink.
import { inkRGBA } from "../shared/ink";
import { noise } from "./seed";
import type { MassOptions, Point } from "../types";

export function mass(ctx: CanvasRenderingContext2D, poly: Point[], options: MassOptions): void {
    const tone = options.tone ?? 0.5;
    const tone2 = options.tone2 ?? tone * 0.75;
    const jitter = options.jitter ?? 3;

    // walk each edge in small steps and push every step in or out a little
    const pts: Point[] = [];
    for (let i = 0; i < poly.length; i++) {
        const a = poly[i], b = poly[(i + 1) % poly.length];
        const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
        const n = Math.max(1, Math.ceil(len / 5));
        const nx = -(b[1] - a[1]) / (len || 1), ny = (b[0] - a[0]) / (len || 1);
        for (let k = 0; k < n; k++) {
            const t = k / n;
            const px = a[0] + t * (b[0] - a[0]), py = a[1] + t * (b[1] - a[1]);
            const j = (noise(px / 9 + 50, py / 9) - 0.5) * 2 * jitter;
            pts.push([px + nx * j, py + ny * j]);
        }
    }

    let top = Infinity, bottom = -Infinity;
    for (const p of pts) {
        top = Math.min(top, p[1]);
        bottom = Math.max(bottom, p[1]);
    }
    const gr = ctx.createLinearGradient(0, top, 0, bottom + 0.01);
    gr.addColorStop(0, inkRGBA(tone));
    gr.addColorStop(1, inkRGBA(tone2));
    ctx.fillStyle = gr;
    ctx.beginPath();
    pts.forEach((p, i) => {
        if (i === 0) ctx.moveTo(p[0], p[1]);
        else ctx.lineTo(p[0], p[1]);
    });
    ctx.closePath();
    ctx.fill();
}

// a soft round mass; squash < 1 flattens it
export function blob(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, tone: number, squash = 1): void {
    const poly: Point[] = [];
    for (let i = 0; i < 18; i++) {
        const a = (i / 18) * Math.PI * 2;
        const rad = r * (0.85 + 0.3 * noise(cx / 7 + Math.cos(a), cy / 7 + Math.sin(a)));
        poly.push([cx + Math.cos(a) * rad, cy + Math.sin(a) * rad * squash]);
    }
    mass(ctx, poly, { tone, tone2: tone * 0.8, jitter: r * 0.12 });
}
