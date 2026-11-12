// Plays cutscenes. A clip is a silent <video>; each frame is drawn onto the
// game canvas, the live lights (lantern) are drawn on top from the clip's
// track, and cues fire sounds by the video's time (lines are never in clips, D19).
// Drawing the video into the canvas (instead of showing the <video> element)
// is what lets live things sit on top of a clip, pixel for pixel like live play.
import { STAGE } from "../shared/depth";
import { clipPath, loadTrack } from "../shared/assets";
import { drawLights } from "../shared/lights";
import type { BoatAnchor, Cue, Game, PlayOptions, Track } from "../types";

const CONFIG = {
    CROSSFADE: 0.3,               // seconds, at both ends of a clip
    SKIP_TO_END: 0.03,            // Esc jumps to this long before the end
    BLACK: "#08070a",
};

interface Entry {
    video: HTMLVideoElement
    track: Track
    cues: Cue[]
}

interface Active {
    entry: Entry
    name: string
    startClock: number
    mediaTime: number             // time of the video frame on screen
    firstFrameAt: number | null   // real time (ms) the first frame arrived
    endedAt: number | null
    nextCue: number
    skipped: boolean
    options: PlayOptions
    resolve(): void
}

export default class ClipPlayer {
    playing = false;
    private entries = new Map<string, Entry>();
    private active: Active | null = null;
    private scratch: CanvasRenderingContext2D;
    private anchor: BoatAnchor = { x: 0, y: 0, scale: 1, sx: 1, roll: 0 };

    constructor(private game: Game, private box: HTMLElement) {
        const canvas = document.createElement("canvas");
        canvas.width = STAGE.W;
        canvas.height = STAGE.H;
        // safe: a 2D context is always available on a new canvas in the browsers we target
        this.scratch = canvas.getContext("2d")!;
    }

    // create the <video>s and load the tracks for every clip that has a cue list
    async load(scene: string, cues: Record<string, Cue[]>): Promise<void> {
        await Promise.all(Object.keys(cues).map(async (clip) => {
            const key = `${scene}/${clip}`;
            if (this.entries.has(key)) return;
            const video = document.createElement("video");
            video.muted = true;
            video.playsInline = true;
            video.preload = "auto";
            video.src = clipPath(scene, clip);
            this.box.appendChild(video);
            const ready = new Promise<void>((resolve, reject) => {
                video.addEventListener("canplay", () => resolve(), { once: true });
                video.addEventListener("error", () => reject(new Error(`Missing clip: ${video.src}`)), { once: true });
            });
            const [track] = await Promise.all([loadTrack(scene, clip), ready]);
            this.entries.set(key, { video, track, cues: [...cues[clip]].sort((a, b) => a.t - b.t) });
        }));
    }

    // resolves when the clip has played to its last frame
    play(scene: string, clip: string, options: PlayOptions = {}): Promise<void> {
        const entry = this.entries.get(`${scene}/${clip}`);
        if (!entry) throw new Error(`Clip not loaded: ${scene}/${clip}`);
        const video = entry.video;
        video.currentTime = 0;

        return new Promise((resolve) => {
            const active: Active = {
                entry, name: `${scene}/${clip}`, startClock: this.game.loop.t, mediaTime: 0,
                firstFrameAt: null, endedAt: null, nextCue: 0, skipped: false, options, resolve,
            };
            this.active = active;
            this.playing = true;

            // New here: requestVideoFrameCallback tells us exactly which video
            // frame is on screen (mediaTime), so lights and cues stay on the
            // right frame. Docs: MDN, HTMLVideoElement.requestVideoFrameCallback
            const onFrame = (_now: number, meta: VideoFrameCallbackMetadata) => {
                if (this.active !== active || active.endedAt !== null) return;
                active.mediaTime = meta.mediaTime;
                active.firstFrameAt ??= performance.now();
                video.requestVideoFrameCallback(onFrame);
            };
            video.requestVideoFrameCallback(onFrame);
            video.addEventListener("ended", () => this.finish(active), { once: true });
            video.play().catch((err) => console.error(`Could not play ${active.name}:`, err));
        });
    }

    // the game clock while a clip plays
    clock(): number {
        return this.active ? this.active.startClock + this.active.mediaTime : this.game.loop.t;
    }

    // called every frame by the loop: fire cues, finish the fade-out
    update(): void {
        const a = this.active;
        if (!a) return;
        if (a.endedAt === null) {
            const cues = a.entry.cues;
            while (a.nextCue < cues.length && cues[a.nextCue].t <= a.mediaTime) this.fire(cues[a.nextCue++], a.skipped);
            return;
        }
        if (!a.options.keepLastFrame && performance.now() - a.endedAt > CONFIG.CROSSFADE * 1000) this.active = null;
    }

    draw(ctx: CanvasRenderingContext2D): void {
        const a = this.active;
        if (!a) return;
        if (a.firstFrameAt === null) {
            // nothing decoded yet: a clip that opens on black can already cover the stage
            if (a.options.fromBlack) {
                ctx.fillStyle = CONFIG.BLACK;
                ctx.fillRect(0, 0, STAGE.W, STAGE.H);
            }
            return;
        }
        const alpha = this.alpha(a);
        if (alpha <= 0) return;

        // while crossfading, build the clip picture aside and blend it in whole
        const target = alpha < 1 ? this.scratch : ctx;
        target.drawImage(a.entry.video, 0, 0, STAGE.W, STAGE.H);
        const frames = a.entry.track.frames;
        const f = frames[Math.min(frames.length - 1, Math.round(a.mediaTime * a.entry.track.fps))];
        this.anchor.x = f[0];
        this.anchor.y = f[1];
        this.anchor.scale = f[2];
        this.anchor.sx = f[3];
        this.anchor.roll = f[6] ?? 0;         // tracks rendered before pitch existed have no roll
        this.anchor.lit = f[7] ?? 1;          // ... and before S3's lantern was lit in a clip
        // scale 0: the clip has no boat, so no lantern
        const boat = f[2] > 0 ? this.anchor : null;
        if (boat) drawLights(target, boat, this.game.progress.flags.lampOil, f[4], (1 - f[5]) * this.anchor.lit);
        a.options.overlay?.(target, boat);
        if (alpha < 1) {
            ctx.globalAlpha = alpha;
            ctx.drawImage(this.scratch.canvas, 0, 0);
            ctx.globalAlpha = 1;
        }
    }

    // Esc: jump to the last frame. The sounds of the skipped part are dropped
    skip(): void {
        const a = this.active;
        if (!a || a.endedAt !== null || a.skipped || a.firstFrameAt === null) return;
        // a video that can't be seeked (still loading) would jump back to its start
        if (a.entry.video.seekable.length === 0) return;
        a.skipped = true;
        a.entry.video.currentTime = Math.max(0, a.entry.video.duration - CONFIG.SKIP_TO_END);
    }

    // drop a kept last frame (after the screen has faded to black)
    clear(): void {
        this.active = null;
        this.playing = false;
    }

    debugLine(): string {
        const a = this.active;
        if (!a) return "clip      -";
        return `clip      ${a.name}  ${a.mediaTime.toFixed(2)} s${a.endedAt !== null ? "  (ended)" : ""}`;
    }

    private alpha(a: Active): number {
        const now = performance.now();
        if (a.endedAt !== null && !a.options.keepLastFrame) return 1 - (now - a.endedAt) / (CONFIG.CROSSFADE * 1000);
        if (a.options.fromBlack || a.firstFrameAt === null) return 1;
        return Math.min(1, (now - a.firstFrameAt) / (CONFIG.CROSSFADE * 1000));
    }

    private fire(cue: Cue, skipped: boolean): void {
        if (skipped) return;
        if (cue.sfx) this.game.sound.play(cue.sfx);
        if (cue.oar) this.game.sound.oar();
    }

    private finish(a: Active): void {
        if (this.active !== a || a.endedAt !== null) return;
        const frames = a.entry.track.frames.length;
        // the clip's last frame is t = duration exactly; put the game clock there,
        // so the live frame drawn under the fading clip is the matching one
        a.mediaTime = (frames - 1) / a.entry.track.fps;
        a.endedAt = performance.now();
        this.game.loop.t = a.startClock + a.mediaTime;
        this.playing = false;
        a.resolve();
    }
}
