// Scene 5 cutscenes, each as a pure function of time: state(t) says where
// everything is at second t, and nothing else. The renderer asks for every
// 1/24 s and encodes the frames. Clips start and end in rest poses, on a
// multiple of SYNC seconds, so they join live play invisibly. RENDER only.
// No clip fades (M7): the game's curtain fades the scene in and out, so what
// lies in Mitu's boat (drawn live on top, per player) fades with it.
import { STAGE, depthScale, depthY } from "../../../shared/depth";
import { lerp } from "../../../shared/math";
import { MITU_BOAT, WAKE, oarGeometry, strokePitch, wakeRing } from "../../../shared/mituBoat";
import { defaultFlags } from "../../../shared/flags";
import paintMitu from "../../../render/paintMitu";
import { paintKalam } from "./paint";
import { MITU_AFTER_HELP, PUSH_DX, S5, kalamPhase, s5Frame } from "./layout";
import type { ClipDef, FrameState, MituPose, Ring, S5ClipLook, Side, SpriteArt } from "../../../types";

const ROW = { STROKE: 0.4, RECOVER: 0.25, GAP: S5.ROW_GAP };    // seconds
// the boat surges on each pull and slows between: speed swings ±SURGE around
// the path's own speed, fastest at the end of the pull (as in live play)
const SURGE = { AMOUNT: 0.3, PEAK: ROW.STROKE };
const OIL = defaultFlags().lampOil;                             // unused in clips: lights are live
const DIR = S5.HEADING;                                         // -1: homeward, everything moves left
// off-screen and far-away points, mirrored to match the direction of travel
const OFF = {
    INTRO_FROM: STAGE.W + 280,    // Mitu rows in from beyond the right edge
    DECLINED_TO: -380,            // Mitu rows on towards home, out past the left edge
};

// from rest, speeding up over `ramp` seconds, then steady: 0..1 over `total` seconds
function rowAway(time: number, ramp: number, total: number): number {
    const tt = Math.max(0, Math.min(total, time));
    const steady = tt < ramp ? (tt * tt) / (2 * ramp) : tt - ramp / 2;
    return steady / (total - ramp / 2);
}

// New here: surge by bending time. Feeding a path surged(t) instead of t
// makes it run faster and slower in step with the strokes: its speed is
// multiplied by 1 + AMOUNT·cos(...). Over each whole stroke the extra time adds
// up to zero, so the path still ends exactly where it did (joins unchanged).
function surged(t: number, t0: number, n: number): number {
    const tau = Math.max(0, Math.min(n * ROW.GAP, t - t0));
    const w = (2 * Math.PI) / ROW.GAP;
    return t + (SURGE.AMOUNT / w) * (Math.sin(w * (tau - SURGE.PEAK)) - Math.sin(-w * SURGE.PEAK));
}

// the bow's lift at time t, from the stroke being pulled (if any)
function rowPitch(t: number, t0: number, n: number): number {
    const k = Math.floor((t - t0) / ROW.GAP);
    if (t < t0 || k >= n) return 0;
    return strokePitch(t - t0 - k * ROW.GAP, ROW.STROKE, S5.HEADING);
}

// small rings off the stern while the boat moves, one every WAKE.GAP seconds
function wakeRings(t: number, z: number, boatX: (t: number) => number): Ring[] {
    const rings: Ring[] = [];
    const scale = depthScale(z), dt = 0.02;
    for (let k = 0; k * WAKE.GAP <= t; k++) {
        const born = k * WAKE.GAP;
        const speed = Math.abs(boatX(born + dt) - boatX(born - dt)) / (2 * dt);
        if (speed > WAKE.MIN_SPEED) rings.push(wakeRing(boatX(born), depthY(z) + 2, scale, S5.HEADING, born, (k * 1.3) % 6.28));
    }
    return rings;
}

// starts fast, ends slow
function ease(u: number): number {
    return 1 - Math.pow(1 - Math.max(0, Math.min(1, u)), 2.2);
}

// Mitu's pose at time t for n strokes starting at t0
function rowPose(t: number, t0: number, n: number, first: Side): MituPose {
    const k = Math.floor((t - t0) / ROW.GAP);
    if (t < t0 || k >= n) return MITU_BOAT.REST;
    const u = t - t0 - k * ROW.GAP;
    const other: Side = first === "near" ? "far" : "near";
    const side = k % 2 === 0 ? first : other;
    if (u < ROW.STROKE) return { side, p: u / ROW.STROKE };
    if (u < ROW.STROKE + ROW.RECOVER) return { side, p: 1 - 0.5 * ((u - ROW.STROKE) / ROW.RECOVER) };
    return MITU_BOAT.REST;
}

// a ring for each stroke that has started by time t
function rowRings(t: number, t0: number, n: number, sx: number, boatX: (t: number) => number): Ring[] {
    const rings: Ring[] = [];
    const scale = depthScale(S5.MITU_START.z);
    for (let k = 0; k < n; k++) {
        const born = t0 + k * ROW.GAP;
        if (born > t) break;
        const entry = oarGeometry(rowPose(born + 0.02, t0, n, "near")).entry;
        rings.push({ x: boatX(born) + entry[0] * scale * sx, y: depthY(S5.MITU_START.z) + 2, born, scale, a0: (k * 1.7) % 6.28 });
    }
    return rings;
}

export const CLIPS: Record<string, ClipDef<S5ClipLook>> = {
    // Mitu rows in from the right (homeward) and stops at MITU_START; far lightning
    intro: {
        duration: S5.CLIP.intro,
        state(t) {
            const T0 = S5.INTRO_ROW.T0, N = S5.INTRO_ROW.STROKES;
            const boatX = (at: number) => lerp(OFF.INTRO_FROM, S5.MITU_START.x, ease(surged(at, T0, N) / 6));
            // two quick white pulses
            const flash = 0.32 * Math.exp(-Math.pow((t - 3.6) / 0.05, 2)) + 0.22 * Math.exp(-Math.pow((t - 3.82) / 0.08, 2));
            return {
                t, darkness: 0, flash, fade: 0, oil: OIL, marker: null,
                mitu: { x: boatX(t), z: S5.MITU_START.z, sx: DIR, roll: rowPitch(t, T0, N) },
                pose: rowPose(t, T0, N, "near"),
                kalamX: S5.KALAM.x, kalamPhase: kalamPhase(t), kalamNod: 0,
                rings: [...rowRings(t, T0, N, DIR, boatX), ...wakeRings(t, S5.MITU_START.z, boatX)],
            };
        },
    },

    // starts where the push ends (both boats moved PUSH_DISTANCE homeward, full darkness):
    // Kalam's boat slides free towards home and comes to rest. His thanks are
    // said live after it (every line waits for the player), then `farewell`
    helped: {
        duration: S5.CLIP.helped,
        state(t) {
            const kalam0 = S5.KALAM.x + PUSH_DX, mitu0 = S5.CONTACT.x + PUSH_DX;
            const kalamX = (at: number) => lerp(kalam0, S5.KALAM_FREE, ease(at / 3.2));
            const scale = depthScale(S5.KALAM.z);
            // rings where his pole goes in, behind him
            const rings = [0.15, 0.7, 1.4].map((born, i) => ({ x: kalamX(born) - DIR * 190 * scale, y: depthY(S5.KALAM.z) + 2, born, scale, a0: i * 2.1 }));
            return {
                t, darkness: 1, flash: 0, fade: 0, oil: OIL, marker: null,
                mitu: { x: lerp(mitu0, MITU_AFTER_HELP, ease(t / 3)), z: S5.CONTACT.z, sx: DIR, roll: 0 },
                pose: MITU_BOAT.REST,
                kalamX: kalamX(t), kalamPhase: t < 2 ? t / 2 : 0, kalamNod: 0,
                rings,
            };
        },
    },

    // after his thanks: Kalam nods to her (the curtain then fades the scene)
    farewell: {
        duration: S5.CLIP.farewell,
        state(t) {
            return {
                t, darkness: 1, flash: 0, fade: 0, oil: OIL, marker: null,
                mitu: { x: MITU_AFTER_HELP, z: S5.CONTACT.z, sx: DIR, roll: 0 },
                pose: MITU_BOAT.REST,
                kalamX: S5.KALAM_FREE, kalamPhase: 0, kalamNod: t > 0.3 && t < 1.5 ? Math.sin(Math.PI * (t - 0.3) / 1.2) : 0,
                rings: [],
            };
        },
    },

    // starts where the choice was made (Mitu at MITU_START, at rest): Kalam nods
    // without a word and keeps pushing alone; Mitu rows on towards home, passing
    // him in the foreground (she already faces home, so no turn) and out of the picture
    declined: {
        duration: S5.CLIP.declined,
        state(t) {
            // off screen by T0 + ROW_TIME (9.8 s)
            const T0 = S5.DECLINED_ROW.T0, N = S5.DECLINED_ROW.STROKES, ROW_TIME = 8.4, RAMP = 1.2;
            const boatX = (at: number) => lerp(S5.MITU_START.x, OFF.DECLINED_TO, rowAway(surged(at, T0, N) - T0, RAMP, ROW_TIME));
            return {
                t, darkness: lerp(0, 0.4, t / S5.CLIP.declined), flash: 0, fade: 0, oil: OIL, marker: null,
                mitu: { x: boatX(t), z: S5.MITU_START.z, sx: DIR, roll: rowPitch(t, T0, N) },
                pose: rowPose(t, T0, N, "near"),
                kalamX: S5.KALAM.x, kalamPhase: t < 2 ? 0 : kalamPhase(t - 2), kalamNod: t > 0.2 && t < 1.6 ? Math.sin(Math.PI * (t - 0.2) / 1.4) : 0,
                rings: [...rowRings(t, T0, N, DIR, boatX), ...wakeRings(t, S5.MITU_START.z, boatX)],
            };
        },
    },
};

// painting a pose is slow and many frames share one (rest poses), so keep each result
const painted = new Map<string, SpriteArt>();
function cached(key: string, paint: () => SpriteArt): SpriteArt {
    let art = painted.get(key);
    if (!art) {
        art = paint();
        painted.set(key, art);
    }
    return art;
}

// the frame of a clip at time t, with freshly painted poses
export function clipFrame(clip: string, t: number): FrameState {
    const look = CLIPS[clip].state(t);
    const mitu = cached(`m ${look.pose.side} ${look.pose.p.toFixed(4)}`, () => paintMitu(look.pose));
    const kalam = cached(`k ${look.kalamPhase.toFixed(4)} ${look.kalamNod.toFixed(4)}`, () => paintKalam(look.kalamPhase, look.kalamNod));
    return s5Frame(look, mitu, kalam);
}
