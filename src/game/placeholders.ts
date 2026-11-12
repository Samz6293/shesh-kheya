// Recipes for the placeholder sounds: every sound is filtered noise made live
// with Web Audio, so the game runs every sound code path before any recording
// exists. Code asks for sounds only by id (the ids in docs/04-audio.md), so a
// real file can replace a recipe later without touching the callers.

// one puff of filtered noise
export interface Burst {
    duration: number              // seconds
    filter: BiquadFilterType
    freq: number                  // Hz
    sweepTo?: number              // the filter glides to this frequency: a "swoosh"
    q: number
    gain: number
    attack?: number               // seconds to reach full volume
    delay?: number                // seconds after the sound starts
    brown?: boolean               // brown noise is deeper than white noise
}

// a handful of water drops: short tones that slide upward, the "bloop" of water
export interface Drops {
    count: number
    from: number                  // lowest starting pitch, Hz
    to: number                    // highest starting pitch, Hz
    delay: number                 // the first drop comes this long after the sound starts
    spread: number                // the drops fall within this many seconds
    gain: number
}

// a looping bed of noise whose volume or tone slowly drifts
export interface Bed {
    brown: boolean
    seconds: number
    filter: BiquadFilterType
    freq: number
    q: number
    gain: number
    drift: "gain" | "freq"
    driftHz: number
    driftDepth: number
}

export const ONE_SHOTS = {
    // an oar stroke: the blade dips in, pulls a swoosh of water, and drips as it lifts.
    // Two layers of noise (a deep push and a rising swoosh); the drops are in DROPS below
    sfx_oar_1: [
        { duration: 0.6, filter: "lowpass", freq: 320, q: 0.7, gain: 0.2, attack: 0.1, brown: true },
        { duration: 0.55, filter: "bandpass", freq: 420, sweepTo: 1250, q: 1.1, gain: 0.1, attack: 0.16 },
    ],
    sfx_oar_2: [
        { duration: 0.65, filter: "lowpass", freq: 290, q: 0.7, gain: 0.2, attack: 0.12, brown: true },
        { duration: 0.6, filter: "bandpass", freq: 380, sweepTo: 1100, q: 1.1, gain: 0.1, attack: 0.18 },
    ],
    sfx_oar_3: [
        { duration: 0.55, filter: "lowpass", freq: 350, q: 0.7, gain: 0.2, attack: 0.09, brown: true },
        { duration: 0.5, filter: "bandpass", freq: 460, sweepTo: 1400, q: 1.1, gain: 0.1, attack: 0.15 },
    ],
    sfx_thunder_far: [
        { duration: 4.5, filter: "lowpass", freq: 160, q: 0.7, gain: 0.9, attack: 0.25, brown: true },
        { duration: 2.2, filter: "lowpass", freq: 420, q: 0.5, gain: 0.25, attack: 0.08, brown: true },
    ],
    sfx_boat_bump: [
        { duration: 0.25, filter: "lowpass", freq: 300, q: 1.5, gain: 0.5 },
    ],
    sfx_boat_free: [
        { duration: 1.6, filter: "bandpass", freq: 900, q: 0.4, gain: 0.25, attack: 0.3 },
    ],
} satisfies Record<string, Burst[]>;
// New here: `satisfies` checks the object against a type but keeps its exact
// keys, so `keyof typeof ONE_SHOTS` below is the list of ids, not just "string".
// Docs: TypeScript handbook, "The satisfies Operator"

export const BEDS = {
    amb_water: { brown: true, seconds: 6, filter: "lowpass", freq: 520, q: 1, gain: 0.32, drift: "gain", driftHz: 0.23, driftDepth: 0.12 },
    amb_wind: { brown: false, seconds: 5, filter: "bandpass", freq: 500, q: 0.6, gain: 0.035, drift: "freq", driftHz: 0.07, driftDepth: 260 },
} satisfies Record<string, Bed>;

// a low creak (a trembling tone) while something is held
export const HELD = {
    sfx_push_strain: { freq: 58, gain: 0.04, trembleHz: 2.2, trembleDepth: 0.03 },
};

// drops that go with a one-shot (not every sound has them)
export const DROPS: Partial<Record<keyof typeof ONE_SHOTS, Drops>> = {
    sfx_oar_1: { count: 5, from: 520, to: 1100, delay: 0.05, spread: 0.5, gain: 0.07 },
    sfx_oar_2: { count: 4, from: 460, to: 980, delay: 0.05, spread: 0.55, gain: 0.07 },
    sfx_oar_3: { count: 6, from: 580, to: 1250, delay: 0.04, spread: 0.45, gain: 0.07 },
};

export const OAR = {
    VARIATIONS: ["sfx_oar_1", "sfx_oar_2", "sfx_oar_3"],
    PITCH: 0.04,                  // +-4 %
    VOLUME: 0.1,                  // +-10 %
} as const;

export type OneShotId = keyof typeof ONE_SHOTS;
export type BedId = keyof typeof BEDS;
export type HeldId = keyof typeof HELD;
export type SoundId = OneShotId | BedId | HeldId;
