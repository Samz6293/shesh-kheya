// Light is the only colour in the game, and it is always drawn live, on top of
// clip frames and live frames alike: the lantern's size depends on the player's
// lampOil, so it can never be painted into a video (handoff rule 7).
import { STAGE, localToScreen } from "./depth";
import { inkRGBA } from "./ink";
import { MITU_BOAT } from "./mituBoat";
import type { BoatAnchor, Marker } from "../types";

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
