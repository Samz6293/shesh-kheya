// Light is the only colour in the game, and it is always drawn live, on top of
// clip frames and live frames alike: the lantern's size depends on the player's
// lampOil, so it can never be painted into a video (handoff rule 7).
import { STAGE, localToScreen } from "./depth";
import { inkRGBA } from "./ink";
import { MITU_BOAT } from "./mituBoat";
import type { BoatAnchor, Glint, Marker } from "../types";

// light colours, as "r,g,b" so each use can add its own opacity
const LIGHT = {
    LANTERN_WASH: "240,150,55",
    LANTERN_WASH_MID: "238,165,80",
    LANTERN_WASH_EDGE: "240,180,110",
    LANTERN_GLOW: "255,190,110",
    LANTERN_GLOW_MID: "240,150,70",
    LANTERN_WATER: "250,170,90",
    MARKER: "255,230,180",
    LIGHTNING: "244,242,255",
    KUPI: "255,157,77",           // #FF9D4D
    BANGLE: "255,211,110",        // #FFD36E
    KICK: "255,214,160",          // the soft ring when the baby moves
    HOTSPOT: "255,230,180",       // where the player can touch or pick something up
    TIMING: "250,178,92",         // the "now" zone of the net's timing bar (lantern orange)
    SPEAKER: "250,178,92",        // over the head of whoever is talking (lantern orange, painted)
    BLACK: "8,7,10",
};

const LANTERN = {
    RADIUS: 80,
    SIZE_EMPTY: 0.7,              // glow size with no oil ...
    SIZE_FULL: 1.25,              // ... and with a full lamp
    GLOW_SPREAD: 1.3,
    STREAKS: 8,                   // broken reflection lines on the water
};

const MARKER = {
    RADIUS: 90,
    STRENGTH: 0.55,
    PULSE_SPEED: 3,
    RING_PERIOD: 2,               // a slow ink ring keeps spreading from the spot
    RING_INK: 0.5,
};

// glints are steady: S2's clips start whenever the player is ready (no sync
// point), so anything that flickered would jump at a join. [period s, amount]
// waves can be added for a scene that waits for sync points
const GLINT: Record<Glint["light"], { strength: number, waves: [number, number][] }> = {
    kupi: { strength: 0.8, waves: [] },
    bangle: { strength: 0.9, waves: [] },
};

const TIMING_BAR = {
    ZONE_HEIGHT: 18,              // px
    LINE: 3,
    MARK: 9,                      // radius of the sliding mark
    ZONE: 0.35,                   // the zone's strength, and how much a hit adds
    HIT: 0.5,
    INK: 0.7,
    MARK_INK: 0.95,
};

const GLOW = {
    PULSE_SPEED: 3,               // radians per second
};

function lampSize(oil: number): number {
    return LANTERN.SIZE_EMPTY + (LANTERN.SIZE_FULL - LANTERN.SIZE_EMPTY) * (oil / 100);
}

// strength 0..1 fades the lights with the picture (used while a clip fades to black)
export function drawLights(ctx: CanvasRenderingContext2D, boat: BoatAnchor | null, oil: number, darkness: number, strength: number): void {
    if (!boat || strength <= 0) return;
    const [x, y] = localToScreen(MITU_BOAT.LANTERN, boat.x, boat.y, boat.scale, boat.sx, boat.roll);
    const s = boat.scale;
    const r = LANTERN.RADIUS * s * lampSize(oil);

    ctx.save();
    ctx.globalAlpha = strength;

    // New here: globalCompositeOperation. "multiply" darkens like a wash of
    // paint over paper; "screen" brightens like light. Docs: MDN, globalCompositeOperation
    ctx.globalCompositeOperation = "multiply";
    let gr = ctx.createRadialGradient(x, y, 0, x, y, r);
    gr.addColorStop(0, `rgba(${LIGHT.LANTERN_WASH},0.55)`);
    gr.addColorStop(0.5, `rgba(${LIGHT.LANTERN_WASH_MID},0.28)`);
    gr.addColorStop(1, `rgba(${LIGHT.LANTERN_WASH_EDGE},0)`);
    ctx.fillStyle = gr;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();

    // the glow gets stronger as the night gets darker
    ctx.globalCompositeOperation = "screen";
    const glowR = r * LANTERN.GLOW_SPREAD;
    gr = ctx.createRadialGradient(x, y, 0, x, y, glowR);
    gr.addColorStop(0, `rgba(${LIGHT.LANTERN_GLOW},${0.35 + 0.35 * darkness})`);
    gr.addColorStop(0.35, `rgba(${LIGHT.LANTERN_GLOW_MID},${0.12 + 0.18 * darkness})`);
    gr.addColorStop(1, `rgba(${LIGHT.LANTERN_GLOW_MID},0)`);
    ctx.fillStyle = gr;
    ctx.beginPath();
    ctx.arc(x, y, glowR, 0, Math.PI * 2);
    ctx.fill();

    // its broken reflection on the water
    const waterY = y + 30 * s;
    for (let i = 0; i < LANTERN.STREAKS; i++) {
        const w = (26 - i * 2) * s;
        ctx.fillStyle = `rgba(${LIGHT.LANTERN_WATER},${(0.2 + 0.2 * darkness) * (1 - i / 9)})`;
        ctx.fillRect(x - w / 2 + Math.sin(i * 2.3) * 6 * s, waterY + i * 7 * s, w, 2.2 * s);
    }
    ctx.restore();
}

// game only: a pulsing light and a spreading ink ring on the water where the player should row to
export function drawMarker(ctx: CanvasRenderingContext2D, m: Marker, t: number): void {
    const pulse = 0.6 + 0.4 * Math.sin(t * MARKER.PULSE_SPEED);
    const r = MARKER.RADIUS * m.scale;
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    const gr = ctx.createRadialGradient(m.x, m.y, 0, m.x, m.y, r);
    gr.addColorStop(0, `rgba(${LIGHT.MARKER},${MARKER.STRENGTH * pulse})`);
    gr.addColorStop(1, `rgba(${LIGHT.MARKER},0)`);
    ctx.fillStyle = gr;
    // squash the circle into a flat ellipse lying on the water
    ctx.translate(m.x, m.y);
    ctx.scale(1.6, 0.45);
    ctx.translate(-m.x, -m.y);
    ctx.beginPath();
    ctx.arc(m.x, m.y, r, 0, Math.PI * 2);
    ctx.fill();

    // the ring: pale paper shows light poorly, ink shows well
    const age = (t / MARKER.RING_PERIOD) % 1;
    ctx.globalCompositeOperation = "multiply";
    ctx.strokeStyle = inkRGBA(MARKER.RING_INK * (1 - age));
    ctx.lineWidth = 3 * m.scale;
    ctx.beginPath();
    ctx.arc(m.x, m.y, r * (0.25 + 0.75 * age), 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
}

// lightning and the fade to black sit on top of everything else
export function drawFlashAndFade(ctx: CanvasRenderingContext2D, flash: number, fade: number): void {
    if (flash > 0) {
        ctx.save();
        ctx.globalCompositeOperation = "screen";
        ctx.fillStyle = `rgba(${LIGHT.LIGHTNING},${flash})`;
        ctx.fillRect(0, 0, STAGE.W, STAGE.H);
        ctx.restore();
    }
    if (fade > 0) {
        ctx.fillStyle = `rgba(${LIGHT.BLACK},${fade})`;
        ctx.fillRect(0, 0, STAGE.W, STAGE.H);
    }
}

// the kupi in a window, the bangle on Dadi's wrist: a warm point of light.
// isBehind picks which glints to draw: those behind the figures, or those on them
export function drawGlints(ctx: CanvasRenderingContext2D, glints: Glint[], t: number, isBehind: boolean): void {
    if (glints.length === 0) return;
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    for (const g of glints) {
        if (g.isBehind !== isBehind) continue;
        const recipe = GLINT[g.light];
        let a = recipe.strength;
        for (const [period, amount] of recipe.waves) a += amount * Math.sin((2 * Math.PI * t) / period + g.phase);
        const gr = ctx.createRadialGradient(g.x, g.y, 0, g.x, g.y, g.r);
        gr.addColorStop(0, `rgba(${LIGHT[g.light === "kupi" ? "KUPI" : "BANGLE"]},${Math.max(0, a)})`);
        gr.addColorStop(1, `rgba(${LIGHT[g.light === "kupi" ? "KUPI" : "BANGLE"]},0)`);
        ctx.fillStyle = gr;
        ctx.beginPath();
        ctx.arc(g.x, g.y, g.r, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.restore();
}

// game only: a soft pulsing light on something the player can touch or pick up.
// strength 0..1; it grows while the player holds (baby kick)
export function drawGlow(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, strength: number, t: number): void {
    if (strength <= 0) return;
    const pulse = 0.75 + 0.25 * Math.sin(t * GLOW.PULSE_SPEED);
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    const gr = ctx.createRadialGradient(x, y, 0, x, y, r);
    gr.addColorStop(0, `rgba(${LIGHT.HOTSPOT},${0.5 * strength * pulse})`);
    gr.addColorStop(1, `rgba(${LIGHT.HOTSPOT},0)`);
    ctx.fillStyle = gr;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
}

// game only: the net's timing bar. A thin ink line, a warm zone in the middle
// ("now"), and a round ink mark sliding along it. mark -1..1 along the bar;
// zone: half the zone's width as a share of the bar; glow 0..1 lights the zone (a hit)
export function drawTimingBar(ctx: CanvasRenderingContext2D, x: number, y: number, half: number, zone: number, mark: number, glow: number): void {
    ctx.save();
    const B = TIMING_BAR;
    ctx.fillStyle = `rgba(${LIGHT.TIMING},${B.ZONE + B.HIT * glow})`;
    ctx.fillRect(x - half * zone, y - B.ZONE_HEIGHT / 2, 2 * half * zone, B.ZONE_HEIGHT);
    ctx.globalCompositeOperation = "multiply";
    ctx.strokeStyle = inkRGBA(B.INK);
    ctx.lineWidth = B.LINE;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(x - half, y);
    ctx.lineTo(x + half, y);
    ctx.stroke();
    ctx.fillStyle = inkRGBA(B.MARK_INK);
    ctx.beginPath();
    ctx.arc(x + mark * half, y, B.MARK, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
}

// game only: one ring of warm light spreading out (the baby kick). u 0..1 = its life
export function drawLightRing(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, u: number): void {
    if (u <= 0 || u >= 1) return;
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    ctx.strokeStyle = `rgba(${LIGHT.KICK},${0.7 * (1 - u)})`;
    ctx.lineWidth = 6 * (1 - u) + 1;
    ctx.beginPath();
    ctx.arc(x, y, radius * Math.pow(u, 0.6), 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
}

// game only: a soft warm light over the head of whoever is talking. alpha 0..1.
// Painted over the picture (not "screen"): on pale paper a screen glow barely shows
export function drawSpeakerLight(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, alpha: number): void {
    if (alpha <= 0.01) return;
    ctx.save();
    const gr = ctx.createRadialGradient(x, y, 0, x, y, radius);
    gr.addColorStop(0, `rgba(${LIGHT.SPEAKER},${0.95 * alpha})`);
    gr.addColorStop(0.3, `rgba(${LIGHT.SPEAKER},${0.6 * alpha})`);
    gr.addColorStop(1, `rgba(${LIGHT.SPEAKER},0)`);
    ctx.fillStyle = gr;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
}
