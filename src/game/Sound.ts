// All sound in the game. Videos are silent; clips and activities ask this
// class for sounds by id, so ambience runs unbroken across every join.
// For now each id is a Web Audio placeholder (placeholders.ts); real
// recordings in public/audio/ will replace them by the same ids.
import { BEDS, DROPS, HELD, OAR, ONE_SHOTS, TUNES } from "./placeholders";
import type { BedId, Burst, Drops, HeldId, OneShotId, Tune } from "./placeholders";

const CONFIG = {
    MASTER: 0.9,
    AMBIENCE_FADE: 2,             // seconds for ambience levels to change
    HELD_RELEASE: 0.08,
    // one water drop: a short tone sliding up in pitch
    DROP_SECONDS: 0.09,
    DROP_RISE: 1.9,               // the pitch ends this many times higher
};

interface HeldNodes {
    tone: OscillatorNode
    tremble: OscillatorNode
    gain: GainNode
}

export default class Sound {
    private ctx: AudioContext | null = null;
    private master: GainNode | null = null;
    private beds = new Map<BedId, GainNode>();
    private held = new Map<HeldId, HeldNodes>();
    private lastOar = "";

    // New here: the Web Audio API. Sounds are built by connecting small nodes
    // (source -> filter -> volume -> speakers). Browsers only allow it after a
    // click, so this is called from the Begin button. Docs: MDN, "Web Audio API"
    start(): void {
        if (!this.ctx) {
            this.ctx = new AudioContext();
            this.master = this.ctx.createGain();
            this.master.connect(this.ctx.destination);
        }
        // TODO: load public/audio/<id>.ogg|.m4a when a recording exists, and use it instead of the placeholder
        this.master?.gain.setTargetAtTime(CONFIG.MASTER, this.ctx.currentTime, 0.1);
    }

    // set the level of every ambience layer; layers left out fade to silence
    ambience(levels: Partial<Record<BedId, number>>): void {
        if (!this.ctx) return;
        // safe: Object.keys returns string[], but BEDS only has BedId keys
        for (const id of Object.keys(BEDS) as BedId[]) {
            const level = levels[id] ?? 0;
            let gain = this.beds.get(id);
            if (!gain && level > 0) gain = this.startBed(id);
            gain?.gain.setTargetAtTime(level, this.ctx.currentTime, CONFIG.AMBIENCE_FADE / 3);
        }
    }

    play(id: OneShotId, rate = 1, volume = 1): void {
        const bursts: Burst[] = ONE_SHOTS[id];
        for (const b of bursts) this.burst(b, rate, volume);
        const drops = DROPS[id];
        if (drops) this.drops(drops, rate, volume);
        const tune = TUNES[id];
        if (tune) this.tune(tune, volume);
    }

    // an oar stroke: never the same variation twice in a row, slightly
    // different pitch and volume each time, so it doesn't get tiring
    oar(): void {
        const options: readonly OneShotId[] = OAR.VARIATIONS;
        let id = options[Math.floor(Math.random() * options.length)];
        if (id === this.lastOar) id = options[(options.indexOf(id) + 1) % options.length];
        this.lastOar = id;
        const vary = (amount: number) => 1 + (Math.random() * 2 - 1) * amount;
        this.play(id, vary(OAR.PITCH), vary(OAR.VOLUME));
    }

    // a sound that lasts as long as something is held
    hold(id: HeldId, on: boolean): void {
        if (!this.ctx || !this.master) return;
        const playing = this.held.get(id);
        if (on && !playing) {
            const recipe = HELD[id];
            const tone = this.ctx.createOscillator();
            tone.type = "triangle";
            tone.frequency.value = recipe.freq;
            const tremble = this.ctx.createOscillator();
            const trembleGain = this.ctx.createGain();
            tremble.frequency.value = recipe.trembleHz;
            trembleGain.gain.value = recipe.trembleDepth;
            const gain = this.ctx.createGain();
            gain.gain.value = recipe.gain;
            tremble.connect(trembleGain).connect(gain.gain);
            tone.connect(gain).connect(this.master);
            tone.start();
            tremble.start();
            this.held.set(id, { tone, tremble, gain });
        }
        if (!on && playing) {
            const stopAt = this.ctx.currentTime + CONFIG.HELD_RELEASE * 5;
            playing.gain.gain.setTargetAtTime(0, this.ctx.currentTime, CONFIG.HELD_RELEASE);
            playing.tone.stop(stopAt);
            playing.tremble.stop(stopAt);
            this.held.delete(id);
        }
    }

    fadeOut(seconds: number): void {
        if (!this.ctx || !this.master) return;
        this.master.gain.setTargetAtTime(0, this.ctx.currentTime, seconds / 3);
    }

    private noise(seconds: number, brown: boolean): AudioBuffer {
        // safe: only called after start() has made the context
        const ctx = this.ctx!;
        const buffer = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * seconds), ctx.sampleRate);
        const data = buffer.getChannelData(0);
        let last = 0;
        for (let i = 0; i < data.length; i++) {
            const white = Math.random() * 2 - 1;
            // brown noise: each sample stays close to the one before, which sounds deeper
            last = brown ? (last + 0.02 * white) / 1.02 : white;
            data[i] = brown ? last * 3.5 : white;
        }
        return buffer;
    }

    private startBed(id: BedId): GainNode {
        // safe: only called after start() has made the context and master volume
        const ctx = this.ctx!, master = this.master!;
        const recipe = BEDS[id];
        const source = ctx.createBufferSource();
        source.buffer = this.noise(recipe.seconds, recipe.brown);
        source.loop = true;
        const filter = ctx.createBiquadFilter();
        filter.type = recipe.filter;
        filter.frequency.value = recipe.freq;
        filter.Q.value = recipe.q;
        const bed = ctx.createGain();
        bed.gain.value = recipe.gain;

        // a very slow oscillator nudges the volume or the tone, like swell or gusts
        const drift = ctx.createOscillator();
        const driftGain = ctx.createGain();
        drift.frequency.value = recipe.driftHz;
        driftGain.gain.value = recipe.driftDepth;
        drift.connect(driftGain).connect(recipe.drift === "gain" ? bed.gain : filter.frequency);
        drift.start();

        const level = ctx.createGain();
        level.gain.value = 0;
        source.connect(filter).connect(bed).connect(level).connect(master);
        source.start();
        this.beds.set(id, level);
        return level;
    }

    private burst(b: Burst, rate: number, volume: number): void {
        if (!this.ctx || !this.master) return;
        const start = this.ctx.currentTime + (b.delay ?? 0);
        const source = this.ctx.createBufferSource();
        source.buffer = this.noise(b.duration, b.brown ?? false);
        const filter = this.ctx.createBiquadFilter();
        filter.type = b.filter;
        filter.frequency.setValueAtTime(b.freq * rate, start);
        if (b.sweepTo) filter.frequency.exponentialRampToValueAtTime(b.sweepTo * rate, start + b.duration);
        filter.Q.value = b.q;
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.0001, start);
        gain.gain.exponentialRampToValueAtTime(b.gain * volume, start + (b.attack ?? 0.01));
        gain.gain.exponentialRampToValueAtTime(0.0001, start + b.duration);
        source.connect(filter).connect(gain).connect(this.master);
        source.start(start);
    }

    // one soft tone per note, each swelling in and dying away, with a slow wobble
    private tune(tune: Tune, volume: number): void {
        if (!this.ctx || !this.master) return;
        let start = this.ctx.currentTime;
        for (const [pitch, seconds] of tune.notes) {
            const tone = this.ctx.createOscillator();
            tone.frequency.value = pitch;
            const vibrato = this.ctx.createOscillator();
            const vibratoGain = this.ctx.createGain();
            vibrato.frequency.value = tune.vibratoHz;
            vibratoGain.gain.value = tune.vibratoDepth;
            vibrato.connect(vibratoGain).connect(tone.frequency);
            const gain = this.ctx.createGain();
            gain.gain.setValueAtTime(0.0001, start);
            gain.gain.exponentialRampToValueAtTime(tune.gain * volume, start + tune.attack);
            gain.gain.exponentialRampToValueAtTime(0.0001, start + seconds + tune.attack);
            tone.connect(gain).connect(this.master);
            for (const osc of [tone, vibrato]) {
                osc.start(start);
                osc.stop(start + seconds + tune.attack * 2);
            }
            start += seconds;
        }
    }

    private drops(d: Drops, rate: number, volume: number): void {
        if (!this.ctx || !this.master) return;
        for (let i = 0; i < d.count; i++) {
            const start = this.ctx.currentTime + d.delay + Math.random() * d.spread;
            const pitch = (d.from + Math.random() * (d.to - d.from)) * rate;
            const tone = this.ctx.createOscillator();
            tone.frequency.setValueAtTime(pitch, start);
            tone.frequency.exponentialRampToValueAtTime(pitch * CONFIG.DROP_RISE, start + CONFIG.DROP_SECONDS);
            const gain = this.ctx.createGain();
            gain.gain.setValueAtTime(0.0001, start);
            gain.gain.exponentialRampToValueAtTime(d.gain * volume * (0.5 + Math.random() * 0.5), start + 0.012);
            gain.gain.exponentialRampToValueAtTime(0.0001, start + CONFIG.DROP_SECONDS);
            tone.connect(gain).connect(this.master);
            tone.start(start);
            tone.stop(start + CONFIG.DROP_SECONDS);
        }
    }
}
