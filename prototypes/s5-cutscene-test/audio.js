// Placeholder sound, made live with the Web Audio API (no files).
// It plays through videos and gameplay alike, which is the point being tested:
// videos carry no sound, so ambience never restarts at a handoff.
// Real recordings replace these later; the cue names stay the same.

const Sound = {
    ctx: null,
    master: null,
    strain: null,

    // New here: browsers only allow audio after a click, so this runs from the Begin button.
    start() {
        this.ctx = new AudioContext();
        this.master = this.ctx.createGain();
        this.master.gain.value = 0.9;
        this.master.connect(this.ctx.destination);
        this.water();
        this.wind();
    },

    noiseBuffer(seconds, brown) {
        const ctx = this.ctx;
        const buf = ctx.createBuffer(1, ctx.sampleRate * seconds, ctx.sampleRate);
        const d = buf.getChannelData(0);
        let last = 0;
        for (let i = 0; i < d.length; i++) {
            const white = Math.random() * 2 - 1;
            if (brown) {
                last = (last + 0.02 * white) / 1.02;
                d[i] = last * 3.5;
            }
            else {
                d[i] = white;
            }
        }
        return buf;
    },

    loop(buffer) {
        const src = this.ctx.createBufferSource();
        src.buffer = buffer;
        src.loop = true;
        src.start();
        return src;
    },

    // water lapping: brown noise, low-passed, slowly swelling
    water() {
        const ctx = this.ctx;
        const src = this.loop(this.noiseBuffer(6, true));
        const lp = ctx.createBiquadFilter();
        lp.type = "lowpass";
        lp.frequency.value = 520;
        const g = ctx.createGain();
        g.gain.value = 0.32;
        const lfo = ctx.createOscillator();
        const lfoGain = ctx.createGain();
        lfo.frequency.value = 0.23;
        lfoGain.gain.value = 0.12;
        lfo.connect(lfoGain).connect(g.gain);
        lfo.start();
        src.connect(lp).connect(g).connect(this.master);
    },

    // evening wind: white noise through a slowly wandering band-pass
    wind() {
        const ctx = this.ctx;
        const src = this.loop(this.noiseBuffer(5, false));
        const bp = ctx.createBiquadFilter();
        bp.type = "bandpass";
        bp.frequency.value = 500;
        bp.Q.value = 0.6;
        const lfo = ctx.createOscillator();
        const lfoGain = ctx.createGain();
        lfo.frequency.value = 0.07;
        lfoGain.gain.value = 260;
        lfo.connect(lfoGain).connect(bp.frequency);
        lfo.start();
        const g = ctx.createGain();
        g.gain.value = 0.035;
        src.connect(bp).connect(g).connect(this.master);
    },

    burst({ duration, type, freq, q, gain, attack = 0.01, brown = false }) {
        if (!this.ctx) return;
        const ctx = this.ctx, now = ctx.currentTime;
        const src = ctx.createBufferSource();
        src.buffer = this.noiseBuffer(duration, brown);
        const f = ctx.createBiquadFilter();
        f.type = type;
        f.frequency.value = freq;
        f.Q.value = q;
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.0001, now);
        g.gain.exponentialRampToValueAtTime(gain, now + attack);
        g.gain.exponentialRampToValueAtTime(0.0001, now + duration);
        src.connect(f).connect(g).connect(this.master);
        src.start();
    },

    // one cue name per sound, used by game.js and the video cue lists
    play(name) {
        if (name === "oar") this.burst({ duration: 0.32, type: "bandpass", freq: 1100, q: 0.9, gain: 0.22 });
        if (name === "oarBad") this.burst({ duration: 0.4, type: "bandpass", freq: 650, q: 0.6, gain: 0.32 });
        if (name === "thunder") {
            this.burst({ duration: 4.5, type: "lowpass", freq: 160, q: 0.7, gain: 0.9, attack: 0.25, brown: true });
            this.burst({ duration: 2.2, type: "lowpass", freq: 420, q: 0.5, gain: 0.25, attack: 0.08, brown: true });
        }
        if (name === "bump") this.burst({ duration: 0.25, type: "lowpass", freq: 300, q: 1.5, gain: 0.5 });
        if (name === "free") this.burst({ duration: 1.6, type: "bandpass", freq: 900, q: 0.4, gain: 0.25, attack: 0.3 });
    },

    // low creak while Space is held during the push
    setStrain(on) {
        if (!this.ctx) return;
        const ctx = this.ctx;
        if (on && !this.strain) {
            const osc = ctx.createOscillator();
            osc.type = "triangle";
            osc.frequency.value = 58;
            const trem = ctx.createOscillator();
            const tremGain = ctx.createGain();
            trem.frequency.value = 2.2;
            tremGain.gain.value = 0.03;
            const g = ctx.createGain();
            g.gain.value = 0.04;
            trem.connect(tremGain).connect(g.gain);
            osc.connect(g).connect(this.master);
            osc.start();
            trem.start();
            this.strain = { osc, trem, g };
        }
        if (!on && this.strain) {
            const s = this.strain;
            s.g.gain.setTargetAtTime(0, ctx.currentTime, 0.08);
            setTimeout(() => { s.osc.stop(); s.trem.stop(); }, 400);
            this.strain = null;
        }
    },

    fadeOut(seconds) {
        if (!this.ctx) return;
        this.master.gain.setTargetAtTime(0, this.ctx.currentTime, seconds / 3);
    },
};
