// Promotional still paintings for Shesh Kheya, painted with the same ink engine
// as the game (engine.js) and reusing the game's sprites (scene.js).

let AW = 1920, AH = 1080;
let PAPER = null, GRAIN = null;

function basePaper() {
    if (!PAPER || PAPER.width !== AW || PAPER.height !== AH) {
        setSeed(11);
        PAPER = makeCanvas(AW, AH);
        const ctx = PAPER.getContext("2d");
        const img = ctx.createImageData(AW, AH), d = img.data;
        for (let y = 0; y < AH; y++) {
            for (let x = 0; x < AW; x++) {
                const l = 1 + (fbm(x / 260, y / 260, 4) - 0.5) * 0.12 + (noise(x / 2.2, y / 2.2) - 0.5) * 0.025;
                const i = (y * AW + x) * 4;
                d[i] = 242 * l; d[i + 1] = 236 * l; d[i + 2] = 222 * l; d[i + 3] = 255;
            }
        }
        ctx.putImageData(img, 0, 0);
        for (let i = 0; i < 2600; i++) {
            const x = rr(0, AW), y = rr(0, AH), len = rr(6, 26), ang = [0.3, 1.9, 2.7][i % 3] + rr(-0.3, 0.3);
            ctx.strokeStyle = i % 5 === 0 ? "rgba(120,105,85,0.10)" : "rgba(255,252,244,0.35)";
            ctx.lineWidth = rr(0.4, 1);
            ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(ang) * len, y + Math.sin(ang) * len); ctx.stroke();
        }
        GRAIN = makeCanvas(AW, AH);
        const gctx = GRAIN.getContext("2d");
        const gi = gctx.createImageData(AW, AH), gd = gi.data;
        for (let y = 0; y < AH; y++) {
            for (let x = 0; x < AW; x++) {
                const v = 255 * (1 - 0.1 * (noise(x / 3, y / 3) * 0.6 + noise(x / 11, y / 11) * 0.4));
                const i = (y * AW + x) * 4;
                gd[i] = v; gd[i + 1] = v; gd[i + 2] = v; gd[i + 3] = 255;
            }
        }
        gctx.putImageData(gi, 0, 0);
    }
    const c = makeCanvas(AW, AH);
    c.getContext("2d").drawImage(PAPER, 0, 0);
    return c;
}

// multiply a vertical colour wash: stops = [[pos, "r,g,b", alpha], ...]
function wash(ctx, stops) {
    ctx.save();
    ctx.globalCompositeOperation = "multiply";
    const g = ctx.createLinearGradient(0, 0, 0, AH);
    stops.forEach(([p, rgb, a]) => g.addColorStop(p, `rgba(${rgb},${a})`));
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, AW, AH);
    ctx.restore();
}

function inkOn(ctx, layers) {
    ctx.save();
    ctx.globalCompositeOperation = "multiply";
    layers.forEach(l => ctx.drawImage(l, 0, 0));
    ctx.restore();
}

function finish(ctx, vignette = 0.28) {
    ctx.save();
    ctx.globalCompositeOperation = "multiply";
    ctx.globalAlpha = 0.6;
    ctx.drawImage(GRAIN, 0, 0);
    ctx.globalAlpha = 1;
    const v = ctx.createRadialGradient(AW / 2, AH / 2, Math.min(AW, AH) * 0.45, AW / 2, AH / 2, Math.max(AW, AH) * 0.62);
    v.addColorStop(0, "rgba(255,255,255,0)");
    v.addColorStop(1, `rgba(140,125,110,${vignette})`);
    ctx.fillStyle = v;
    ctx.fillRect(0, 0, AW, AH);
    ctx.restore();
}

// warm light: a multiply wash plus a soft screen glow
function glow(ctx, x, y, r, a, rgb = "240,150,55", screen = 0.35) {
    ctx.save();
    ctx.globalCompositeOperation = "multiply";
    let g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, `rgba(${rgb},${a})`);
    g.addColorStop(0.5, `rgba(${rgb},${a * 0.5})`);
    g.addColorStop(1, `rgba(${rgb},0)`);
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    if (screen > 0) {
        ctx.globalCompositeOperation = "screen";
        g = ctx.createRadialGradient(x, y, 0, x, y, r * 1.3);
        g.addColorStop(0, `rgba(255,195,120,${screen})`);
        g.addColorStop(0.35, `rgba(240,150,70,${screen * 0.4})`);
        g.addColorStop(1, "rgba(240,150,70,0)");
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(x, y, r * 1.3, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
}

function lightStreaks(ctx, x, y, s, a, n = 9) {
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    for (let i = 0; i < n; i++) {
        ctx.fillStyle = `rgba(250,170,90,${a * (1 - i / (n + 1))})`;
        const w = (26 - i * 2) * s;
        ctx.fillRect(x - w / 2 + Math.sin(i * 2.3) * 6 * s, y + i * 7 * s, w, 2.2 * s);
    }
    ctx.restore();
}

// draw a sprite {img, refl} with its anchor at (x, y)
function placeSprite(ctx, sp, def, x, y, s, flip = false) {
    ctx.save();
    ctx.globalCompositeOperation = "multiply";
    ctx.translate(x, y);
    ctx.scale(flip ? -s : s, s);
    ctx.drawImage(sp.refl, -def.ax, -def.ay);
    ctx.drawImage(sp.img, -def.ax, -def.ay);
    ctx.restore();
}

function withTransform(g, a, b, c, d, e, f, fn) {
    g.wet.setTransform(a, b, c, d, e, f);
    g.dry.setTransform(a, b, c, d, e, f);
    fn();
    g.wet.setTransform(1, 0, 0, 1, 0, 0);
    g.dry.setTransform(1, 0, 0, 1, 0, 0);
}

function treeLine(horizon, gap0, gap1, tone, withHome = false) {
    const g = group(AW, AH);
    const blobs = [];
    for (let x = -20; x < AW + 40; x += rr(26, 70)) {
        if (x > gap0 && x < gap1) continue;
        blobs.push([x, rr(12, 36)]);
    }
    const top = x => {
        let h = 4 + 2 * noise(x / 20, 3);
        blobs.forEach(([cx, r]) => { const dd = r * r - (x - cx) * (x - cx); if (dd > 0) h = Math.max(h, Math.sqrt(dd) * 0.75 + 4); });
        return horizon - h;
    };
    const poly = [];
    for (let x = 0; x <= AW; x += 6) poly.push([x, top(x)]);
    poly.push([AW, horizon + 6], [0, horizon + 6]);
    mass(g.wet, poly, { tone, tone2: tone * 0.4, jitter: 2 });
    if (withHome) {
        mass(g.wet, [[208, horizon - 8], [252, horizon - 8], [252, horizon - 22], [208, horizon - 22]], { tone: tone * 1.8, jitter: 1 });
        mass(g.wet, [[202, horizon - 20], [258, horizon - 20], [244, horizon - 32], [216, horizon - 32]], { tone: tone * 2.2, jitter: 1 });
    }
    const c = flatten(g);
    fadeBetween(c, horizon - 26, horizon + 6);
    return [c, reflect(c, horizon + 4, 0.32, 36, 5)];
}

function streaks(y0, y1, n, toneMax = 0.26) {
    const g = group(AW, AH);
    for (let i = 0; i < n; i++) {
        const y = rr(y0, y1), x = rr(-100, AW - 100), k = (y - y0) / (y1 - y0);
        const len = rr(60, 340) * (0.5 + k);
        stroke(g, [[x, y], [x + len / 2, y + rr(-2, 2)], [x + len, y + rr(-1, 1)]], { w: rr(1.5, 3.5) * (0.6 + k), tone: rr(0.12, toneMax), dryness: 0.6, bristles: 3, profile: "even", body: 0 });
    }
    return flatten(g);
}

function reeds(g, x0, x1, n, lean = 1, hMax = 260) {
    for (let i = 0; i < n; i++) {
        const x = rr(x0, x1), h = rr(110, hMax), l = rr(-20, 70) * lean;
        stroke(g, [[x, AH + 10], [x + l * 0.15, AH - h * 0.45], [x + l * 0.55, AH - h * 0.8], [x + l, AH - h]], { w: rr(6, 12), tone: rr(0.5, 0.9), dryness: rr(0.3, 0.55), bristles: 8, profile: "tip", loaded: 1, body: 0.55, gap: 20 });
    }
}

function hijol(g, x, wl, s, tone = 0.32) {
    stroke(g, [[x, wl + 3], [x - 2 * s, wl - 30 * s], [x + 2 * s, wl - 62 * s]], { w: 8 * s, tone: tone * 1.3, dryness: 0.3, bristles: 6, profile: "rise", loaded: 0.8, body: 0.6 });
    stroke(g, [[x - 1, wl - 48 * s], [x - 28 * s, wl - 72 * s]], { w: 3 * s, tone: tone * 1.2, dryness: 0.35, bristles: 4, profile: "tip", body: 0.4 });
    stroke(g, [[x + 1, wl - 52 * s], [x + 32 * s, wl - 78 * s]], { w: 3 * s, tone: tone * 1.2, dryness: 0.35, bristles: 4, profile: "tip", body: 0.4 });
    for (let k = 0; k < 16; k++) {
        const dx = rr(-62, 62);
        blob(g.wet, x + dx * s, wl - (88 + rr(-16, 16) - Math.abs(dx) * 0.12) * s, rr(16, 30) * s, rr(tone * 0.75, tone * 1.1), 0.58);
    }
    for (let k = 0; k < 34; k++) {
        g.dry.fillStyle = inkRGBA(rr(tone * 1.2, tone * 2.2));
        g.dry.beginPath();
        g.dry.ellipse(x + rr(-62, 62) * s, wl - 92 * s + rr(-26, 18) * s, rr(1.5, 3.2) * s, rr(1, 2.2) * s, rr(0, 3), 0, Math.PI * 2);
        g.dry.fill();
    }
}

function clouds(y0, y1, n, t0, t1, blurPx = 14) {
    const g = group(AW, AH);
    for (let i = 0; i < n; i++) {
        const cx = rr(-150, AW + 150), cy = rr(y0, y1), rw = rr(160, 340), rh = rr(40, 90);
        const poly = [];
        for (let k = 0; k < 24; k++) {
            const a = (k / 24) * Math.PI * 2;
            const wob = 0.8 + 0.4 * noise(cx / 50 + Math.cos(a) * 2, cy / 50 + Math.sin(a) * 2);
            poly.push([cx + Math.cos(a) * rw * wob, cy + Math.sin(a) * rh * wob * (Math.sin(a) > 0 ? 0.6 : 1)]);
        }
        mass(g.wet, poly, { tone: rr(t0, t1), tone2: rr(t0 * 0.4, t1 * 0.5), jitter: 6 });
    }
    const soft = flatten(g);
    const c = makeCanvas(AW, AH), ctx = c.getContext("2d");
    ctx.filter = `blur(${blurPx}px)`;
    ctx.drawImage(soft, 0, 0);
    ctx.filter = "none";
    return c;
}

function rings(ctx, x, y, s, n = 3, tone = 0.4) {
    for (let k = 0; k < n; k++) {
        const r = (22 + k * 26) * s, a0 = rr(0, 6.28);
        ctx.strokeStyle = inkRGBA(tone * (1 - k * 0.25));
        ctx.lineWidth = Math.max(0.8, (2.4 - k * 0.5) * s);
        ctx.beginPath();
        ctx.ellipse(x, y, r * 1.4, r * 0.24, 0, a0, a0 + Math.PI * 1.86);
        ctx.stroke();
    }
}

function birds(g, list) {
    list.forEach(([x, y, s]) => {
        stroke(g, [[x - 11 * s, y - 3 * s], [x - 4 * s, y - 5 * s], [x, y]], { w: 2.4 * s, tone: 0.55, dryness: 0.1, bristles: 3, profile: "nail", body: 0.3 });
        stroke(g, [[x, y], [x + 5 * s, y - 6 * s], [x + 13 * s, y - 5 * s]], { w: 2.4 * s, tone: 0.55, dryness: 0.1, bristles: 3, profile: "tip", body: 0.3 });
    });
}

// the home: house on stilts, veranda, banana trees, Amma and Dadi
// drawn in the coordinates of the first art test (floor at y 650, waterline 728)
function houseHome(g, figures = true) {
    [[200, 650, 1], [252, 652, 0.8]].forEach(([x, y, s]) => {
        stroke(g, [[x, y], [x + 4, y - 50 * s], [x + 10 * s, y - 95 * s]], { w: 9 * s, tone: 0.34, dryness: 0.25, bristles: 7, profile: "rise", loaded: 0.6, body: 0.6 });
        for (let k = 0; k < 6; k++) {
            const ang = -Math.PI / 2 + rr(-1.5, 1.5), len = rr(55, 90) * s;
            const sx = x + 10 * s, sy = y - 95 * s;
            const ex = sx + Math.cos(ang) * len, ey = sy + Math.sin(ang) * len * 0.6 + len * 0.35;
            stroke(g, [[sx, sy], [(sx + ex) / 2 + Math.cos(ang) * 8, Math.min(sy, ey) - 18], [ex, ey]], { w: rr(10, 15) * s, tone: 0.3, dryness: 0.45, bristles: 10, profile: "brush", loaded: 0.9, body: 0.55 });
        }
    });
    [345, 395, 455, 515, 575, 625].forEach(x => {
        stroke(g, [[x, 648], [x + rr(-3, 3), 690], [x + rr(-5, 5), 740]], { w: rr(4.5, 7), tone: rr(0.7, 0.9), dryness: 0.35, bristles: 5, profile: "nail", loaded: 1, body: 0.5, gap: 18 });
    });
    mass(g.wet, [[372, 570], [608, 570], [608, 648], [372, 648]], { tone: 0.24, tone2: 0.32, jitter: 2 });
    for (let x = 384; x < 600; x += rr(14, 22)) {
        stroke(g, [[x, 574], [x + rr(-1, 1), 646]], { w: 1.5, tone: 0.3, dryness: 0.55, bristles: 2, profile: "even", body: 0 });
    }
    mass(g.wet, [[452, 594], [492, 594], [492, 648], [452, 648]], { tone: 0.6, tone2: 0.7, jitter: 1.5 });
    mass(g.wet, [[536, 596], [570, 596], [570, 622], [536, 622]], { tone: 0.12, tone2: 0.15, jitter: 1 });
    mass(g.wet, [[352, 578], [628, 578], [590, 520], [490, 508], [390, 520]], { tone: 0.66, tone2: 0.48, jitter: 2.5 });
    stroke(g, [[344, 580], [490, 584], [636, 578]], { w: 8, tone: 0.95, dryness: 0.2, bristles: 8, profile: "brush", loaded: 1, body: 0.4 });
    stroke(g, [[392, 520], [490, 507], [588, 520]], { w: 3, tone: 0.8, dryness: 0.5, bristles: 4, profile: "even", body: 0 });
    stroke(g, [[236, 650], [450, 652], [640, 649]], { w: 6, tone: 0.92, dryness: 0.15, bristles: 6, profile: "even", loaded: 1, body: 0.4 });
    mass(g.wet, [[238, 604], [372, 584], [372, 594], [242, 614]], { tone: 0.55, jitter: 1.5 });
    [250, 300].forEach(x => stroke(g, [[x, 610], [x, 650]], { w: 2.5, tone: 0.8, dryness: 0.25, bristles: 2, profile: "even", body: 0.3 }));
    if (!figures) return;
    blob(g.wet, 318, 610, 7.5, 0.82);
    mass(g.wet, [[312, 618], [324, 618], [337, 632], [341, 642], [336, 650], [304, 650], [306, 632]], { tone: 0.72, tone2: 0.85, jitter: 1.4 });
    stroke(g, [[324, 621], [340, 636], [334, 649]], { w: 2.5, tone: 0.95, dryness: 0.1, bristles: 3, profile: "brush", loaded: 1, body: 0.2 });
    blob(g.wet, 357, 620, 7, 0.82);
    mass(g.wet, [[350, 624], [362, 626], [370, 640], [368, 650], [344, 650], [345, 634]], { tone: 0.7, tone2: 0.85, jitter: 1.4 });
    stroke(g, [[352, 626], [346, 640], [360, 646]], { w: 2.3, tone: 0.95, dryness: 0.1, bristles: 3, profile: "brush", loaded: 1, body: 0.2 });
}

const MDEF = S5.SPRITE.mitu;

// ============================================================
// 1. key art: one small boat, one light, the whole haor
// ============================================================
function paintKeyArt() {
    setSeed(101);
    const c = basePaper(), ctx = c.getContext("2d");
    const HZ = 640;
    wash(ctx, [[0, "200,190,200", 0.25], [0.45, "236,186,140", 0.22], [0.59, "232,160,110", 0.3], [0.62, "220,190,170", 0.18], [1, "190,180,180", 0.2]]);
    // a huge pale sun sitting on the horizon
    ctx.save();
    ctx.globalCompositeOperation = "multiply";
    ctx.filter = "blur(3px)";
    const sg = ctx.createRadialGradient(560, HZ - 8, 0, 560, HZ - 8, 120);
    sg.addColorStop(0, "rgba(214,104,62,0.12)");
    sg.addColorStop(0.85, "rgba(205,95,58,0.22)");
    sg.addColorStop(0.95, "rgba(195,85,50,0.3)");
    sg.addColorStop(1, "rgba(220,120,70,0)");
    ctx.fillStyle = sg;
    ctx.beginPath(); ctx.arc(560, HZ - 8, 120, Math.PI, 0); ctx.lineTo(680, HZ); ctx.lineTo(440, HZ); ctx.fill();
    ctx.filter = "none";
    for (let i = 0; i < 18; i++) {
        const y = HZ + 8 + i * i * 1.4, w = rr(80, 220) * (1 - i / 22);
        ctx.fillStyle = `rgba(210,110,68,${0.2 * (1 - i / 20)})`;
        ctx.fillRect(560 - w / 2 + rr(-20, 20), y, w, rr(1.5, 3.5));
    }
    ctx.restore();

    const [far, farR] = treeLine(HZ, 380, 760, 0.16);
    const near = group(AW, AH);
    hijol(near, 1500, HZ + 30, 0.9, 0.3);
    hijol(near, 1640, HZ + 26, 0.7, 0.26);
    birds(near, [[1240, 380, 1.1], [1280, 404, 0.9], [1322, 372, 1], [1196, 414, 0.8], [1370, 398, 0.7], [1410, 360, 0.6]]);
    const nearC = flatten(near);
    const fore = group(AW, AH);
    reeds(fore, 10, 300, 18, 1, 300);
    stroke(fore, [[-40, 1052], [180, 1036], [440, 1050]], { w: 80, tone: 0.18, dryness: 0.55, bristles: 22, profile: "brush", loaded: 0.6, body: 0.9, gap: 40 });
    inkOn(ctx, [clouds(40, 200, 10, 0.08, 0.16, 18), far, farR, reflect(nearC, HZ + 32, 0.36, 90, 7), nearC, streaks(HZ + 30, 1020, 28), flatten(fore)]);

    // the boat, small, in the middle of everything
    const m = paintMitu({ side: "near", p: 0.3 });
    const bx = 1040, by = 800, bs = 0.62;
    placeSprite(ctx, m, MDEF, bx, by, bs);
    ctx.save(); ctx.globalCompositeOperation = "multiply";
    rings(ctx, bx - 120 * bs, by + 2, bs, 4, 0.36);
    ctx.restore();
    const lx = bx + S5.LANTERN[0] * bs, ly = by + S5.LANTERN[1] * bs;
    glow(ctx, lx, ly, 70, 0.5);
    glow(ctx, lx, ly, 20, 0.6, "240,150,55", 0.5);
    lightStreaks(ctx, lx, ly + 22, bs, 0.3);
    finish(ctx);
    return c;
}

// ============================================================
// 2. home at dusk: Amma, Dadi, the house on the water
// ============================================================
function paintHome() {
    setSeed(202);
    const c = basePaper(), ctx = c.getContext("2d");
    const HZ = 640;
    wash(ctx, [[0, "236,190,150", 0.1], [0.4, "238,172,118", 0.26], [0.58, "234,150,96", 0.36], [0.6, "226,180,150", 0.2], [1, "220,190,170", 0.18]]);
    ctx.save();
    ctx.globalCompositeOperation = "multiply";
    ctx.filter = "blur(2.5px)";
    const sg = ctx.createRadialGradient(1330, HZ - 30, 0, 1330, HZ - 30, 70);
    sg.addColorStop(0, "rgba(214,104,62,0.16)");
    sg.addColorStop(0.8, "rgba(212,100,60,0.24)");
    sg.addColorStop(0.92, "rgba(200,88,52,0.34)");
    sg.addColorStop(1, "rgba(220,120,70,0)");
    ctx.fillStyle = sg;
    ctx.beginPath(); ctx.arc(1330, HZ - 30, 70, 0, Math.PI * 2); ctx.fill();
    ctx.filter = "none";
    for (let i = 0; i < 14; i++) {
        ctx.fillStyle = `rgba(222,120,72,${0.22 * (1 - i / 16)})`;
        ctx.fillRect(1330 - rr(30, 70) + rr(-10, 10), HZ + 10 + i * i * 1.6, rr(60, 140) * (1 - i / 18), rr(1.5, 3));
    }
    ctx.restore();

    const [far, farR] = treeLine(HZ, 1150, 1500, 0.15);
    const house = group(AW, AH);
    const s = 1.45, dx = 640 - 440 * s, dy = 790 - 728 * s;
    withTransform(house, s, 0, 0, s, dx, dy, () => houseHome(house, true));
    const houseC = flatten(house);
    const fore = group(AW, AH);
    reeds(fore, 1680, 1910, 14, -1, 280);
    for (let i = 0; i < 14; i++) blob(fore.wet, rr(1180, 1560), rr(960, 1040), rr(12, 24), rr(0.4, 0.62), 0.5);
    for (let i = 0; i < 22; i++) {
        fore.dry.fillStyle = inkRGBA(rr(0.6, 0.95));
        fore.dry.beginPath();
        fore.dry.ellipse(rr(1170, 1580), rr(950, 1040), rr(1.8, 4), rr(1.4, 3), rr(0, 3), 0, Math.PI * 2);
        fore.dry.fill();
    }
    const sky = group(AW, AH);
    birds(sky, [[1000, 330, 1], [1040, 352, 0.8], [1082, 322, 0.9], [960, 366, 0.7]]);
    inkOn(ctx, [clouds(60, 230, 7, 0.06, 0.12, 18), flatten(sky), far, farR, reflect(houseC, 790, 0.42, 200, 8), houseC, streaks(HZ + 20, 1020, 24), flatten(fore)]);

    // kupi in the window, the bangle's glint
    const kx = 553 * s + dx, ky = 609 * s + dy;
    glow(ctx, kx, ky, 46, 0.55);
    glow(ctx, 364 * s + dx, 640 * s + dy, 9, 0.9, "255,200,90", 0.7);
    finish(ctx);
    return c;
}

// ============================================================
// 3. the hurricane lantern being filled
// ============================================================
function paintLantern() {
    setSeed(303);
    const c = basePaper(), ctx = c.getContext("2d");
    const HZ = 600;
    wash(ctx, [[0, "236,190,150", 0.12], [0.45, "238,172,118", 0.26], [0.55, "234,150,96", 0.34], [0.57, "226,180,150", 0.2], [1, "200,170,150", 0.26]]);
    // the haor beyond the veranda, sun low
    ctx.save();
    ctx.globalCompositeOperation = "multiply";
    ctx.filter = "blur(2.5px)";
    const sg = ctx.createRadialGradient(1400, HZ - 20, 0, 1400, HZ - 20, 60);
    sg.addColorStop(0, "rgba(214,104,62,0.14)");
    sg.addColorStop(0.85, "rgba(205,95,58,0.26)");
    sg.addColorStop(1, "rgba(220,120,70,0)");
    ctx.fillStyle = sg;
    ctx.beginPath(); ctx.arc(1400, HZ - 20, 60, 0, Math.PI * 2); ctx.fill();
    ctx.filter = "none";
    ctx.restore();
    const [far, farR] = treeLine(HZ, 1300, 1500, 0.16);
    const mid = group(AW, AH);
    hijol(mid, 1080, HZ + 40, 0.6, 0.26);
    birds(mid, [[1500, 360, 1], [1540, 380, 0.8], [1580, 352, 0.9]]);

    const g = group(AW, AH);
    // veranda floor: edge beam, then planks toward us
    stroke(g, [[-20, 800], [AW / 2, 796], [AW + 20, 802]], { w: 12, tone: 0.85, dryness: 0.3, bristles: 10, profile: "even", loaded: 1, body: 0.4 });
    for (let i = 0; i < 6; i++) {
        const y = 830 + i * i * 6 + i * 22;
        stroke(g, [[-20, y], [AW / 2, y + rr(-3, 3)], [AW + 20, y + rr(-2, 2)]], { w: rr(2.5, 5), tone: rr(0.3, 0.5), dryness: 0.55, bristles: 6, profile: "even", body: 0.2, gap: 30 });
    }
    // two veranda posts framing the view
    [[170, 0.6], [1780, 0.55]].forEach(([x, t]) => {
        stroke(g, [[x, -10], [x - 3, 400], [x + 2, 800]], { w: 30, tone: t, dryness: 0.35, bristles: 14, profile: "even", loaded: 1, body: 0.6, gap: 30 });
        [160, 420, 660].forEach(y => stroke(g, [[x - 16, y], [x + 16, y + 2]], { w: 3, tone: 0.85, dryness: 0.2, bristles: 3, profile: "even", body: 0 }));
    });
    // the roof's edge at the top
    stroke(g, [[-20, 40], [AW / 2, 56], [AW + 20, 40]], { w: 50, tone: 0.75, dryness: 0.35, bristles: 22, profile: "even", loaded: 1, body: 0.6, gap: 40 });

    const L = 640, B = 820, K = 1.25;                      // lantern centre x, floor y, size
    const P = ([x, y]) => [L + x * K, B + y * K];
    const PP = pts => pts.map(P);
    mass(g.wet, PP([[-150, -78], [150, -78], [160, -48], [130, -8], [-130, -8], [-160, -48]]), { tone: 0.82, tone2: 0.95, jitter: 2 });
    stroke(g, PP([[-158, -50], [0, -36], [158, -50]]), { w: 6, tone: 0.98, dryness: 0.3, bristles: 6, profile: "even", body: 0 });
    mass(g.wet, PP([[92, -88], [120, -88], [120, -74], [92, -74]]), { tone: 0.9, jitter: 1 });
    [-150, 150].forEach((x, i) => stroke(g, PP([[x, -70], [x + (i ? 6 : -6), -220], [x, -390]]), { w: 9, tone: 0.85, dryness: 0.25, bristles: 6, profile: "even", loaded: 1, body: 0.4 }));
    stroke(g, PP([[-60, -78], [-112, -180], [-98, -280], [-54, -342]]), { w: 12, tone: 0.36, dryness: 0.55, bristles: 10, profile: "brush", loaded: 1, body: 0.2 });
    stroke(g, PP([[60, -78], [112, -180], [98, -280], [54, -342]]), { w: 12, tone: 0.36, dryness: 0.55, bristles: 10, profile: "brush", loaded: -1, body: 0.2 });
    [-90, -32, 32, 90].forEach(x => stroke(g, PP([[x * 0.75, -78], [x, -210], [x * 0.7, -334]]), { w: 2, tone: 0.8, dryness: 0.25, bristles: 2, profile: "even", body: 0 }));
    mass(g.wet, PP([[-26, -78], [26, -78], [18, -114], [-18, -114]]), { tone: 0.7, jitter: 1 });
    mass(g.wet, PP([[-120, -342], [120, -342], [92, -382], [-92, -382]]), { tone: 0.88, tone2: 0.95, jitter: 1.5 });
    mass(g.wet, PP([[-40, -380], [40, -380], [30, -420], [-30, -420]]), { tone: 0.9, jitter: 1 });
    stroke(g, PP([[-150, -388], [-140, -490], [0, -540], [140, -490], [150, -388]]), { w: 5, tone: 0.9, dryness: 0.25, bristles: 4, profile: "even", loaded: 1, body: 0.2 });
    // kerosene bottle standing beside it
    const bx = 1000;
    mass(g.wet, [[bx - 46, 820], [bx + 46, 820], [bx + 46, 640], [bx + 20, 600], [bx + 14, 560], [bx - 14, 560], [bx - 20, 600], [bx - 46, 640]], { tone: 0.34, tone2: 0.46, jitter: 1.5 });
    mass(g.wet, [[bx - 44, 820], [bx + 44, 820], [bx + 44, 700], [bx - 44, 700]], { tone: 0.3, jitter: 1 });
    stroke(g, [[bx + 44, 818], [bx + 46, 640], [bx + 20, 600], [bx + 14, 560]], { w: 5, tone: 0.9, dryness: 0.25, bristles: 4, profile: "even", loaded: 1, body: 0.2 });
    mass(g.wet, [[bx - 16, 566], [bx + 16, 566], [bx + 16, 546], [bx - 16, 546]], { tone: 0.85, jitter: 1 });

    inkOn(ctx, [clouds(60, 220, 7, 0.06, 0.12, 18), far, farR, flatten(mid), streaks(HZ + 20, 780, 14), flatten(g)]);
    const fy = B - 128 * K;
    glow(ctx, L, fy, 300, 0.36);
    glow(ctx, L, fy, 70, 0.6, "240,150,55", 0.75);
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    ctx.fillStyle = "rgba(255,230,170,0.85)";
    ctx.beginPath();
    ctx.moveTo(L, fy - 46); ctx.quadraticCurveTo(L + 16, fy - 6, L, fy + 18); ctx.quadraticCurveTo(L - 16, fy - 6, L, fy - 46);
    ctx.fill();
    ctx.restore();
    finish(ctx, 0.34);
    return c;
}

// ============================================================
// 4. Abba's things floating in the water
// ============================================================
function paintMemories() {
    setSeed(404);
    const c = basePaper(), ctx = c.getContext("2d");
    const HZ = 600;
    wash(ctx, [[0, "170,150,180", 0.4], [0.4, "214,160,160", 0.3], [0.54, "226,160,130", 0.32], [0.57, "200,170,180", 0.22], [1, "160,140,160", 0.32]]);
    const [far, farR] = treeLine(HZ, 820, 1140, 0.2);
    const mid = group(AW, AH);
    hijol(mid, 1600, HZ + 52, 0.8, 0.32);
    hijol(mid, 1720, HZ + 48, 0.6, 0.28);
    const midC = flatten(mid);

    const things = group(AW, AH);
    // gamchha: a soaked, checked cloth
    const gx = 1080, gy = 880;
    mass(things.wet, [[gx - 120, gy], [gx - 60, gy - 22], [gx + 10, gy - 12], [gx + 90, gy - 26], [gx + 130, gy - 4], [gx + 80, gy + 14], [gx - 30, gy + 16]], { tone: 0.26, tone2: 0.34, jitter: 4 });
    for (let i = -4; i <= 4; i++) {
        stroke(things, [[gx + i * 26 - 10, gy - 20], [gx + i * 26 + 4, gy + 12]], { w: 2, tone: 0.5, dryness: 0.5, bristles: 2, profile: "even", body: 0 });
    }
    for (let j = 0; j < 3; j++) {
        stroke(things, [[gx - 110, gy - 8 + j * 9], [gx + 120, gy - 12 + j * 9]], { w: 1.8, tone: 0.45, dryness: 0.55, bristles: 2, profile: "even", body: 0 });
    }
    // flute: one long thin stroke with its holes left as paper
    const fx = 1380, fy = 812;
    stroke(things, [[fx - 120, fy + 10], [fx + 130, fy - 12]], { w: 9, tone: 0.82, dryness: 0.25, bristles: 6, profile: "even", loaded: 1, body: 0.4 });
    [[-60, 5], [-30, 2], [0, 0], [30, -3], [60, -5]].forEach(([dx, dy]) => {
        things.dry.save();
        things.dry.globalCompositeOperation = "destination-out";
        things.dry.beginPath(); things.dry.arc(fx + dx, fy + dy, 2.6, 0, Math.PI * 2); things.dry.fill();
        things.dry.restore();
    });
    // tiffin carrier, tilted, half sunk
    const tx = 1660, ty = 900, ta = -0.35;
    const trot = ([x, y]) => [tx + x * Math.cos(ta) - y * Math.sin(ta), ty + x * Math.sin(ta) + y * Math.cos(ta)];
    mass(things.wet, [[-40, -10], [40, -10], [40, 18], [-40, 18]].map(trot), { tone: 0.72, jitter: 1.5 });
    mass(things.wet, [[-38, -42], [38, -42], [38, -14], [-38, -14]].map(trot), { tone: 0.66, jitter: 1.5 });
    mass(things.wet, [[-34, -52], [34, -52], [30, -44], [-30, -44]].map(trot), { tone: 0.85, jitter: 1 });
    stroke(things, [trot([-30, -48]), trot([-24, -84]), trot([24, -84]), trot([30, -48])], { w: 3, tone: 0.9, dryness: 0.25, bristles: 3, profile: "even", body: 0 });
    const thingsC = flatten(things);

    const fore = group(AW, AH);
    reeds(fore, 10, 240, 14, 1, 240);
    inkOn(ctx, [clouds(30, 220, 12, 0.12, 0.22, 16), far, farR, reflect(midC, HZ + 54, 0.36, 80, 9), midC, streaks(HZ + 20, 1020, 30), reflect(thingsC, 912, 0.3, 60, 10), thingsC, flatten(fore)]);
    ctx.save(); ctx.globalCompositeOperation = "multiply";
    rings(ctx, gx, gy + 8, 1.1, 3, 0.3);
    rings(ctx, fx, fy + 6, 0.9, 3, 0.28);
    rings(ctx, tx, ty + 14, 0.8, 3, 0.3);
    ctx.restore();
    // faint light marking each memory
    [[gx, gy], [fx, fy], [tx, ty - 20]].forEach(([x, y]) => {
        ctx.save();
        ctx.globalCompositeOperation = "screen";
        const gr = ctx.createRadialGradient(x, y, 0, x, y, 140);
        gr.addColorStop(0, "rgba(255,241,201,0.26)");
        gr.addColorStop(1, "rgba(255,241,201,0)");
        ctx.fillStyle = gr;
        ctx.beginPath(); ctx.ellipse(x, y, 190, 90, 0, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
    });

    // Mitu, rowing toward them
    const m = paintMitu({ side: "far", p: 0.66 });
    const bx = 600, by = 830, bs = 0.95;
    placeSprite(ctx, m, MDEF, bx, by, bs);
    ctx.save(); ctx.globalCompositeOperation = "multiply";
    rings(ctx, bx - 130 * bs, by + 2, bs, 3, 0.35);
    ctx.restore();
    const lx = bx + S5.LANTERN[0] * bs, ly = by + S5.LANTERN[1] * bs;
    glow(ctx, lx, ly, 78, 0.5);
    lightStreaks(ctx, lx, ly + 30, bs, 0.3);
    finish(ctx);
    return c;
}

// ============================================================
// 5. Rahim Chacha hauls the net; the big aair jumps
// ============================================================
function paintRahim() {
    setSeed(505);
    const c = basePaper(), ctx = c.getContext("2d");
    const HZ = 590;
    wash(ctx, [[0, "150,136,170", 0.46], [0.4, "200,156,170", 0.3], [0.53, "220,160,140", 0.3], [0.56, "190,170,184", 0.22], [1, "140,128,150", 0.36]]);
    const [far, farR] = treeLine(HZ, 200, 500, 0.22);

    const g = group(AW, AH);
    const S = 1.35, OX = 1000, OY = 790;
    withTransform(g, S, 0, 0, S, OX, OY, () => {
        // hull
        mass(g.wet, [[-246, -40], [-196, -18], [0, -10], [196, -20], [244, -44], [214, -12], [160, 4], [0, 12], [-170, 4], [-222, -12]], { tone: 0.66, tone2: 0.86, jitter: 2 });
        stroke(g, [[-244, -40], [-200, -8], [-90, 8], [0, 12], [110, 6], [210, -12], [246, -43]], { w: 10, tone: 0.95, dryness: 0.35, bristles: 10, profile: "brush", loaded: 1, body: 0.35 });
        stroke(g, [[-240, -41], [-170, -19], [0, -9], [168, -18], [240, -43]], { w: 3, tone: 0.8, dryness: 0.5, bristles: 4, profile: "even", body: 0 });
        // Rahim leaning back, hauling
        const feet = [-60, -18], hip = [-74, -62], sh = [-92, -106], hd = [-98, -122];
        stroke(g, [hip, [-56, -40], [-42, feet[1]]], { w: 4, tone: 0.95, dryness: 0.15, bristles: 3, profile: "even", body: 0.3 });
        stroke(g, [hip, [-84, -38], [-80, feet[1]]], { w: 4, tone: 0.95, dryness: 0.15, bristles: 3, profile: "even", body: 0.3 });
        mass(g.wet, [[hip[0] - 12, hip[1] - 4], [hip[0] + 10, hip[1] - 4], [-46, -36], [-90, -36]], { tone: 0.34, tone2: 0.44, jitter: 1.5 });
        stroke(g, [hip, [-86, -86], sh], { w: 10, tone: 0.9, dryness: 0.2, bristles: 6, profile: "rise", loaded: 1, body: 0.5 });
        blob(g.wet, ...hd, 10, 0.9);
        stroke(g, [[hd[0] - 9, hd[1] - 5], [hd[0], hd[1] - 12], [hd[0] + 9, hd[1] - 6]], { w: 2.2, tone: 0.7, dryness: 0.4, bristles: 2, profile: "even", body: 0 });
        const hands = [-20, -74];
        stroke(g, [sh, [-60, -94], hands], { w: 3.4, tone: 0.95, dryness: 0.1, bristles: 3, profile: "even", body: 0.3 });
        stroke(g, [[sh[0] + 4, sh[1] + 6], [-56, -82], [hands[0] - 4, hands[1] + 6]], { w: 3.4, tone: 0.95, dryness: 0.1, bristles: 3, profile: "even", body: 0.3 });
        // rope to the net
        stroke(g, [hands, [30, -60], [90, -36]], { w: 2.4, tone: 0.85, dryness: 0.3, bristles: 2, profile: "even", body: 0 });
    });
    // the net, lifted and dripping, drawn as a mesh inside its outline
    const net = [[1120, 740], [1260, 690], [1400, 716], [1440, 800], [1360, 870], [1200, 860], [1110, 800]];
    const ng = group(AW, AH);
    mass(ng.wet, net, { tone: 0.12, tone2: 0.06, jitter: 5 });
    ng.dry.save();
    ng.dry.beginPath();
    net.forEach((p, i) => i ? ng.dry.lineTo(p[0], p[1]) : ng.dry.moveTo(p[0], p[1]));
    ng.dry.closePath();
    ng.dry.clip();
    for (let k = -14; k < 20; k++) {
        stroke(ng, [[1080 + k * 22, 660], [1240 + k * 22, 900]], { w: 1.4, tone: 0.5, dryness: 0.45, bristles: 1, profile: "even", body: 0, gap: 12 });
        stroke(ng, [[1480 + k * 22 - 400, 660], [1320 + k * 22 - 400, 900]], { w: 1.4, tone: 0.5, dryness: 0.45, bristles: 1, profile: "even", body: 0, gap: 12 });
    }
    ng.dry.restore();
    stroke(ng, [[1110, 744], [1260, 692], [1402, 718]], { w: 3.5, tone: 0.85, dryness: 0.3, bristles: 3, profile: "even", body: 0 });
    for (let i = 0; i < 6; i++) blob(ng.wet, 1120 + i * 52, 742 - Math.sin(i / 5 * Math.PI) * 44, 5, 0.9, 0.8);
    for (let i = 0; i < 26; i++) {
        const x = rr(1130, 1430), y = rr(820, 880);
        stroke(ng, [[x, y], [x + rr(-2, 2), y + rr(14, 40)]], { w: 1.4, tone: 0.3, dryness: 0.3, bristles: 1, profile: "tip", body: 0 });
    }
    // the big aair fish, mid-leap, whiskers out
    const fishPts = [[1150, 610], [1220, 560], [1300, 548], [1380, 576]];
    stroke(ng, fishPts, { w: 34, tone: 0.92, dryness: 0.18, bristles: 16, profile: "nail", loaded: 1, body: 0.6 });
    stroke(ng, [[1160, 606], [1126, 572]], { w: 14, tone: 0.9, dryness: 0.3, bristles: 8, profile: "tip", body: 0.4 });
    stroke(ng, [[1160, 610], [1120, 640]], { w: 14, tone: 0.9, dryness: 0.3, bristles: 8, profile: "tip", body: 0.4 });
    stroke(ng, [[1250, 552], [1280, 520], [1310, 548]], { w: 6, tone: 0.8, dryness: 0.4, bristles: 4, profile: "brush", body: 0.3 });
    [[-20, -10], [-10, 4], [8, 10], [16, 18]].forEach(([dx, dy], i) => {
        stroke(ng, [[1380, 578], [1420 + dx, 590 + dy], [1450 + dx * 1.6, 620 + dy * 1.4 + i * 6]], { w: 1.6, tone: 0.85, dryness: 0.2, bristles: 1, profile: "tip", body: 0 });
    });
    // spray
    for (let i = 0; i < 60; i++) {
        const a = rr(-Math.PI, 0), r = rr(30, 160);
        ng.dry.fillStyle = inkRGBA(rr(0.3, 0.75));
        ng.dry.beginPath();
        ng.dry.ellipse(1270 + Math.cos(a) * r * 1.3, 660 + Math.sin(a) * r * 0.7, rr(1.2, 3.5), rr(1, 2.6), rr(0, 3), 0, Math.PI * 2);
        ng.dry.fill();
    }
    const boatC = flatten(g), netC = flatten(ng);
    const fore = group(AW, AH);
    reeds(fore, 1700, 1910, 13, -1, 260);
    inkOn(ctx, [clouds(20, 260, 14, 0.14, 0.26, 16), far, farR, streaks(HZ + 20, 1020, 26), reflect(boatC, OY, 0.4, 180, 11), boatC, netC, flatten(fore)]);
    ctx.save(); ctx.globalCompositeOperation = "multiply";
    rings(ctx, 1270, 836, 1.6, 4, 0.36);
    ctx.restore();

    // Mitu watching from her boat, far left
    const m = paintMitu({ side: "near", p: 0.5 });
    const bx = 420, by = 742, bs = 0.62;
    placeSprite(ctx, m, MDEF, bx, by, bs);
    const lx = bx + S5.LANTERN[0] * bs, ly = by + S5.LANTERN[1] * bs;
    glow(ctx, lx, ly, 56, 0.5);
    lightStreaks(ctx, lx, ly + 20, bs, 0.28);
    finish(ctx);
    return c;
}

// ============================================================
// 6. Kalam Majhi: two boats pushing against the dark
// ============================================================
function paintKalamStill() {
    const plate = paintPlate();
    const c = makeCanvas(AW, AH), ctx = c.getContext("2d");
    const m = paintMitu({ side: "near", p: 0.33 });
    const k = paintKalam(0.5, 0);
    const kz = S5.KALAM.z, s = depthScale(kz);
    const mx = S5.CONTACT.x + 24, kx = S5.KALAM.x + 24;
    const lp = localToScreen(S5.LANTERN, mx, depthY(kz), s, 1);
    const e = oarGeometry({ side: "near", p: 0.05 }).entry;
    composeFrame(ctx, plate, {
        t: 0, darkness: 0.62, flash: 0, fade: 0,
        sprites: [
            { sprite: "mitu", img: m.img, refl: m.refl, x: mx, z: kz, sx: 1, roll: 0, t: 0 },
            { sprite: "kalam", img: k.img, refl: k.refl, x: kx, z: kz, sx: 1, roll: 0, t: 0 },
        ],
        rings: [
            { x: mx + e[0] * s, y: depthY(kz) + 2, born: -0.6, scale: s, a0: 1 },
            { x: mx + e[0] * s, y: depthY(kz) + 2, born: -1.5, scale: s, a0: 3 },
            { x: kx - 70 * s, y: depthY(kz) + 2, born: -0.9, scale: s, a0: 5 },
        ],
        lantern: [lp[0], lp[1], s],
        marker: null,
    });
    return c;
}

// ============================================================
// 7. the storm arrives: lightning over the house, rain
// ============================================================
function paintStorm() {
    setSeed(707);
    const c = basePaper(), ctx = c.getContext("2d");
    const HZ = 620;
    wash(ctx, [[0, "58,52,78", 0.82], [0.45, "86,78,104", 0.62], [0.57, "120,108,128", 0.5], [0.6, "80,74,96", 0.6], [1, "56,52,70", 0.72]]);
    const [far, farR] = treeLine(HZ, 2000, 2000, 0.42);
    const house = group(AW, AH);
    const s = 1.2, dx = 1420 - 440 * s, dy = 800 - 728 * s;
    withTransform(house, s, 0, 0, s, dx, dy, () => houseHome(house, false));
    const houseC = flatten(house);
    const fore = group(AW, AH);
    reeds(fore, 10, 280, 18, 1, 300);
    inkOn(ctx, [clouds(0, 320, 18, 0.35, 0.55, 20), far, farR, reflect(houseC, 800, 0.4, 200, 12), houseC, streaks(HZ + 20, 1020, 30, 0.4), flatten(fore)]);

    // Mitu's boat tied at the stilts, lantern lit
    const m = paintMitu({ side: "near", p: 0.5 });
    const bx = 1080, by = 840, bs = 0.8;
    placeSprite(ctx, m, MDEF, bx, by, bs);
    const lx = bx + S5.LANTERN[0] * bs, ly = by + S5.LANTERN[1] * bs;
    glow(ctx, lx, ly, 90, 0.5, "240,150,55", 0.6);
    lightStreaks(ctx, lx, ly + 26, bs, 0.45);
    glow(ctx, 553 * s + dx, 609 * s + dy, 54, 0.6, "255,157,77", 0.7);

    // lightning: a jagged line of bare paper, with its glow and its reflection
    const bolt = [[620, -10]];
    let x = 620, y = -10;
    while (y < HZ - 10) { y += rr(28, 60); x += rr(-34, 30); bolt.push([x, Math.min(y, HZ - 10)]); }
    const branch = [bolt[4]];
    let bx2 = bolt[4][0], by2 = bolt[4][1];
    for (let i = 0; i < 5; i++) { by2 += rr(24, 44); bx2 += rr(10, 40); branch.push([bx2, by2]); }
    const drawBolt = (pts, w, a, blur) => {
        ctx.save();
        ctx.globalCompositeOperation = "screen";
        ctx.filter = blur ? `blur(${blur}px)` : "none";
        ctx.strokeStyle = `rgba(244,242,255,${a})`;
        ctx.lineWidth = w;
        ctx.lineJoin = "round";
        ctx.beginPath();
        pts.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]));
        ctx.stroke();
        ctx.restore();
    };
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    const sg = ctx.createRadialGradient(620, 260, 0, 620, 260, 700);
    sg.addColorStop(0, "rgba(220,215,240,0.32)");
    sg.addColorStop(1, "rgba(220,215,240,0)");
    ctx.fillStyle = sg;
    ctx.fillRect(0, 0, AW, AH);
    ctx.restore();
    [bolt, branch].forEach((pts, i) => {
        drawBolt(pts, 26 - i * 10, 0.25, 14);
        drawBolt(pts, 8 - i * 3, 0.7, 2);
        drawBolt(pts, 3.5 - i * 1.5, 1, 0);
    });
    // its broken reflection
    for (let i = 0; i < 20; i++) {
        const yy = HZ + 10 + i * i * 0.9;
        ctx.save();
        ctx.globalCompositeOperation = "screen";
        ctx.fillStyle = `rgba(230,228,250,${0.4 * (1 - i / 20)})`;
        ctx.fillRect(bolt[bolt.length - 1][0] - rr(4, 12) + Math.sin(i) * 8, yy, rr(8, 24), 2);
        ctx.restore();
    }

    // rain: thin slanted ink lines and rings on the water
    ctx.save();
    ctx.globalCompositeOperation = "multiply";
    ctx.lineCap = "round";
    for (let i = 0; i < 1500; i++) {
        const rx = rr(-100, AW + 100), ry = rr(-50, AH), len = rr(26, 70);
        ctx.strokeStyle = inkRGBA(rr(0.1, 0.3));
        ctx.lineWidth = rr(0.8, 1.8);
        ctx.beginPath(); ctx.moveTo(rx, ry); ctx.lineTo(rx - len * 0.28, ry + len); ctx.stroke();
    }
    for (let i = 0; i < 90; i++) {
        const rx = rr(0, AW), ry = rr(HZ + 30, AH - 20), r = rr(4, 12) * (0.6 + (ry - HZ) / 500);
        ctx.strokeStyle = inkRGBA(rr(0.18, 0.4));
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.ellipse(rx, ry, r * 1.4, r * 0.25, 0, 0, Math.PI * 2); ctx.stroke();
    }
    ctx.restore();
    finish(ctx, 0.4);
    return c;
}

// ============================================================
// 8. the fish waits in the pot, by the kupi light
// ============================================================
function paintPot() {
    setSeed(808);
    const c = basePaper(), ctx = c.getContext("2d");
    wash(ctx, [[0, "70,62,82", 0.78], [0.62, "92,82,100", 0.66], [0.66, "110,96,104", 0.55], [1, "66,58,72", 0.7]]);
    const g = group(AW, AH);
    // floor
    stroke(g, [[-20, 760], [AW / 2, 754], [AW + 20, 762]], { w: 6, tone: 0.6, dryness: 0.4, bristles: 6, profile: "even", body: 0.3 });
    for (let i = 0; i < 5; i++) {
        const y = 800 + i * 58;
        stroke(g, [[-20, y], [AW / 2, y + rr(-4, 4)], [AW + 20, y + rr(-3, 3)]], { w: rr(2, 4), tone: rr(0.25, 0.45), dryness: 0.6, bristles: 5, profile: "even", body: 0.1, gap: 30 });
    }
    // the doorway: the storm outside, rain over the haor
    stroke(g, [[1330, 140], [1332, 460], [1328, 770]], { w: 26, tone: 0.8, dryness: 0.35, bristles: 12, profile: "even", loaded: 1, body: 0.5 });
    stroke(g, [[1720, 140], [1722, 460], [1718, 770]], { w: 26, tone: 0.8, dryness: 0.35, bristles: 12, profile: "even", loaded: 1, body: 0.5 });
    stroke(g, [[1310, 140], [1525, 136], [1740, 142]], { w: 22, tone: 0.82, dryness: 0.35, bristles: 12, profile: "even", loaded: 1, body: 0.5 });
    // the clay pot
    const P = 900, PY = 560;
    mass(g.wet, [[P - 150, PY], [P - 230, PY + 80], [P - 250, PY + 170], [P - 210, PY + 250], [P - 110, PY + 300], [P + 110, PY + 300], [P + 210, PY + 250], [P + 250, PY + 170], [P + 230, PY + 80], [P + 150, PY]], { tone: 0.62, tone2: 0.86, jitter: 3 });
    stroke(g, [[P + 160, PY + 6], [P + 238, PY + 90], [P + 246, PY + 190], [P + 190, PY + 268], [P + 90, PY + 300]], { w: 26, tone: 0.95, dryness: 0.35, bristles: 14, profile: "brush", loaded: 1, body: 0.4 });
    stroke(g, [[P - 200, PY + 120], [P, PY + 136], [P + 200, PY + 120]], { w: 3, tone: 0.5, dryness: 0.6, bristles: 3, profile: "even", body: 0 });
    // rim and the water inside
    mass(g.wet, [[P - 170, PY - 18], [P + 170, PY - 18], [P + 176, PY + 6], [P - 176, PY + 6]], { tone: 0.82, jitter: 2 });
    mass(g.wet, [[P - 150, PY - 16], [P + 150, PY - 16], [P + 140, PY - 4], [P - 140, PY - 4]], { tone: 0.18, tone2: 0.1, jitter: 1.5 });
    // the fish's tail out of the water, and its whiskers at the other side
    stroke(g, [[P - 40, PY - 12], [P - 70, PY - 70], [P - 100, PY - 110]], { w: 18, tone: 0.9, dryness: 0.2, bristles: 10, profile: "rise", loaded: 1, body: 0.5 });
    stroke(g, [[P - 100, PY - 108], [P - 150, PY - 140]], { w: 16, tone: 0.9, dryness: 0.3, bristles: 8, profile: "tip", body: 0.4 });
    stroke(g, [[P - 100, PY - 108], [P - 84, PY - 160]], { w: 16, tone: 0.9, dryness: 0.3, bristles: 8, profile: "tip", body: 0.4 });
    [[0, 0], [10, 6], [20, -4]].forEach(([dx, dy]) => {
        stroke(g, [[P + 80, PY - 10], [P + 120 + dx, PY - 40 + dy], [P + 160 + dx, PY - 30 + dy]], { w: 1.6, tone: 0.85, dryness: 0.2, bristles: 1, profile: "tip", body: 0 });
    });
    // the kupi: small clay lamp
    const KX = 420, KY = 740;
    mass(g.wet, [[KX - 44, KY - 30], [KX + 44, KY - 30], [KX + 30, KY], [KX - 30, KY]], { tone: 0.82, jitter: 1.5 });
    mass(g.wet, [[KX - 10, KY - 54], [KX + 10, KY - 54], [KX + 12, KY - 30], [KX - 12, KY - 30]], { tone: 0.9, jitter: 1 });
    // outside is lighter than inside: lift the doorway with a screen wash, then rain
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    const dg = ctx.createLinearGradient(0, 150, 0, 760);
    dg.addColorStop(0, "rgba(150,140,170,0.35)");
    dg.addColorStop(0.62, "rgba(190,175,190,0.5)");
    dg.addColorStop(1, "rgba(120,110,130,0.3)");
    ctx.fillStyle = dg;
    ctx.fillRect(1344, 152, 364, 606);
    ctx.restore();
    ctx.save();
    ctx.beginPath(); ctx.rect(1344, 152, 364, 606); ctx.clip();
    ctx.globalCompositeOperation = "multiply";
    const tl = treeLine(520, 2000, 2000, 0.4)[0];
    ctx.drawImage(tl, 0, 0);
    for (let i = 0; i < 260; i++) {
        const rx = rr(1330, 1760), ry = rr(140, 760), len = rr(24, 60);
        ctx.strokeStyle = inkRGBA(rr(0.12, 0.3));
        ctx.lineWidth = rr(0.8, 1.6);
        ctx.beginPath(); ctx.moveTo(rx, ry); ctx.lineTo(rx - len * 0.25, ry + len); ctx.stroke();
    }
    ctx.restore();
    inkOn(ctx, [flatten(g)]);
    glow(ctx, KX, KY - 74, 520, 0.36, "255,157,77", 0.3);
    glow(ctx, KX, KY - 74, 70, 0.6, "255,157,77", 0.8);
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    ctx.fillStyle = "rgba(255,225,160,0.9)";
    ctx.beginPath();
    ctx.moveTo(KX, KY - 96); ctx.quadraticCurveTo(KX + 9, KY - 72, KX, KY - 58); ctx.quadraticCurveTo(KX - 9, KY - 72, KX, KY - 96);
    ctx.fill();
    // warm light catching the pot's near side
    const pg = ctx.createRadialGradient(P - 220, PY + 140, 0, P - 220, PY + 140, 220);
    pg.addColorStop(0, "rgba(240,150,80,0.32)");
    pg.addColorStop(1, "rgba(240,150,80,0)");
    ctx.fillStyle = pg;
    ctx.fillRect(P - 440, PY - 80, 440, 440);
    ctx.restore();
    finish(ctx, 0.46);
    return c;
}

window.ART = {
    list: ["keyart", "home", "lantern", "memories", "rahim", "kalam", "storm", "pot"],
    paint(name) {
        const fn = { keyart: paintKeyArt, home: paintHome, lantern: paintLantern, memories: paintMemories, rahim: paintRahim, kalam: paintKalamStill, storm: paintStorm, pot: paintPot }[name];
        return fn().toDataURL("image/png");
    },
};

// ============================================================
// cover: portrait 2:3. Mitu alone with her lantern, home a speck on the horizon,
// the storm gathering above. title = true brushes "শেষ খেয়া" into the sky.
// ============================================================

// Mitu, her boat and the lantern, in sprite-local coordinates (anchor 0,0),
// so it can be painted at any size with a transform instead of upscaling a sprite
function mituStrokes(g, pose) {
    const oar = oarGeometry(pose);
    stroke(g, [oar.top, oar.entry], { w: 4.5, tone: 0.98, dryness: 0.12, bristles: 4, profile: "even", loaded: 1, body: 0.3 });
    stroke(g, [oar.entry, oar.tip], { w: 4, tone: 0.3, dryness: 0.4, bristles: 3, profile: "even", body: 0.2 });
    mass(g.wet, [[-210, -44], [-162, -20], [-2, -12], [163, -22], [208, -50], [182, -16], [138, 2], [-2, 12], [-142, 2], [-186, -14]], { tone: 0.72, tone2: 0.9, jitter: 1.6 });
    stroke(g, [[-208, -42], [-174, -10], [-82, 8], [-2, 12], [98, 6], [178, -16], [210, -49]], { w: 11, tone: 0.98, dryness: 0.22, bristles: 12, profile: "brush", loaded: 1, body: 0.4 });
    stroke(g, [[-204, -43], [-142, -21], [-2, -10], [138, -21], [206, -49]], { w: 3.5, tone: 0.85, dryness: 0.35, bristles: 4, profile: "even", body: 0 });
    const [lx, ly] = S5.LANTERN;
    mass(g.wet, [[lx - 9, ly + 14], [lx + 9, ly + 14], [lx + 9, ly + 19], [lx - 9, ly + 19]], { tone: 0.95, jitter: 0.6 });
    stroke(g, [[lx - 8, ly + 14], [lx - 10, ly], [lx - 7, ly - 11]], { w: 2.4, tone: 0.95, dryness: 0.1, bristles: 2, profile: "even", body: 0 });
    stroke(g, [[lx + 8, ly + 14], [lx + 10, ly], [lx + 7, ly - 11]], { w: 2.4, tone: 0.95, dryness: 0.1, bristles: 2, profile: "even", body: 0 });
    mass(g.wet, [[lx - 8, ly - 11], [lx + 8, ly - 11], [lx + 4, ly - 18], [lx - 4, ly - 18]], { tone: 0.95, jitter: 0.6 });
    stroke(g, [[lx - 7, ly - 16], [lx, ly - 28], [lx + 7, ly - 16]], { w: 1.6, tone: 0.9, dryness: 0.2, bristles: 2, profile: "even", body: 0 });
    const fx = -140, fy = -16;
    blob(g.wet, fx + 1, fy - 110, 10, 0.9);
    stroke(g, [[fx - 5, fy - 114], [fx - 14, fy - 104], [fx - 17, fy - 86]], { w: 4, tone: 0.95, dryness: 0.25, bristles: 4, profile: "tip", body: 0.3 });
    mass(g.wet, [[fx - 8, fy - 99], [fx + 9, fy - 99], [fx + 18, fy - 42], [fx - 16, fy - 42]], { tone: 0.38, tone2: 0.5, jitter: 1.5 });
    stroke(g, [[fx + 8, fy - 98], [fx + 13, fy - 70], [fx + 18, fy - 43]], { w: 4, tone: 0.95, dryness: 0.15, bristles: 4, profile: "brush", loaded: 1, body: 0.3 });
    stroke(g, [[fx - 16, fy - 43], [fx + 1, fy - 41], [fx + 18, fy - 44]], { w: 3, tone: 0.9, dryness: 0.3, bristles: 3, profile: "even", body: 0 });
    stroke(g, [[fx - 4, fy - 42], [fx - 5, fy]], { w: 3, tone: 0.95, dryness: 0.1, bristles: 2, profile: "even", body: 0.3 });
    stroke(g, [[fx + 5, fy - 42], [fx + 7, fy]], { w: 3, tone: 0.95, dryness: 0.1, bristles: 2, profile: "even", body: 0.3 });
    stroke(g, [[fx - 4, fy - 99], [fx - 30, fy - 94], [fx - 56, fy - 104], [fx - 86, fy - 96], [fx - 112, fy - 104]], { w: 7, tone: 0.42, dryness: 0.45, bristles: 7, profile: "tip", loaded: 0.7, body: 0.5 });
    const sh = [fx + 2, fy - 94];
    stroke(g, [sh, [(sh[0] + oar.hand[0]) / 2 + 4, (sh[1] + oar.hand[1]) / 2 + 8], oar.hand], { w: 3, tone: 0.95, dryness: 0.1, bristles: 3, profile: "even", body: 0.3 });
    stroke(g, [[sh[0] + 3, sh[1] + 2], [(sh[0] + oar.lower[0]) / 2 + 6, (sh[1] + oar.lower[1]) / 2 + 4], oar.lower], { w: 3, tone: 0.95, dryness: 0.1, bristles: 3, profile: "even", body: 0.3 });
}

async function paintCover(title) {
    AW = 1600; AH = 2400;
    setSeed(909);
    const c = basePaper(), ctx = c.getContext("2d");
    const HZ = 1500;

    // storm above, warm last light at the horizon
    wash(ctx, [[0, "92,84,112", 0.62], [0.3, "150,136,160", 0.42], [0.55, "222,170,140", 0.3], [0.62, "236,160,108", 0.36], [0.63, "214,184,170", 0.2], [1, "170,156,164", 0.34]]);
    ctx.save();
    ctx.globalCompositeOperation = "multiply";
    ctx.filter = "blur(3px)";
    const sg = ctx.createRadialGradient(1060, HZ - 6, 0, 1060, HZ - 6, 90);
    sg.addColorStop(0, "rgba(214,104,62,0.14)");
    sg.addColorStop(0.85, "rgba(205,95,58,0.26)");
    sg.addColorStop(0.95, "rgba(195,85,50,0.32)");
    sg.addColorStop(1, "rgba(220,120,70,0)");
    ctx.fillStyle = sg;
    ctx.beginPath(); ctx.arc(1060, HZ - 6, 90, Math.PI, 0); ctx.lineTo(1150, HZ); ctx.lineTo(970, HZ); ctx.fill();
    ctx.filter = "none";
    for (let i = 0; i < 22; i++) {
        const w = rr(60, 170) * (1 - i / 26);
        ctx.fillStyle = `rgba(210,110,68,${0.22 * (1 - i / 24)})`;
        ctx.fillRect(1060 - w / 2 + rr(-16, 16), HZ + 10 + i * i * 1.5, w, rr(1.5, 3.5));
    }
    ctx.restore();

    const storm = clouds(-60, 560, 26, 0.3, 0.52, 26);
    fadeBetween(storm, 380, 900);
    const thin = clouds(600, 1100, 10, 0.08, 0.16, 20);
    fadeBetween(thin, 900, 1300);
    const [far, farR] = treeLine(HZ, 900, 1220, 0.2, false);

    // home: a speck on the horizon with one light
    const home = group(AW, AH);
    mass(home.wet, [[250, HZ - 6], [300, HZ - 6], [300, HZ - 22], [250, HZ - 22]], { tone: 0.5, jitter: 1 });
    mass(home.wet, [[243, HZ - 20], [307, HZ - 20], [292, HZ - 34], [258, HZ - 34]], { tone: 0.62, jitter: 1 });
    hijol(home, 520, HZ + 40, 0.8, 0.3);
    birds(home, [[1040, 860, 1.4], [1094, 892, 1.1], [1150, 846, 1.2], [990, 910, 1], [1200, 900, 0.9], [1250, 860, 0.8]]);
    const homeC = flatten(home);

    // the boat, large, close to us
    const b = group(AW, AH);
    const BX = 780, BY = 1930, BS = 2.1;
    withTransform(b, BS, 0, 0, BS, BX, BY, () => mituStrokes(b, { side: "near", p: 0.42 }));
    const boatC = flatten(b);

    const fore = group(AW, AH);
    reeds(fore, 0, 260, 22, 1, 520);
    reeds(fore, 1380, 1600, 16, -1, 420);
    for (let i = 0; i < 18; i++) blob(fore.wet, rr(1120, 1560), rr(2250, 2380), rr(16, 30), rr(0.4, 0.62), 0.5);
    stroke(fore, [[-40, 2370], [300, 2340], [700, 2372]], { w: 110, tone: 0.2, dryness: 0.55, bristles: 26, profile: "brush", loaded: 0.6, body: 0.9, gap: 50 });

    inkOn(ctx, [storm, thin, far, farR, reflect(homeC, HZ + 42, 0.34, 120, 21), homeC, streaks(HZ + 30, 2340, 46, 0.3),
        reflect(boatC, BY, 0.4, 330, 22), boatC, flatten(fore)]);
    ctx.save(); ctx.globalCompositeOperation = "multiply";
    const e = oarGeometry({ side: "near", p: 0.42 }).entry;
    rings(ctx, BX + e[0] * BS, BY + 4, BS, 4, 0.42);
    ctx.restore();

    // the far kupi and the lantern: the only colour
    glow(ctx, 275, HZ - 16, 22, 0.7, "255,157,77", 0.7);
    const lx = BX + S5.LANTERN[0] * BS, ly = BY + S5.LANTERN[1] * BS;
    glow(ctx, lx, ly, 230, 0.48, "240,150,55", 0.55);
    glow(ctx, lx, ly, 46, 0.6, "240,150,55", 0.8);
    lightStreaks(ctx, lx, ly + 56, BS, 0.4, 14);

    if (title) {
        await document.fonts.load('240px "Tiro Bangla"', "শেষ খেয়া");
        const t = makeCanvas(AW, AH), tctx = t.getContext("2d");
        tctx.font = '250px "Tiro Bangla"';
        tctx.textAlign = "center";
        tctx.fillStyle = inkRGBA(0.95);
        tctx.fillText("শেষ খেয়া", AW / 2, 1150);
        // dry brush breakup
        tctx.globalCompositeOperation = "destination-out";
        // horizontal "flying white" streaks, as if dragged with a dry brush
        for (let i = 0; i < 3500; i++) {
            const x = rr(200, 1400), y = rr(850, 1220);
            if (noise(x / 40, y / 3) < 0.3) {
                tctx.fillStyle = `rgba(0,0,0,${rr(0.2, 0.6)})`;
                tctx.fillRect(x, y, rr(10, 40), rr(0.6, 1.4));
            }
        }
        // ink pooling: denser where the brush stopped
        tctx.globalCompositeOperation = "source-atop";
        for (let i = 0; i < 40; i++) {
            const gr = tctx.createRadialGradient(rr(250, 1350), rr(950, 1180), 0, rr(250, 1350), rr(950, 1180), rr(40, 120));
            gr.addColorStop(0, "rgba(10,8,8,0.5)");
            gr.addColorStop(1, "rgba(10,8,8,0)");
            tctx.fillStyle = gr;
            tctx.fillRect(0, 800, AW, 500);
        }
        ctx.save();
        ctx.globalCompositeOperation = "multiply";
        ctx.globalAlpha = 0.28; ctx.filter = "blur(5px)"; ctx.drawImage(t, 0, 0);
        ctx.globalAlpha = 1; ctx.filter = "blur(0.5px)"; ctx.drawImage(t, 0, 0);
        ctx.restore();
    }

    finish(ctx, 0.36);
    const out = c.toDataURL("image/png");
    AW = 1920; AH = 1080;
    return out;
}

window.COVER = { paint: paintCover };
