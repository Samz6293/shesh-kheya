// Ink brush engine used only by the offline renderer (videos, plate, sprites).
// Strokes are Catmull-Rom centrelines drawn as many thin "bristles" that break up
// when dry, plus a soft wet body; masses are jittered polygons with gradients.
// Everything is seeded, so the same pose always paints the same pixels.

let seed = 1;
function setSeed(n) { seed = n; strokeIndex = 0; }
function rand() {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
}
const rr = (a, b) => a + (b - a) * rand();

function hash(x, y) {
    const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
    return s - Math.floor(s);
}
function noise(x, y) {
    const xi = Math.floor(x), yi = Math.floor(y);
    const xf = x - xi, yf = y - yi;
    const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
    const a = hash(xi, yi), b = hash(xi + 1, yi), c = hash(xi, yi + 1), d = hash(xi + 1, yi + 1);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
function fbm(x, y, oct = 4) {
    let s = 0, amp = 0.5, f = 1;
    for (let i = 0; i < oct; i++) { s += amp * noise(x * f, y * f); f *= 2; amp *= 0.5; }
    return s;
}

function makeCanvas(w, h) {
    const c = document.createElement("canvas");
    c.width = w; c.height = h;
    return c;
}

// ---------- spline + stroke profiles ----------
function spline(pts, step = 1.2) {
    const out = [];
    for (let i = 0; i < pts.length - 1; i++) {
        const p0 = pts[Math.max(i - 1, 0)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(i + 2, pts.length - 1)];
        const seg = Math.hypot(p2[0] - p1[0], p2[1] - p1[1]);
        const m = Math.max(2, Math.ceil(seg / step));
        for (let k = 0; k < m; k++) {
            const t = k / m, t2 = t * t, t3 = t2 * t;
            const f = (a, b, c, d) => 0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
            out.push([f(p0[0], p1[0], p2[0], p3[0]), f(p0[1], p1[1], p2[1], p3[1])]);
        }
    }
    out.push(pts[pts.length - 1]);
    return out;
}

const profiles = {
    brush: t => Math.pow(Math.sin(Math.PI * Math.min(1, t * 1.15 + 0.04)), 0.55),
    tip: t => Math.pow(1 - t, 0.8) * Math.min(1, t * 8 + 0.3),
    rise: t => Math.min(1, 0.15 + t * 1.1) * Math.min(1, (1 - t) * 10),
    even: t => Math.min(1, t * 12 + 0.2) * Math.min(1, (1 - t) * 12 + 0.2),
    nail: t => Math.min(1, t * 6 + 0.5) * Math.pow(1 - t, 0.35),
};

let strokeIndex = 0;
function stroke(g, pts, o) {
    const opt = Object.assign({ w: 6, tone: 0.8, dryness: 0.2, profile: "brush", bristles: 12, loaded: 0, body: 0.5, fade: 0.6, gap: 26 }, o);
    const dry = g.dry, wet = g.wet;
    const S = spline(pts);
    const cum = [0];
    for (let i = 1; i < S.length; i++) cum.push(cum[i - 1] + Math.hypot(S[i][0] - S[i - 1][0], S[i][1] - S[i - 1][1]));
    const L = cum[cum.length - 1] || 1;
    const prof = profiles[opt.profile];
    const si = strokeIndex++ * 17.31;
    const nrm = S.map((p, i) => {
        const a = S[Math.max(0, i - 1)], b = S[Math.min(S.length - 1, i + 1)];
        const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1;
        return [-dy / l, dx / l];
    });
    const width = i => opt.w * prof(cum[i] / L) * (1 + 0.18 * (noise(si, cum[i] / 40) - 0.5));

    // wet body: soft halo under the bristles
    const fill = opt.tone * opt.body * Math.pow(1 - opt.dryness, 1.6);
    if (fill > 0.01) {
        wet.beginPath();
        for (let i = 0; i < S.length; i++) {
            const w2 = width(i) / 2;
            const x = S[i][0] + nrm[i][0] * w2, y = S[i][1] + nrm[i][1] * w2;
            i === 0 ? wet.moveTo(x, y) : wet.lineTo(x, y);
        }
        for (let i = S.length - 1; i >= 0; i--) {
            const w2 = width(i) / 2;
            wet.lineTo(S[i][0] - nrm[i][0] * w2, S[i][1] - nrm[i][1] * w2);
        }
        wet.closePath();
        wet.fillStyle = inkRGBA(fill);
        wet.fill();
    }

    // bristles: texture, "flying white" gaps when dry
    const nb = opt.bristles;
    dry.lineCap = "round";
    for (let b = 0; b < nb; b++) {
        const off = nb === 1 ? 0 : (b / (nb - 1)) * 2 - 1 + rr(-0.06, 0.06);
        const load0 = rr(0.8, 1.1);
        dry.lineWidth = Math.max(0.6, (opt.w / nb) * rr(1.4, 2.6));
        for (let i = 1; i < S.length; i++) {
            const t = cum[i] / L;
            if (prof(t) < 0.03) continue;
            if (noise(b * 3.7 + si, cum[i] / opt.gap) < opt.dryness * (0.35 + 0.9 * t)) continue;
            const w0 = width(i - 1) / 2, w1 = width(i) / 2;
            const side = 1 + opt.loaded * off * 0.6;
            const a = Math.min(1, opt.tone * load0 * (1 - opt.fade * 0.55 * t) * side * (0.42 + 0.25 * noise(b * 1.3, cum[i] / 60)));
            dry.strokeStyle = inkRGBA(a);
            dry.beginPath();
            dry.moveTo(S[i - 1][0] + nrm[i - 1][0] * off * w0, S[i - 1][1] + nrm[i - 1][1] * off * w0);
            dry.lineTo(S[i][0] + nrm[i][0] * off * w1, S[i][1] + nrm[i][1] * off * w1);
            dry.stroke();
        }
    }
}

// soft mass: jittered polygon with a vertical gradient, never a flat fill
function mass(ctx, poly, o) {
    const opt = Object.assign({ tone: 0.5, tone2: null, jitter: 3 }, o);
    const pts = [];
    for (let i = 0; i < poly.length; i++) {
        const a = poly[i], b = poly[(i + 1) % poly.length];
        const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
        const n = Math.max(1, Math.ceil(len / 5));
        const nx = -(b[1] - a[1]) / (len || 1), ny = (b[0] - a[0]) / (len || 1);
        for (let k = 0; k < n; k++) {
            const t = k / n;
            const px = a[0] + t * (b[0] - a[0]), py = a[1] + t * (b[1] - a[1]);
            const j = (noise(px / 9 + 50, py / 9) - 0.5) * 2 * opt.jitter;
            pts.push([px + nx * j, py + ny * j]);
        }
    }
    let y0 = Infinity, y1 = -Infinity;
    pts.forEach(p => { y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]); });
    const gr = ctx.createLinearGradient(0, y0, 0, y1 + 0.01);
    gr.addColorStop(0, inkRGBA(opt.tone));
    gr.addColorStop(1, inkRGBA(opt.tone2 ?? opt.tone * 0.75));
    ctx.fillStyle = gr;
    ctx.beginPath();
    pts.forEach((p, i) => i === 0 ? ctx.moveTo(p[0], p[1]) : ctx.lineTo(p[0], p[1]));
    ctx.closePath();
    ctx.fill();
}

function blob(ctx, cx, cy, r, tone, squash = 1) {
    const poly = [];
    for (let i = 0; i < 18; i++) {
        const a = (i / 18) * Math.PI * 2;
        const rad = r * (0.85 + 0.3 * noise(cx / 7 + Math.cos(a), cy / 7 + Math.sin(a)));
        poly.push([cx + Math.cos(a) * rad, cy + Math.sin(a) * rad * squash]);
    }
    mass(ctx, poly, { tone, tone2: tone * 0.8, jitter: r * 0.12 });
}

// ---------- wet + dry layer pair ----------
function group(w, h) {
    const wetC = makeCanvas(w, h), dryC = makeCanvas(w, h);
    return { w, h, wetC, dryC, wet: wetC.getContext("2d"), dry: dryC.getContext("2d") };
}

// wet layer bleeds and collects pigment at its edges; dry layer stays crisp
function flatten(g) {
    const res = makeCanvas(g.w, g.h), ctx = res.getContext("2d");
    ctx.filter = "blur(3px)";
    ctx.drawImage(g.wetC, 0, 0);
    const a = makeCanvas(g.w, g.h), actx = a.getContext("2d");
    actx.filter = "blur(1.2px)"; actx.drawImage(g.wetC, 0, 0);
    actx.filter = "blur(9px)"; actx.globalCompositeOperation = "destination-out"; actx.globalAlpha = 0.92; actx.drawImage(g.wetC, 0, 0);
    ctx.filter = "none";
    ctx.globalAlpha = 0.85; ctx.drawImage(a, 0, 0);
    ctx.globalAlpha = 1;
    ctx.filter = "blur(0.35px)";
    ctx.drawImage(g.dryC, 0, 0);
    ctx.filter = "none";
    return res;
}

// fade a layer out toward a y position with a horizontal mask (never sloped)
function fadeBetween(c, yFull, yGone) {
    const ctx = c.getContext("2d");
    ctx.save();
    ctx.globalCompositeOperation = "destination-in";
    const gr = ctx.createLinearGradient(0, yFull, 0, yGone);
    gr.addColorStop(0, "rgba(0,0,0,1)");
    gr.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = gr;
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.restore();
}

// broken, fading reflection under a waterline (seeded: same input, same result)
function reflect(src, waterY, alpha, depth, seedN) {
    setSeed(seedN);
    const w = src.width, h = src.height;
    const r = makeCanvas(w, h), ctx = r.getContext("2d");
    ctx.save();
    ctx.translate(0, waterY * 2);
    ctx.scale(1, -1);
    ctx.drawImage(src, 0, 0);
    ctx.restore();
    ctx.clearRect(0, 0, w, waterY);
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
    const fin = makeCanvas(w, h), fctx = fin.getContext("2d");
    fctx.globalAlpha = alpha;
    fctx.filter = "blur(1.5px)";
    for (let y = waterY; y < Math.min(h, waterY + depth); y += 4) {
        const dx = Math.sin(y * 0.21) * 3;
        fctx.drawImage(r, 0, y, w, 4, dx, y, w, 4);
    }
    return fin;
}
