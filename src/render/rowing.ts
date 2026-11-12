// Mitu rowing inside a clip: her stroke poses, the boat's surge and bow lift,
// the oar rings and the wake, for any stretch of strokes. The same maths as
// S5's clips.ts, written for any scene (S5 keeps its own copy until it is
// next re-rendered). A clip calls these with its own times; they never read
// the clock. RENDER only.
import { depthScale, depthY } from "../shared/depth";
import { MITU_BOAT, WAKE, oarGeometry, strokePitch, wakeRing } from "../shared/mituBoat";
import type { MituPose, Ring, Side } from "../types";

export const ROW = { STROKE: 0.4, RECOVER: 0.25, GAP: 0.65 };    // seconds; GAP = Boat.ts STROKE_GAP
// the boat surges on each pull and slows between: speed swings ±SURGE around
// the path's own speed, fastest at the end of the pull (as in live play)
const SURGE = { AMOUNT: 0.3, PEAK: ROW.STROKE };

// a run of strokes: the first starts at t0, n of them
export interface Strokes {
    t0: number
    n: number
}

// from rest, speeding up over `ramp` seconds, then steady: 0..1 over `total` seconds
export function rowAway(time: number, ramp: number, total: number): number {
    const tt = Math.max(0, Math.min(total, time));
    const steady = tt < ramp ? (tt * tt) / (2 * ramp) : tt - ramp / 2;
    return steady / (total - ramp / 2);
}

// surge by bending time: feeding a path surged(t) instead of t makes it run
// faster and slower in step with the strokes. Over each whole stroke the extra
// time adds up to zero, so the path still ends where it did (joins unchanged).
export function surged(t: number, s: Strokes): number {
    const tau = Math.max(0, Math.min(s.n * ROW.GAP, t - s.t0));
    const w = (2 * Math.PI) / ROW.GAP;
    return t + (SURGE.AMOUNT / w) * (Math.sin(w * (tau - SURGE.PEAK)) - Math.sin(-w * SURGE.PEAK));
}

// the bow's lift at time t, from the stroke being pulled (if any)
export function rowPitch(t: number, s: Strokes, heading: number): number {
    const k = Math.floor((t - s.t0) / ROW.GAP);
    if (t < s.t0 || k >= s.n) return 0;
    return strokePitch(t - s.t0 - k * ROW.GAP, ROW.STROKE, heading);
}

// Mitu's pose at time t
export function rowPose(t: number, s: Strokes, first: Side = "near"): MituPose {
    const k = Math.floor((t - s.t0) / ROW.GAP);
    if (t < s.t0 || k >= s.n) return MITU_BOAT.REST;
    const u = t - s.t0 - k * ROW.GAP;
    const other: Side = first === "near" ? "far" : "near";
    const side = k % 2 === 0 ? first : other;
    if (u < ROW.STROKE) return { side, p: u / ROW.STROKE };
    if (u < ROW.STROKE + ROW.RECOVER) return { side, p: 1 - 0.5 * ((u - ROW.STROKE) / ROW.RECOVER) };
    return MITU_BOAT.REST;
}

// a ring where the oar went in, for each stroke that has started by time t
export function rowRings(t: number, s: Strokes, z: number, heading: number, boatX: (t: number) => number): Ring[] {
    const rings: Ring[] = [];
    const scale = depthScale(z);
    for (let k = 0; k < s.n; k++) {
        const born = s.t0 + k * ROW.GAP;
        if (born > t) break;
        const entry = oarGeometry(rowPose(born + 0.02, s)).entry;
        rings.push({ x: boatX(born) + entry[0] * scale * heading, y: depthY(z) + 2, born, scale, a0: (k * 1.7) % 6.28 });
    }
    return rings;
}

// small rings off the stern while the boat moves, one every WAKE.GAP seconds
export function wakeRings(t: number, z: number, heading: number, boatX: (t: number) => number): Ring[] {
    const rings: Ring[] = [];
    const scale = depthScale(z), dt = 0.02;
    for (let k = 0; k * WAKE.GAP <= t; k++) {
        const born = k * WAKE.GAP;
        const speed = Math.abs(boatX(born + dt) - boatX(born - dt)) / (2 * dt);
        if (speed > WAKE.MIN_SPEED) rings.push(wakeRing(boatX(born), depthY(z) + 2, scale, heading, born, (k * 1.3) % 6.28));
    }
    return rings;
}
