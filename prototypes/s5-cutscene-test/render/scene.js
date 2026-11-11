// Scene 5 (Kalam Majhi) for the offline renderer:
// paints the plate (everything that never moves), paints Mitu's and Kalam's
// sprites for any pose, and describes each cutscene as a function of time.
// The game loads the plate and sprite PNGs; the videos are frames of clipFrame().

const W = S5.W, H = S5.H;
const HORIZON = 612;

// ---------- plate ----------
function paintPlate() {
    setSeed(11);
    const plate = makeCanvas(W, H), ctx = plate.getContext("2d");

    // paper
    const img = ctx.createImageData(W, H), d = img.data;
    for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
            const l = 1 + (fbm(x / 260, y / 260, 4) - 0.5) * 0.12 + (noise(x / 2.2, y / 2.2) - 0.5) * 0.025;
            const i = (y * W + x) * 4;
            d[i] = 242 * l; d[i + 1] = 236 * l; d[i + 2] = 222 * l; d[i + 3] = 255;
        }
    }
    ctx.putImageData(img, 0, 0);
    for (let i = 0; i < 2600; i++) {
        const x = rr(0, W), y = rr(0, H), len = rr(6, 26), ang = [0.3, 1.9, 2.7][i % 3] + rr(-0.3, 0.3);
        ctx.strokeStyle = i % 5 === 0 ? "rgba(120,105,85,0.10)" : "rgba(255,252,244,0.35)";
        ctx.lineWidth = rr(0.4, 1);
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(ang) * len, y + Math.sin(ang) * len); ctx.stroke();
    }

    // evening wash: grey-violet sky, a dull rose band of last light at the horizon
    ctx.globalCompositeOperation = "multiply";
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, "rgba(118,110,142,0.62)");
    sky.addColorStop(0.45, "rgba(176,150,168,0.34)");
    sky.addColorStop(0.565, "rgba(214,168,160,0.30)");
    sky.addColorStop(0.6, "rgba(190,170,180,0.22)");
    sky.addColorStop(1, "rgba(120,110,134,0.42)");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);
    ctx.globalCompositeOperation = "source-over";

    const layers = [];

    // storm clouds: heavy wet masses along the top, dissolving downward
    {
        // broad wet washes, heavily bled, so they read as rain clouds, not shapes
        const g = group(W, H);
        for (let i = 0; i < 22; i++) {
            const cx = rr(-150, W + 150), cy = rr(20, 210), rw = rr(160, 340), rh = rr(40, 90);
            const poly = [];
            for (let k = 0; k < 24; k++) {
                const a = (k / 24) * Math.PI * 2;
                const wob = 0.8 + 0.4 * noise(cx / 50 + Math.cos(a) * 2, cy / 50 + Math.sin(a) * 2);
                poly.push([cx + Math.cos(a) * rw * wob, cy + Math.sin(a) * rh * wob * (Math.sin(a) > 0 ? 0.6 : 1)]);
            }
            mass(g.wet, poly, { tone: rr(0.14, 0.26), tone2: rr(0.06, 0.12), jitter: 6 });
        }
        const soft = flatten(g);
        const c = makeCanvas(W, H), cctx = c.getContext("2d");
        cctx.filter = "blur(14px)";
        cctx.drawImage(soft, 0, 0);
        cctx.filter = "none";
        // a few long dry streaks for wind
        const g2 = group(W, H);
        for (let i = 0; i < 9; i++) {
            const x = rr(-100, W), y = rr(90, 280), len = rr(260, 620);
            stroke(g2, [[x, y], [x + len * 0.5, y + rr(-6, 6)], [x + len, y + rr(-4, 4)]], { w: rr(5, 12), tone: rr(0.16, 0.26), dryness: 0.7, bristles: 9, profile: "tip", body: 0.2, gap: 30 });
        }
        cctx.drawImage(flatten(g2), 0, 0);
        fadeBetween(c, 170, 400);
        layers.push(c);
    }

    // far tree line, the home far to the left
    {
        const g = group(W, H);
        const blobs = [];
        for (let x = -20; x < W + 40; x += rr(26, 70)) {
            if (x > 900 && x < 1100) continue;
            blobs.push([x, rr(12, 34)]);
        }
        const top = x => {
            let h = 4 + 2 * noise(x / 20, 3);
            blobs.forEach(([cx, r]) => { const dd = r * r - (x - cx) * (x - cx); if (dd > 0) h = Math.max(h, Math.sqrt(dd) * 0.75 + 4); });
            return HORIZON - h;
        };
        const poly = [];
        for (let x = 0; x <= W; x += 6) poly.push([x, top(x)]);
        poly.push([W, HORIZON + 6], [0, HORIZON + 6]);
        mass(g.wet, poly, { tone: 0.24, tone2: 0.1, jitter: 2 });
        // tiny house, far away: home
        mass(g.wet, [[208, 604], [252, 604], [252, 590], [208, 590]], { tone: 0.42, jitter: 1 });
        mass(g.wet, [[202, 592], [258, 592], [244, 580], [216, 580]], { tone: 0.55, jitter: 1 });
        const c = flatten(g);
        fadeBetween(c, HORIZON - 26, HORIZON + 6);
        layers.push(c, reflect(c, HORIZON + 4, 0.32, 36, 5));
    }

    // a pair of flooded hijol trees, far left
    {
        const g = group(W, H);
        [[700, 662, 0.55], [790, 660, 0.45]].forEach(([x, wl, s]) => {
            stroke(g, [[x, wl + 3], [x - 2 * s, wl - 30 * s], [x + 2 * s, wl - 62 * s]], { w: 7 * s, tone: 0.45, dryness: 0.3, bristles: 6, profile: "rise", loaded: 0.8, body: 0.6 });
            for (let k = 0; k < 14; k++) {
                const dx = rr(-60, 60);
                blob(g.wet, x + dx * s, wl - (86 + rr(-16, 16) - Math.abs(dx) * 0.12) * s, rr(16, 30) * s, rr(0.24, 0.38), 0.58);
            }
            for (let k = 0; k < 30; k++) {
                g.dry.fillStyle = inkRGBA(rr(0.4, 0.75));
                g.dry.beginPath();
                g.dry.ellipse(x + rr(-60, 60) * s, wl - 92 * s + rr(-26, 18) * s, rr(1.5, 3) * s, rr(1, 2) * s, rr(0, 3), 0, Math.PI * 2);
                g.dry.fill();
            }
        });
        const c = flatten(g);
        layers.push(c, reflect(c, 664, 0.36, 70, 6));
    }

    // water hyacinth around Kalam's boat
    {
        const g = group(W, H);
        const ky = depthY(S5.KALAM.z), ks = depthScale(S5.KALAM.z);
        for (let i = 0; i < 46; i++) {
            const x = rr(1060, 1680), y = ky + rr(-16, 22);
            blob(g.wet, x, y, rr(9, 19) * ks, rr(0.3, 0.55), 0.5);
        }
        for (let i = 0; i < 28; i++) {
            g.dry.fillStyle = inkRGBA(rr(0.55, 0.9));
            g.dry.beginPath();
            g.dry.ellipse(rr(1050, 1690), ky + rr(-22, 22), rr(1.5, 3.5), rr(1.2, 2.5), rr(0, 3), 0, Math.PI * 2);
            g.dry.fill();
        }
        // a few clumps drifting nearer
        for (let i = 0; i < 10; i++) blob(g.wet, rr(1180, 1560), ky + rr(34, 60), rr(8, 14) * ks, rr(0.25, 0.4), 0.5);
        layers.push(flatten(g));
    }

    // water: blank paper, dry streaks
    {
        const g = group(W, H);
        for (let i = 0; i < 30; i++) {
            const y = rr(668, 1020), x = rr(-100, W - 100), len = rr(60, 340) * (0.5 + (y - 660) / 400);
            stroke(g, [[x, y], [x + len / 2, y + rr(-2, 2)], [x + len, y + rr(-1, 1)]], { w: rr(1.5, 3.5) * (0.6 + (y - 660) / 420), tone: rr(0.12, 0.26), dryness: 0.6, bristles: 3, profile: "even", body: 0 });
        }
        layers.push(flatten(g));
    }

    // foreground reeds, both corners
    {
        const g = group(W, H);
        const reeds = (x0, x1, n) => {
            for (let i = 0; i < n; i++) {
                const x = rr(x0, x1), h = rr(110, 260), lean = rr(-30, 60) * (x0 > 900 ? -1 : 1);
                stroke(g, [[x, H + 10], [x + lean * 0.15, H - h * 0.45], [x + lean * 0.55, H - h * 0.8], [x + lean, H - h]], { w: rr(6, 12), tone: rr(0.5, 0.9), dryness: rr(0.3, 0.55), bristles: 8, profile: "tip", loaded: 1, body: 0.55, gap: 20 });
            }
        };
        stroke(g, [[-40, 1052], [160, 1036], [400, 1050]], { w: 70, tone: 0.18, dryness: 0.55, bristles: 22, profile: "brush", loaded: 0.6, body: 0.9, gap: 40 });
        reeds(10, 260, 16);
        reeds(1700, 1910, 12);
        layers.push(flatten(g));
    }

    ctx.save();
    ctx.globalCompositeOperation = "multiply";
    layers.forEach(l => ctx.drawImage(l, 0, 0));

    // grain and vignette are baked in: multiply commutes, so ink drawn on
    // top later (also multiply) still picks up the paper texture
    const grain = makeCanvas(W, H), gctx = grain.getContext("2d");
    const gi = gctx.createImageData(W, H), gd = gi.data;
    for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
            const v = 255 * (1 - 0.1 * (noise(x / 3, y / 3) * 0.6 + noise(x / 11, y / 11) * 0.4));
            const i = (y * W + x) * 4;
            gd[i] = v; gd[i + 1] = v; gd[i + 2] = v; gd[i + 3] = 255;
        }
    }
    gctx.putImageData(gi, 0, 0);
    ctx.globalAlpha = 0.6;
    ctx.drawImage(grain, 0, 0);
    ctx.globalAlpha = 1;
    const v = ctx.createRadialGradient(W / 2, H / 2, H * 0.45, W / 2, H / 2, W * 0.62);
    v.addColorStop(0, "rgba(255,255,255,0)");
    v.addColorStop(1, "rgba(140,125,110,0.3)");
    ctx.fillStyle = v;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();

    // the kupi light at home, far away
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    const kg = ctx.createRadialGradient(232, 598, 0, 232, 598, 14);
    kg.addColorStop(0, "rgba(255,180,90,0.7)");
    kg.addColorStop(1, "rgba(255,180,90,0)");
    ctx.fillStyle = kg;
    ctx.beginPath(); ctx.arc(232, 598, 14, 0, Math.PI * 2); ctx.fill();
    ctx.restore();

    return plate;
}

// ---------- Mitu: boat, girl, oar, lantern ----------
// pose: { side: "near" | "far", p: 0..1 }; rest = { side: "near", p: 0.5 }
function paintMitu(pose) {
    const def = S5.SPRITE.mitu;
    const out = makeCanvas(def.w, def.h), octx = out.getContext("2d");
    const ox = def.ax, oy = def.ay;
    const P = ([x, y]) => [x + ox, y + oy];
    const PP = pts => pts.map(P);
    const oar = oarGeometry(pose);

    const paintOar = (g, tone) => {
        stroke(g, [P(oar.top), P(oar.entry)], { w: 4.5, tone, dryness: 0.12, bristles: 4, profile: "even", loaded: 1, body: 0.3 });
        stroke(g, [P(oar.entry), P(oar.tip)], { w: 4, tone: tone * 0.3, dryness: 0.4, bristles: 3, profile: "even", body: 0.2 });
        const t = oar.tip, d = [Math.sin(oar.a), Math.cos(oar.a)], n = [d[1], -d[0]];
        mass(g.wet, PP([
            [t[0] - d[0] * 34 + n[0] * 3, t[1] - d[1] * 34 + n[1] * 3],
            [t[0] + n[0] * 8, t[1] + n[1] * 8],
            [t[0] - n[0] * 8, t[1] - n[1] * 8],
            [t[0] - d[0] * 34 - n[0] * 3, t[1] - d[1] * 34 - n[1] * 3],
        ]), { tone: tone * 0.25, tone2: tone * 0.12, jitter: 1 });
    };

    // far-side oar sits behind the hull
    if (pose.side === "far") {
        setSeed(301);
        const gFar = group(def.w, def.h);
        paintOar(gFar, 0.6);
        octx.drawImage(flatten(gFar), 0, 0);
    }

    setSeed(302);
    const g = group(def.w, def.h);
    // hull
    mass(g.wet, PP([[-210, -44], [-162, -20], [-2, -12], [163, -22], [208, -50], [182, -16], [138, 2], [-2, 12], [-142, 2], [-186, -14]]), { tone: 0.72, tone2: 0.9, jitter: 1.6 });
    stroke(g, PP([[-208, -42], [-174, -10], [-82, 8], [-2, 12], [98, 6], [178, -16], [210, -49]]), { w: 11, tone: 0.98, dryness: 0.22, bristles: 10, profile: "brush", loaded: 1, body: 0.4 });
    stroke(g, PP([[-204, -43], [-142, -21], [-2, -10], [138, -21], [206, -49]]), { w: 3.5, tone: 0.85, dryness: 0.35, bristles: 4, profile: "even", body: 0 });

    // lantern on the bow
    const [lx, ly] = S5.LANTERN;
    mass(g.wet, PP([[lx - 9, ly + 14], [lx + 9, ly + 14], [lx + 9, ly + 19], [lx - 9, ly + 19]]), { tone: 0.95, jitter: 0.6 });
    stroke(g, PP([[lx - 8, ly + 14], [lx - 10, ly], [lx - 7, ly - 11]]), { w: 2.4, tone: 0.95, dryness: 0.1, bristles: 2, profile: "even", body: 0 });
    stroke(g, PP([[lx + 8, ly + 14], [lx + 10, ly], [lx + 7, ly - 11]]), { w: 2.4, tone: 0.95, dryness: 0.1, bristles: 2, profile: "even", body: 0 });
    mass(g.wet, PP([[lx - 8, ly - 11], [lx + 8, ly - 11], [lx + 4, ly - 18], [lx - 4, ly - 18]]), { tone: 0.95, jitter: 0.6 });
    stroke(g, PP([[lx - 7, ly - 16], [lx, ly - 28], [lx + 7, ly - 16]]), { w: 1.6, tone: 0.9, dryness: 0.2, bristles: 2, profile: "even", body: 0 });

    // Mitu at the stern
    const fx = -140, fy = -16;
    blob(g.wet, ...P([fx + 1, fy - 110]), 10, 0.9);
    stroke(g, PP([[fx - 5, fy - 114], [fx - 14, fy - 104], [fx - 17, fy - 86]]), { w: 4, tone: 0.95, dryness: 0.25, bristles: 4, profile: "tip", body: 0.3 });
    mass(g.wet, PP([[fx - 8, fy - 99], [fx + 9, fy - 99], [fx + 18, fy - 42], [fx - 16, fy - 42]]), { tone: 0.38, tone2: 0.5, jitter: 1.5 });
    stroke(g, PP([[fx + 8, fy - 98], [fx + 13, fy - 70], [fx + 18, fy - 43]]), { w: 4, tone: 0.95, dryness: 0.15, bristles: 4, profile: "brush", loaded: 1, body: 0.3 });
    stroke(g, PP([[fx - 16, fy - 43], [fx + 1, fy - 41], [fx + 18, fy - 44]]), { w: 3, tone: 0.9, dryness: 0.3, bristles: 3, profile: "even", body: 0 });
    stroke(g, PP([[fx - 4, fy - 42], [fx - 5, fy]]), { w: 3, tone: 0.95, dryness: 0.1, bristles: 2, profile: "even", body: 0.3 });
    stroke(g, PP([[fx + 5, fy - 42], [fx + 7, fy]]), { w: 3, tone: 0.95, dryness: 0.1, bristles: 2, profile: "even", body: 0.3 });
    // orna trailing behind
    stroke(g, PP([[fx - 4, fy - 99], [fx - 28, fy - 96], [fx - 50, fy - 104], [fx - 74, fy - 98]]), { w: 7, tone: 0.42, dryness: 0.45, bristles: 6, profile: "tip", loaded: 0.7, body: 0.5 });
    // arms to the oar
    const sh = [fx + 2, fy - 94];
    stroke(g, PP([sh, [(sh[0] + oar.hand[0]) / 2 + 4, (sh[1] + oar.hand[1]) / 2 + 8], oar.hand]), { w: 3, tone: 0.95, dryness: 0.1, bristles: 3, profile: "even", body: 0.3 });
    stroke(g, PP([[sh[0] + 3, sh[1] + 2], [(sh[0] + oar.lower[0]) / 2 + 6, (sh[1] + oar.lower[1]) / 2 + 4], oar.lower]), { w: 3, tone: 0.95, dryness: 0.1, bristles: 3, profile: "even", body: 0.3 });
    if (pose.side === "near") paintOar(g, 0.98);

    octx.drawImage(flatten(g), 0, 0);
    return { img: out, refl: reflect(out, oy, 0.38, 130, 303) };
}

// ---------- Kalam: old boat, old man pushing with a pole ----------
function kalamPose(phase, nod) {
    const push = Math.pow(Math.sin(Math.PI * phase), 2);
    const lean = 0.12 + 0.4 * push;
    const feet = [36, -20];
    const hip = [feet[0] + 44 * Math.sin(lean), feet[1] - 44 * Math.cos(lean)];
    const up = lean * 1.3;
    const sh = [hip[0] + 46 * Math.sin(up), hip[1] - 46 * Math.cos(up)];
    const hd = [sh[0] + 15 * Math.sin(up + nod * 0.7), sh[1] - 15 * Math.cos(up + nod * 0.7)];
    const hands = [sh[0] + 4, sh[1] + 16];
    const base = [-70 - 18 * push, 74];
    const dx = hands[0] - base[0], dy = hands[1] - base[1], l = Math.hypot(dx, dy);
    const poleTop = [hands[0] + (dx / l) * 50, hands[1] + (dy / l) * 50];
    return { push, feet, hip, sh, hd, hands, base, poleTop };
}

function paintKalam(phase, nod = 0) {
    const def = S5.SPRITE.kalam;
    const out = makeCanvas(def.w, def.h), octx = out.getContext("2d");
    const P = ([x, y]) => [x + def.ax, y + def.ay];
    const PP = pts => pts.map(P);
    const k = kalamPose(phase, nod);

    setSeed(401);
    const g = group(def.w, def.h);
    // old hull: longer, drier, broken
    mass(g.wet, PP([[-246, -40], [-196, -18], [0, -10], [196, -20], [244, -44], [214, -12], [160, 4], [0, 12], [-170, 4], [-222, -12]]), { tone: 0.6, tone2: 0.82, jitter: 2.2 });
    stroke(g, PP([[-244, -40], [-200, -8], [-90, 8], [0, 12], [110, 6], [210, -12], [246, -43]]), { w: 10, tone: 0.92, dryness: 0.42, bristles: 10, profile: "brush", loaded: 1, body: 0.35 });
    stroke(g, PP([[-240, -41], [-170, -19], [0, -9], [168, -18], [240, -43]]), { w: 3, tone: 0.8, dryness: 0.55, bristles: 4, profile: "even", body: 0 });
    // the pole into the water
    stroke(g, PP([k.poleTop, k.hands, [k.base[0] + (k.hands[0] - k.base[0]) * 0.55, k.base[1] + (k.hands[1] - k.base[1]) * 0.55]]), { w: 4, tone: 0.95, dryness: 0.15, bristles: 4, profile: "even", loaded: 1, body: 0.3 });
    stroke(g, PP([[k.base[0] + (k.hands[0] - k.base[0]) * 0.55, k.base[1] + (k.hands[1] - k.base[1]) * 0.55], k.base]), { w: 3.5, tone: 0.28, dryness: 0.4, bristles: 3, profile: "even", body: 0.2 });
    // legs
    stroke(g, PP([k.hip, [k.feet[0] - 16, k.feet[1] - 22], [k.feet[0] - 20, k.feet[1]]]), { w: 3.4, tone: 0.95, dryness: 0.15, bristles: 3, profile: "even", body: 0.3 });
    stroke(g, PP([k.hip, [k.feet[0] + 14, k.feet[1] - 20], [k.feet[0] + 12, k.feet[1]]]), { w: 3.4, tone: 0.95, dryness: 0.15, bristles: 3, profile: "even", body: 0.3 });
    // lungi: pale mass from hip to knees
    mass(g.wet, PP([[k.hip[0] - 10, k.hip[1] - 4], [k.hip[0] + 10, k.hip[1] - 4], [k.feet[0] + 16, k.feet[1] - 16], [k.feet[0] - 18, k.feet[1] - 16]]), { tone: 0.32, tone2: 0.42, jitter: 1.5 });
    // thin bent body
    stroke(g, PP([k.hip, [(k.hip[0] + k.sh[0]) / 2 + 3, (k.hip[1] + k.sh[1]) / 2], k.sh]), { w: 8, tone: 0.9, dryness: 0.2, bristles: 6, profile: "rise", loaded: 1, body: 0.5 });
    blob(g.wet, ...P(k.hd), 8.5, 0.88);
    // white cap: left as paper with a dry rim
    stroke(g, PP([[k.hd[0] - 8, k.hd[1] - 4], [k.hd[0], k.hd[1] - 10], [k.hd[0] + 8, k.hd[1] - 5]]), { w: 2, tone: 0.7, dryness: 0.4, bristles: 2, profile: "even", body: 0 });
    // arms on the pole
    stroke(g, PP([k.sh, [k.sh[0] + 10, k.sh[1] + 8], k.hands]), { w: 3, tone: 0.95, dryness: 0.1, bristles: 3, profile: "even", body: 0.3 });
    // gamchha over the shoulder
    stroke(g, PP([[k.sh[0] - 2, k.sh[1] - 2], [k.sh[0] - 14, k.sh[1] + 10], [k.sh[0] - 18, k.sh[1] + 26]]), { w: 5, tone: 0.45, dryness: 0.45, bristles: 5, profile: "tip", body: 0.4 });

    octx.drawImage(flatten(g), 0, 0);
    return { img: out, refl: reflect(out, def.ay, 0.34, 130, 402) };
}

// ---------- cutscene timelines ----------
const ease = u => 1 - Math.pow(1 - Math.max(0, Math.min(1, u)), 2.2);
const lerp = (a, b, u) => a + (b - a) * Math.max(0, Math.min(1, u));

// a rowing schedule: n strokes from t0, every gap seconds, starting on `firstSide`
function rowPose(t, t0, n, gap, firstSide) {
    const STROKE = 0.4, RECOVER = 0.25;
    const k = Math.floor((t - t0) / gap);
    if (t < t0 || k >= n) return { side: "near", p: 0.5 };
    const u = t - t0 - k * gap;
    const side = (k % 2 === 0) === (firstSide === "near") ? "near" : "far";
    if (u < STROKE) return { side, p: u / STROKE };
    if (u < STROKE + RECOVER) return { side, p: 1 - 0.5 * ((u - STROKE) / RECOVER) };
    return { side, p: 0.5 };
}
function rowStarts(t, t0, n, gap) {
    const out = [];
    for (let k = 0; k < n; k++) { const s = t0 + k * gap; if (s <= t) out.push(s); }
    return out;
}

function ringAt(boatX, z, sx, pose, born, idx) {
    const s = depthScale(z);
    const e = oarGeometry(pose).entry;
    return { x: boatX + e[0] * s * sx, y: depthY(z) + 2, born, scale: s, a0: (idx * 1.7) % 6.28 };
}

const CLIPS = {
    intro: {
        duration: 8,
        state(t) {
            const ROW_T0 = 0.3, N = 9, GAP = 0.65;
            const mx = t2 => lerp(-280, S5.MITU_START.x, ease(t2 / 6));
            const pose = rowPose(t, ROW_T0, N, GAP, "near");
            const rings = rowStarts(t, ROW_T0, N, GAP).map((s, i) => ringAt(mx(s), S5.MITU_START.z, 1, rowPose(s + 0.02, ROW_T0, N, GAP, "near"), s, i));
            const flash = 0.32 * Math.exp(-Math.pow((t - 3.6) / 0.05, 2)) + 0.22 * Math.exp(-Math.pow((t - 3.82) / 0.08, 2));
            return {
                t, darkness: 0, flash, fade: t < 1.4 ? 1 - t / 1.4 : 0,
                mitu: { pose, x: mx(t), z: S5.MITU_START.z, sx: 1 },
                kalam: { phase: kalamPhase(t), nod: 0, x: S5.KALAM.x, z: S5.KALAM.z },
                rings,
            };
        },
    },

    // starts where the push ends: both boats moved PUSH_DISTANCE, darkness 1
    helped: {
        duration: 14,
        state(t) {
            const k0 = S5.KALAM.x + S5.PUSH_DISTANCE, m0 = S5.CONTACT.x + S5.PUSH_DISTANCE;
            const phase = t < 2 ? t / 2 : 0;
            const nod = Math.max(0, Math.sin(Math.PI * (t - 10.2) / 1.2)) * (t > 10.2 && t < 11.4 ? 1 : 0);
            const kz = S5.KALAM.z;
            const rings = [0.15, 0.7, 1.4].map((b, i) => ({ x: lerp(k0, 1560, ease(b / 3.2)) - 190 * depthScale(kz), y: depthY(kz) + 2, born: b, scale: depthScale(kz), a0: i * 2.1 }));
            return {
                t, darkness: 1, flash: 0, fade: t > 12.6 ? (t - 12.6) / 1.4 : 0,
                mitu: { pose: { side: "near", p: 0.5 }, x: lerp(m0, m0 - 26, ease(t / 3)), z: kz, sx: 1 },
                kalam: { phase, nod, x: lerp(k0, 1560, ease(t / 3.2)), z: kz },
                rings,
            };
        },
    },

    // starts where the choice was made: Mitu at MITU_START, at rest
    declined: {
        duration: 11,
        state(t) {
            const ROW_T0 = 2.5, N = 11, GAP = 0.65;
            const turn = Math.max(0, Math.min(1, (t - 1.6) / 0.8));
            const sx = Math.cos(Math.PI * turn);
            const mx = t2 => lerp(S5.MITU_START.x, -340, ease((t2 - ROW_T0) / 7.4) * 0.92 + Math.max(0, (t2 - ROW_T0) / 7.4) * 0.08);
            const pose = rowPose(t, ROW_T0, N, GAP, "near");
            const rings = rowStarts(t, ROW_T0, N, GAP).map((s, i) => ringAt(mx(s), S5.MITU_START.z, -1, rowPose(s + 0.02, ROW_T0, N, GAP, "near"), s, i));
            // Kalam stops, nods without a word, then keeps pushing alone
            const phase = t < 2.2 ? 0 : kalamPhase(t - 2.2);
            const nod = t > 0.5 && t < 1.9 ? Math.sin(Math.PI * (t - 0.5) / 1.4) : 0;
            return {
                t, darkness: lerp(0, 0.4, t / 11), flash: 0, fade: t > 9.6 ? (t - 9.6) / 1.4 : 0,
                mitu: { pose, x: mx(t), z: S5.MITU_START.z, sx: Math.abs(sx) < 0.04 ? 0.04 * Math.sign(sx || 1) : sx },
                kalam: { phase, nod, x: S5.KALAM.x, z: S5.KALAM.z },
                rings,
            };
        },
    },
};

// turn a clip state into the shared composeFrame() input
function clipFrame(ctx, plate, name, t) {
    const st = CLIPS[name].state(t);
    const m = paintMitu(st.mitu.pose);
    const k = paintKalam(st.kalam.phase, st.kalam.nod);
    const ms = depthScale(st.mitu.z);
    const lp = localToScreen(S5.LANTERN, st.mitu.x, depthY(st.mitu.z) + bob(t, ms), ms, st.mitu.sx);
    composeFrame(ctx, plate, {
        t, darkness: st.darkness, flash: st.flash, fade: st.fade,
        sprites: [
            { sprite: "mitu", img: m.img, refl: m.refl, x: st.mitu.x, z: st.mitu.z, sx: st.mitu.sx, roll: 0, t },
            { sprite: "kalam", img: k.img, refl: k.refl, x: st.kalam.x, z: st.kalam.z, sx: 1, roll: 0, t },
        ],
        rings: st.rings,
        lantern: [lp[0], lp[1], ms],
        marker: null,
    });
}
