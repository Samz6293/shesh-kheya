// The ink brush. A stroke is a smooth line through a few points, drawn as many
// thin "bristles" that break up when the brush is dry (flying white), over a
// soft wet body. Shapes come from strokes like these, never from outlines.
// Technique reference: lemomo-ai/lemo-opuscar, style "ink-wash" (MIT).
import { inkRGBA } from "../shared/ink";
import { noise, rr, strokeSalt } from "./seed";
import type { InkLayer, Point, StrokeOptions } from "../types";

const DEFAULTS: Required<StrokeOptions> = {
    w: 6, tone: 0.8, dryness: 0.2, profile: "brush", bristles: 12, loaded: 0, body: 0.5, fade: 0.6, gap: 26,
};

// how wide the stroke is along its length (t = 0 start, 1 end), from 0 to 1
const PROFILES: Record<Required<StrokeOptions>["profile"], (t: number) => number> = {
    brush: t => Math.pow(Math.sin(Math.PI * Math.min(1, t * 1.15 + 0.04)), 0.55),
    tip: t => Math.pow(1 - t, 0.8) * Math.min(1, t * 8 + 0.3),
    rise: t => Math.min(1, 0.15 + t * 1.1) * Math.min(1, (1 - t) * 10),
    even: t => Math.min(1, t * 12 + 0.2) * Math.min(1, (1 - t) * 12 + 0.2),
    nail: t => Math.min(1, t * 6 + 0.5) * Math.pow(1 - t, 0.35),
};

// a smooth curve through the points (Catmull-Rom spline), as many small steps
function spline(pts: Point[], step = 1.2): Point[] {
    const out: Point[] = [];
    for (let i = 0; i < pts.length - 1; i++) {
        const p0 = pts[Math.max(i - 1, 0)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(i + 2, pts.length - 1)];
        const seg = Math.hypot(p2[0] - p1[0], p2[1] - p1[1]);
        const m = Math.max(2, Math.ceil(seg / step));
        for (let k = 0; k < m; k++) {
            const t = k / m, t2 = t * t, t3 = t2 * t;
            const f = (a: number, b: number, c: number, d: number) =>
                0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
            out.push([f(p0[0], p1[0], p2[0], p3[0]), f(p0[1], p1[1], p2[1], p3[1])]);
        }
    }
    out.push(pts[pts.length - 1]);
    return out;
}

export function stroke(g: InkLayer, pts: Point[], options: StrokeOptions): void {
    const opt = { ...DEFAULTS, ...options };
    const S = spline(pts);

    // distance along the line at each step
    const cum = [0];
    for (let i = 1; i < S.length; i++) cum.push(cum[i - 1] + Math.hypot(S[i][0] - S[i - 1][0], S[i][1] - S[i - 1][1]));
    const L = cum[cum.length - 1] || 1;
    const prof = PROFILES[opt.profile];
    const salt = strokeSalt();

    // the direction across the stroke at each step
    const nrm: Point[] = S.map((_, i) => {
        const a = S[Math.max(0, i - 1)], b = S[Math.min(S.length - 1, i + 1)];
        const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1;
        return [-dy / l, dx / l];
    });
    const width = (i: number) => opt.w * prof(cum[i] / L) * (1 + 0.18 * (noise(salt, cum[i] / 40) - 0.5));

    // wet body: a soft shape under the bristles (it is blurred later)
    const fill = opt.tone * opt.body * Math.pow(1 - opt.dryness, 1.6);
    if (fill > 0.01) {
        g.wet.beginPath();
        for (let i = 0; i < S.length; i++) {
            const half = width(i) / 2;
            const x = S[i][0] + nrm[i][0] * half, y = S[i][1] + nrm[i][1] * half;
            if (i === 0) g.wet.moveTo(x, y);
            else g.wet.lineTo(x, y);
        }
        for (let i = S.length - 1; i >= 0; i--) {
            const half = width(i) / 2;
            g.wet.lineTo(S[i][0] - nrm[i][0] * half, S[i][1] - nrm[i][1] * half);
        }
        g.wet.closePath();
        g.wet.fillStyle = inkRGBA(fill);
        g.wet.fill();
    }

    // bristles: thin lines side by side; a dry brush skips bits of each one
    const dry = g.dry;
    dry.lineCap = "round";
    for (let b = 0; b < opt.bristles; b++) {
        const off = opt.bristles === 1 ? 0 : (b / (opt.bristles - 1)) * 2 - 1 + rr(-0.06, 0.06);
        const load = rr(0.8, 1.1);
        dry.lineWidth = Math.max(0.6, (opt.w / opt.bristles) * rr(1.4, 2.6));
        for (let i = 1; i < S.length; i++) {
            const t = cum[i] / L;
            if (prof(t) < 0.03) continue;
            if (noise(b * 3.7 + salt, cum[i] / opt.gap) < opt.dryness * (0.35 + 0.9 * t)) continue;
            const w0 = width(i - 1) / 2, w1 = width(i) / 2;
            // a "loaded" brush is darker on one side, which gives shape without an outline
            const side = 1 + opt.loaded * off * 0.6;
            const a = Math.min(1, opt.tone * load * (1 - opt.fade * 0.55 * t) * side * (0.42 + 0.25 * noise(b * 1.3, cum[i] / 60)));
            dry.strokeStyle = inkRGBA(a);
            dry.beginPath();
            dry.moveTo(S[i - 1][0] + nrm[i - 1][0] * off * w0, S[i - 1][1] + nrm[i - 1][1] * off * w0);
            dry.lineTo(S[i][0] + nrm[i][0] * off * w1, S[i][1] + nrm[i][1] * off * w1);
            dry.stroke();
        }
    }
}
