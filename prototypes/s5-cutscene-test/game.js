// Scene 5 test: cutscene -> choice -> live rowing -> hold-to-push -> branch cutscene.
// The game draws with composeFrame() from shared.js, the same function that drew
// the video frames, and it only starts a video on a "sync point" (a multiple of
// S5.SYNC seconds) so every looping motion is in the same place on both sides.

const CFG = {
    // rowing rhythm: seconds between strokes
    RHYTHM_MIN: 0.3,
    RHYTHM_MAX: 1.0,
    // forward push per stroke (px/s) by stroke quality
    IMPULSE: { good: 85, start: 60, turn: 38, off: 22 },
    // turn per stroke (rad/s) by stroke quality; alternating strokes nearly cancel
    TURN: { good: 0.17, start: 0.45, turn: 0.85, off: 0.85 },
    MAX_SPEED: 240,
    DRAG: 0.75,
    TURN_DAMP: 2.6,
    ROLL_KICK: 0.07,
    ROLL_MAX: 0.16,
    ROLL_DAMP: 1.4,
    DEPTH_PX: 420,                         // px of travel to cross the whole water depth
    BOUNDS: { x0: 140, x1: 1780, z0: 0.12, z1: 1 },
    CONTACT: { dx: 110, dz: 0.12 },
    EASE_TIME: 0.9,
    PUSH_TIME: 8,
    PUSH_STROKE_GAP: 0.45,
    STROKE_FRAME: 0.09,                    // seconds per sprite frame of a stroke
    STROKE_HOLD: 0.14,
    SYNC_LEAD: 0.6,                        // minimum time before a sync point can be used
    CLIP: { intro: 8, helped: 14, declined: 11 },
};

// what happens at which second of each video (sound + text live outside the video)
const CUES = {
    intro: [
        ...[0, 1, 2, 3, 4, 5, 6, 7, 8].map(k => ({ t: 0.3 + 0.65 * k, sfx: "oar" })),
        { t: 3.75, sfx: "thunder" },
        { t: 5.6, line: ["s5.intro", 0], hold: true },
    ],
    helped: [
        { t: 0.1, sfx: "free" },
        { t: 3.0, line: ["s5.helped", 0], dur: 3.0 },
        { t: 6.2, line: ["s5.helped", 1], dur: 1.9 },
        { t: 8.3, line: ["s5.helped", 2], dur: 1.4 },
        { t: 9.9, line: ["s5.helped", 3], dur: 2.5 },
    ],
    declined: [...Array(11).keys()].map(k => ({ t: 2.5 + 0.65 * k, sfx: "oar" })),
};

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const IMG = {};

const G = {
    mode: "loading",
    t: 0,                    // master clock in seconds; videos map onto it
    darkness: 0,
    mitu: { x: S5.MITU_START.x, z: S5.MITU_START.z, heading: 0, speed: 0, turnVel: 0, rollAmp: 0, lastKey: null, lastTime: -9, anim: null },
    rings: [],
    push: 0,
    nextPushStroke: 0,
    spaceDown: false,
    ease: null,
    clip: null,
    introLine: null,
    syncTarget: null,
    waiters: [],
    helped: null,
    debug: false,
    lastGap: 0,
    lastQuality: "-",
};

// ---------- loading ----------
function loadImage(name, src) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => { IMG[name] = img; resolve(); };
        img.onerror = () => reject(new Error(`Missing asset: ${src}`));
        img.src = src;
    });
}

async function loadAll() {
    const names = ["plate"];
    ["rest", "near_0", "near_1", "near_2", "near_3", "far_0", "far_1", "far_2", "far_3"].forEach(k => names.push(`mitu_${k}`, `mitu_${k}_refl`));
    for (let i = 0; i < S5.KALAM_FRAMES; i++) names.push(`kalam_${i}`, `kalam_${i}_refl`);
    await Promise.all(names.map(n => loadImage(n, `assets/${n}.png`)));
    await document.fonts.load('40px "Tiro Bangla"', "শেষ খেয়া");
}

// ---------- helpers ----------
const lerp = (a, b, u) => a + (b - a) * u;
const smooth = u => u * u * (3 - 2 * u);
const waitFor = cond => new Promise(resolve => G.waiters.push({ cond, resolve }));

function lerpAngle(a, b, u) {
    let d = ((b - a + Math.PI) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI) - Math.PI;
    return a + d * u;
}

// resolve at the next multiple of S5.SYNC, at least SYNC_LEAD seconds away
function waitSync() {
    G.syncTarget = Math.ceil((G.t + CFG.SYNC_LEAD) / S5.SYNC) * S5.SYNC;
    return waitFor(() => G.syncTarget === null);
}

function facing() {
    return Math.cos(G.mitu.heading) >= 0 ? 1 : -1;
}

function addRing(side) {
    const m = G.mitu, s = depthScale(m.z);
    const e = oarGeometry({ side, p: 0.05 }).entry;
    G.rings.push({ x: m.x + e[0] * s * facing(), y: depthY(m.z) + 2, born: G.t, scale: s, a0: Math.random() * 6.28 });
}

// ---------- rowing ----------
function stroke(key) {
    const m = G.mitu;
    const gap = G.t - m.lastTime;
    let q;
    if (!m.lastKey || gap > CFG.RHYTHM_MAX) q = "start";
    else if (gap < CFG.RHYTHM_MIN) q = "off";
    else q = m.lastKey === key ? "turn" : "good";

    // A is the boat's left (port), D its right
    const turnSign = key === "KeyA" ? -1 : 1;
    m.speed = Math.min(CFG.MAX_SPEED, m.speed + CFG.IMPULSE[q]);
    m.turnVel += turnSign * CFG.TURN[q];

    if (q === "off") {
        m.rollAmp = Math.min(CFG.ROLL_MAX, m.rollAmp + CFG.ROLL_KICK);
        Sound.play("oarBad");
    }
    else {
        Sound.play("oar");
    }

    // port side is the far side when facing right, the near side when facing left
    const side = (key === "KeyA") === (facing() === 1) ? "far" : "near";
    m.anim = { side, start: G.t };
    addRing(side);

    m.lastKey = key;
    m.lastTime = G.t;
    G.lastGap = gap;
    G.lastQuality = q;
}

function updateRowing(dt) {
    const m = G.mitu, B = CFG.BOUNDS;
    m.speed *= Math.exp(-CFG.DRAG * dt);
    m.turnVel *= Math.exp(-CFG.TURN_DAMP * dt);
    m.heading += m.turnVel * dt;
    m.x += Math.cos(m.heading) * m.speed * dt;
    m.z += (Math.sin(m.heading) * m.speed * dt) / CFG.DEPTH_PX;

    // soft edges: clamp and lose some speed, never stuck
    if (m.x < B.x0 || m.x > B.x1 || m.z < B.z0 || m.z > B.z1) m.speed *= 0.9;
    m.x = Math.max(B.x0, Math.min(B.x1, m.x));
    m.z = Math.max(B.z0, Math.min(B.z1, m.z));

    // don't row through Kalam's boat: slide off it in depth
    const ks = depthScale(S5.KALAM.z), ms = depthScale(m.z);
    if (Math.abs(m.z - S5.KALAM.z) < 0.09 && Math.abs(m.x - S5.KALAM.x) < (240 * ks + 210 * ms) * 0.8 && m.x > S5.CONTACT.x + CFG.CONTACT.dx) {
        m.z += Math.sign(m.z - S5.KALAM.z || 1) * 0.5 * dt;
        m.speed *= 0.92;
    }

    // close enough behind Kalam's stern: take over and line the boats up
    if (Math.abs(m.x - S5.CONTACT.x) < CFG.CONTACT.dx && Math.abs(m.z - S5.CONTACT.z) < CFG.CONTACT.dz) {
        G.mode = "easing";
        G.ease = { x: m.x, z: m.z, heading: m.heading, start: G.t };
        UI.hideHint();
    }
}

function updateEasing() {
    const m = G.mitu, e = G.ease;
    const u = smooth(Math.min(1, (G.t - e.start) / CFG.EASE_TIME));
    m.x = lerp(e.x, S5.CONTACT.x, u);
    m.z = lerp(e.z, S5.CONTACT.z, u);
    m.heading = lerpAngle(e.heading, 0, u);
    m.speed = 0;
    m.turnVel = 0;
    if (u >= 1) {
        m.heading = 0;
        G.mode = "pushReady";
        Sound.play("bump");
    }
}

function updatePush(dt) {
    const m = G.mitu;
    if (G.spaceDown && G.push < 1) {
        G.mode = "push";
        G.push = Math.min(1, G.push + dt / CFG.PUSH_TIME);
        G.darkness = G.push;                       // helping costs time: the sky darkens
        if (G.t >= G.nextPushStroke) {
            const side = m.anim?.side === "near" ? "far" : "near";
            m.anim = { side, start: G.t };
            addRing(side);
            Sound.play("oar");
            G.nextPushStroke = G.t + CFG.PUSH_STROKE_GAP;
        }
        Sound.setStrain(true);
    }
    else {
        Sound.setStrain(false);
    }
    m.x = S5.CONTACT.x + G.push * S5.PUSH_DISTANCE;
    UI.hintProgress(G.push);
}

// which of the 9 Mitu sprites to show
function mituFrame() {
    const a = G.mitu.anim;
    if (!a) return "rest";
    const el = G.t - a.start;
    const i = Math.floor(el / CFG.STROKE_FRAME);
    if (i < 4) return `${a.side}_${i}`;
    if (el < 4 * CFG.STROKE_FRAME + CFG.STROKE_HOLD) return `${a.side}_3`;
    G.mitu.anim = null;
    return "rest";
}

// ---------- loop ----------
function update(dt) {
    G.t += dt;
    const m = G.mitu;
    if (G.mode === "rowing") updateRowing(dt);
    if (G.mode === "easing") updateEasing();
    if (G.mode === "pushReady" || G.mode === "push") updatePush(dt);
    m.rollAmp *= Math.exp(-CFG.ROLL_DAMP * dt);
    G.rings = G.rings.filter(r => G.t - r.born < 2.5);

    if (G.syncTarget !== null && G.t >= G.syncTarget) {
        G.t = G.syncTarget;                        // land exactly on the sync point
        G.syncTarget = null;
    }
    G.waiters = G.waiters.filter(w => {
        if (!w.cond()) return true;
        w.resolve();
        return false;
    });
}

function render() {
    const m = G.mitu, ms = depthScale(m.z), sx = facing();
    const key = mituFrame();
    const ki = Math.floor(kalamPhase(G.t) * S5.KALAM_FRAMES) % S5.KALAM_FRAMES;
    const kx = S5.KALAM.x + G.push * S5.PUSH_DISTANCE;
    const lp = localToScreen(S5.LANTERN, m.x, depthY(m.z) + bob(G.t, ms), ms, sx);
    const ks = depthScale(S5.KALAM.z);
    composeFrame(ctx, IMG.plate, {
        t: G.t,
        darkness: G.darkness,
        flash: 0,
        fade: 0,
        sprites: [
            { sprite: "mitu", img: IMG[`mitu_${key}`], refl: IMG[`mitu_${key}_refl`], x: m.x, z: m.z, sx, roll: m.rollAmp * Math.sin(2 * Math.PI * 1.3 * G.t), t: G.t },
            { sprite: "kalam", img: IMG[`kalam_${ki}`], refl: IMG[`kalam_${ki}_refl`], x: kx, z: S5.KALAM.z, sx: 1, roll: 0, t: G.t },
        ],
        rings: G.rings,
        lantern: [lp[0], lp[1], ms],
        marker: G.mode === "rowing" ? { x: kx - 240 * ks, y: depthY(S5.KALAM.z), scale: ks, strength: 1 } : null,
    });
}

function hud() {
    if (!G.debug) return;
    const m = G.mitu;
    UI.hud([
        `mode      ${G.mode}${G.clip ? ` (${G.clip.name} ${G.clip.v.currentTime.toFixed(2)}s)` : ""}`,
        `clock     ${G.t.toFixed(2)}s   next sync ${G.syncTarget ?? "-"}`,
        `boat      x ${m.x.toFixed(0)}  z ${m.z.toFixed(2)}  heading ${(m.heading * 180 / Math.PI).toFixed(0)}°  speed ${m.speed.toFixed(0)}`,
        `stroke    gap ${G.lastGap.toFixed(2)}s  ${G.lastQuality}   (rhythm ${CFG.RHYTHM_MIN}-${CFG.RHYTHM_MAX}s)`,
        `push      ${(G.push * 100).toFixed(0)}%   darkness ${G.darkness.toFixed(2)}`,
        `kalam     phase ${kalamPhase(G.t).toFixed(2)}`,
        `flags     helpedKalam1 = ${G.helped}`,
    ]);
}

let last = performance.now();
function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (G.mode === "video") {
        runCues();
    }
    else if (G.mode !== "loading" && G.mode !== "start" && G.mode !== "end") {
        update(dt);
        render();
    }
    hud();
    requestAnimationFrame(frame);
}

// ---------- cutscenes ----------
// keepOnEnd: the clip's last frame stays on screen (used for clips that end the scene)
function playClip(name, keepOnEnd = false) {
    const v = document.getElementById(`v-${name}`);
    G.mode = "video";
    G.clip = { name, v, fired: new Set(), startClock: G.t };
    v.currentTime = 0;
    return new Promise(resolve => {
        v.addEventListener("playing", () => v.classList.add("on"), { once: true });
        v.addEventListener("ended", () => {
            G.t = G.clip.startClock + CFG.CLIP[name];
            G.clip = null;
            resolve();
            // let the canvas draw the matching frame first, then fade the video away
            if (!keepOnEnd) requestAnimationFrame(() => requestAnimationFrame(() => v.classList.remove("on")));
        }, { once: true });
        v.play();
    });
}

function runCues() {
    const c = G.clip;
    if (!c) return;
    const now = c.v.currentTime;
    CUES[c.name].forEach((cue, i) => {
        if (c.fired.has(i) || cue.t > now) return;
        c.fired.add(i);
        if (c.skipped && !cue.hold) return;
        if (cue.sfx) Sound.play(cue.sfx);
        if (cue.line && cue.hold) G.introLine = UI.say(cue.line[0], cue.line[1], { hold: true });
        if (cue.line && !cue.hold) UI.say(cue.line[0], cue.line[1], { hold: false, dur: cue.dur });
    });
}

function skipClip() {
    const c = G.clip;
    if (!c || c.skipped) return;
    c.skipped = true;
    UI.hideLine();
    c.v.currentTime = Math.max(0, c.v.duration - 0.03);
}

// ---------- the scene ----------
async function run() {
    await playClip("intro");
    G.mode = "talk";
    if (!G.introLine) G.introLine = UI.say("s5.intro", 0, { hold: true });
    await G.introLine;

    const pick = await UI.choose([
        { id: "help", text: TEXT.screens.choiceHelp },
        { id: "home", text: TEXT.screens.choiceGoHome },
    ]);

    if (pick === "help") {
        G.helped = true;
        G.mode = "rowing";
        UI.hint(TEXT.screens.rowingHint);
        await waitFor(() => G.mode === "pushReady");
        UI.hint(TEXT.screens.pushHint, true);
        await waitFor(() => G.push >= 1);
        Sound.setStrain(false);
        UI.hideHint();
        G.mode = "syncWait";
        await waitSync();
        await playClip("helped", true);
    }
    else {
        G.helped = false;
        await UI.say("s5.declined", 0, { hold: true });
        G.mode = "syncWait";
        await waitSync();
        await playClip("declined", true);
    }

    G.mode = "end";
    Sound.fadeOut(2);
    const end = $("#end");
    end.querySelector(".screen-title").textContent = PROTO.end.sy;
    end.querySelector(".screen-sub").textContent = `helpedKalam1 = ${G.helped}`;
    end.classList.remove("hidden");
}

// ---------- input ----------
document.addEventListener("keydown", e => {
    if (e.code === "Space") {
        e.preventDefault();
        G.spaceDown = true;
        return;
    }
    if (e.repeat) return;
    if (e.code === "Backquote") {
        G.debug = !G.debug;
        $("#hud").classList.toggle("hidden", !G.debug);
    }
    if (e.code === "Escape") skipClip();
    if (e.code === "Enter") UI.advance();
    if ((e.code === "KeyA" || e.code === "KeyD") && G.mode === "rowing") stroke(e.code);
});
document.addEventListener("keyup", e => {
    if (e.code === "Space") G.spaceDown = false;
});
$("#stage").addEventListener("click", e => {
    if (e.target.closest("button")) return;
    UI.advance();
});

// ---------- start ----------
(async () => {
    const start = $("#start");
    start.querySelector(".screen-title").textContent = TEXT.screens.gameTitle.sy;
    start.querySelector(".screen-sub").textContent = PROTO.startSub.sy;
    start.querySelector(".screen-controls").textContent = PROTO.controls.sy;
    const begin = $("#begin");
    begin.textContent = "…";
    begin.disabled = true;
    $("#replay").textContent = PROTO.replay.sy;
    $("#replay").addEventListener("click", () => location.reload());

    await loadAll();
    G.mode = "start";
    begin.textContent = PROTO.begin.sy;
    begin.disabled = false;
    begin.addEventListener("click", () => {
        Sound.start();
        start.classList.add("hidden");
        run();
    }, { once: true });
    requestAnimationFrame(frame);
})();
