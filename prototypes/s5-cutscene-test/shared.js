// Shared by the video renderer AND the live game.
// Both draw a frame with composeFrame(), using the same plate, the same sprites and
// the same numbers, so the last frame of a video and the first frame of gameplay match.
// If you change a value here, re-render the videos (render/README.md).

const S5 = {
    W: 1920,
    H: 1080,
    FPS: 24,

    // water plane: z = 0 is the far edge, z = 1 the near edge
    WATER_FAR_Y: 650,
    WATER_NEAR_Y: 905,

    // every clip starts and ends on a multiple of SYNC seconds, so the
    // looping motions (bob, Kalam's push) are at phase 0 at every handoff
    SYNC: 4,
    BOB_PERIOD: 4,
    KALAM_LOOP: 2,

    KALAM: { x: 1300, z: 0.35 },
    MITU_START: { x: 560, z: 0.85 },
    CONTACT: { x: 1036, z: 0.35 },
    PUSH_DISTANCE: 50,

    // sprite canvases: (ax, ay) is the waterline point under the boat's middle
    SPRITE: {
        mitu: { w: 560, h: 560, ax: 280, ay: 300 },
        kalam: { w: 640, h: 560, ax: 320, ay: 300 },
    },
    LANTERN: [166, -38],          // lantern position inside Mitu's sprite, from the anchor

    // sprite frames the game has (videos use continuous values)
    STROKE_FRAMES: [0, 0.33, 0.66, 1],
    KALAM_FRAMES: 8,
};

// ink colour: cool grey when thin, warm black when dense
function inkRGBA(a) {
    a = Math.max(0, Math.min(1, a));
    const k = Math.pow(a, 0.7);
    const r = 133 + (19 - 133) * k, g = 140 + (17 - 140) * k, b = 148 + (16 - 148) * k;
    return `rgba(${r | 0},${g | 0},${b | 0},${a})`;
}

const depthY = z => S5.WATER_FAR_Y + (S5.WATER_NEAR_Y - S5.WATER_FAR_Y) * z;
const depthScale = z => 0.5 + 0.5 * z;
const bob = (t, s) => Math.sin((2 * Math.PI * t) / S5.BOB_PERIOD) * 3 * s;
const kalamPhase = t => ((t / S5.KALAM_LOOP) % 1 + 1) % 1;

// oar geometry for a Mitu pose, in sprite-local coordinates (anchor = 0,0)
// pose: { side: "near" | "far", p: 0..1 }  p = 0 catch, 1 finish, 0.5 rest
function oarGeometry(pose) {
    const a = 0.62 - 1.1 * pose.p;                   // angle from vertical, + = toward bow
    const dir = [Math.sin(a), Math.cos(a)];
    const hand = [-122 + 14 * (0.5 - pose.p), -94];
    const top = [hand[0] - dir[0] * 46, hand[1] - dir[1] * 46];
    const tip = [hand[0] + dir[0] * 178, hand[1] + dir[1] * 178];
    const k = (0 - top[1]) / (tip[1] - top[1]);
    const entry = [top[0] + (tip[0] - top[0]) * k, 0];
    const lower = [hand[0] + dir[0] * 42, hand[1] + dir[1] * 42];
    return { a, hand, lower, top, tip, entry };
}

// sprite-local point -> screen point for a sprite drawn at (x, y, scale, sx)
function localToScreen(pt, x, y, scale, sx) {
    return [x + pt[0] * scale * sx, y + pt[1] * scale];
}

// ---------- the frame ----------
// state = {
//     t, darkness, flash, fade,
//     sprites: [{ img, refl, x, z, sx, roll, sprite: "mitu" | "kalam" }],
//     rings: [{ x, y, born, scale, a0 }],
//     lantern: [x, y, scale] | null,
//     marker: { x, y, scale, strength } | null      (game-only UI glow)
// }
function composeFrame(ctx, plate, st) {
    ctx.save();
    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = 1;
    ctx.drawImage(plate, 0, 0);

    const sorted = [...st.sprites].sort((a, b) => a.z - b.z);
    ctx.globalCompositeOperation = "multiply";

    // reflections first, then rings on the water, then the boats
    sorted.forEach(s => drawSprite(ctx, s, s.refl));
    drawRings(ctx, st.rings, st.t);
    sorted.forEach(s => drawSprite(ctx, s, s.img));

    drawDarkness(ctx, st.darkness);
    ctx.restore();

    if (st.marker) drawMarker(ctx, st.marker, st.t);
    if (st.lantern) drawLanternGlow(ctx, st.lantern, st.darkness);
    if (st.flash > 0) {
        ctx.save();
        ctx.globalCompositeOperation = "screen";
        ctx.fillStyle = `rgba(244,242,255,${st.flash})`;
        ctx.fillRect(0, 0, S5.W, S5.H);
        ctx.restore();
    }
    if (st.fade > 0) {
        ctx.fillStyle = `rgba(8,7,10,${st.fade})`;
        ctx.fillRect(0, 0, S5.W, S5.H);
    }
}

function drawSprite(ctx, s, img) {
    const def = S5.SPRITE[s.sprite];
    const scale = depthScale(s.z);
    ctx.save();
    ctx.translate(s.x, depthY(s.z) + bob(s.t ?? 0, scale));
    ctx.rotate(s.roll || 0);
    ctx.scale(scale * s.sx, scale);
    ctx.drawImage(img, -def.ax, -def.ay);
    ctx.restore();
}

// open ink rings, ~1.86π, radius grows as age^0.6, fade over 2.4 s
function drawRings(ctx, rings, t) {
    rings.forEach(r => {
        const age = t - r.born;
        if (age < 0 || age > 2.4) return;
        const life = 1 - age / 2.4;
        for (let k = 0; k < 3; k++) {
            const ageK = age - k * 0.18;
            if (ageK <= 0) continue;
            const rad = (14 + 70 * Math.pow(ageK, 0.6)) * r.scale;
            ctx.strokeStyle = inkRGBA(0.42 * life * (1 - k * 0.28));
            ctx.lineWidth = Math.max(0.8, (2.4 - k * 0.5) * r.scale * life);
            ctx.beginPath();
            ctx.ellipse(r.x, r.y, rad * 1.4, rad * 0.24, 0, r.a0 + k, r.a0 + k + Math.PI * 1.86);
            ctx.stroke();
        }
    });
}

// extra night wash on top of the plate; 0 = plate as painted, 1 = darkest
function drawDarkness(ctx, d) {
    if (d <= 0) return;
    const gr = ctx.createLinearGradient(0, 0, 0, S5.H);
    gr.addColorStop(0, `rgba(58,52,82,${0.62 * d})`);
    gr.addColorStop(0.55, `rgba(92,82,108,${0.42 * d})`);
    gr.addColorStop(1, `rgba(70,64,86,${0.5 * d})`);
    ctx.fillStyle = gr;
    ctx.fillRect(0, 0, S5.W, S5.H);
}

// lantern: a warm wash, stronger as it gets darker (colour lives only in light)
function drawLanternGlow(ctx, [x, y, s], d) {
    const r = 80 * s;
    ctx.save();
    ctx.globalCompositeOperation = "multiply";
    let gr = ctx.createRadialGradient(x, y, 0, x, y, r);
    gr.addColorStop(0, "rgba(240,150,55,0.55)");
    gr.addColorStop(0.5, "rgba(238,165,80,0.28)");
    gr.addColorStop(1, "rgba(240,180,110,0)");
    ctx.fillStyle = gr;
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    ctx.globalCompositeOperation = "screen";
    gr = ctx.createRadialGradient(x, y, 0, x, y, r * 1.3);
    gr.addColorStop(0, `rgba(255,190,110,${0.35 + 0.35 * d})`);
    gr.addColorStop(0.35, `rgba(240,150,70,${0.12 + 0.18 * d})`);
    gr.addColorStop(1, "rgba(240,150,70,0)");
    ctx.fillStyle = gr;
    ctx.beginPath(); ctx.arc(x, y, r * 1.3, 0, Math.PI * 2); ctx.fill();
    // its broken reflection on the water
    const wy = y + 30 * s;
    for (let i = 0; i < 8; i++) {
        ctx.fillStyle = `rgba(250,170,90,${(0.2 + 0.2 * d) * (1 - i / 9)})`;
        const w = (26 - i * 2) * s;
        ctx.fillRect(x - w / 2 + Math.sin(i * 2.3) * 6 * s, wy + i * 7 * s, w, 2.2 * s);
    }
    ctx.restore();
}

// game-only: faint pulsing light on the water where the player should go
function drawMarker(ctx, m, t) {
    const pulse = 0.6 + 0.4 * Math.sin(t * 3);
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    const r = 70 * m.scale;
    const gr = ctx.createRadialGradient(m.x, m.y, 0, m.x, m.y, r);
    gr.addColorStop(0, `rgba(255,230,180,${0.22 * pulse * m.strength})`);
    gr.addColorStop(1, "rgba(255,230,180,0)");
    ctx.fillStyle = gr;
    ctx.beginPath(); ctx.ellipse(m.x, m.y, r * 1.6, r * 0.45, 0, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
}
