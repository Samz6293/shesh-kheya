// The game loop and the master clock. Every frame it advances the clock,
// updates the live scene, and draws: live scene first, then the clip on top.
// It also turns "wait until X" into Promises, so a scene's play.ts can read
// like the script: `await game.loop.waitSync()`.
import { STAGE, SYNC } from "../shared/depth";
import type ClipPlayer from "./ClipPlayer";
import type Debug from "./Debug";
import type { LiveScene } from "../types";

const CONFIG = {
    MAX_DT: 0.05,                 // a slow frame never moves the game more than this (seconds)
    SYNC_LEAD: 0.6,               // a sync point closer than this is skipped: poses need time to come to rest
    BLACK: "#08070a",
};

interface Waiter {
    cond(): boolean
    resolve(): void
}

export default class Loop {
    t = 0;                        // master clock in seconds; clips map onto it
    private scene: LiveScene | null = null;
    private waiters: Waiter[] = [];
    private syncTarget: number | null = null;
    private last = 0;

    constructor(private ctx: CanvasRenderingContext2D, private clips: ClipPlayer, private debug: Debug) {}

    setScene(scene: LiveScene | null): void {
        this.scene = scene;
    }

    start(): void {
        this.last = performance.now();
        // New here: requestAnimationFrame asks the browser to call us before the
        // next repaint (about 60 times a second). Docs: MDN, requestAnimationFrame
        requestAnimationFrame(this.frame);
    }

    // resolves on the first frame where cond() is true
    waitFor(cond: () => boolean): Promise<void> {
        return new Promise((resolve) => this.waiters.push({ cond, resolve }));
    }

    wait(seconds: number): Promise<void> {
        const until = this.t + seconds;
        return this.waitFor(() => this.t >= until);
    }

    // resolves on the next sync point: a multiple of SYNC seconds, where every
    // looping motion is at its start, like the first frame of every clip
    // lead: the sync point must be at least this many seconds away
    waitSync(lead = CONFIG.SYNC_LEAD): Promise<void> {
        this.syncTarget = this.nextSync(lead);
        return this.waitFor(() => this.syncTarget === null);
    }

    // seconds from now until the sync point waitSync(lead) would wait for
    untilSync(lead = CONFIG.SYNC_LEAD): number {
        return this.nextSync(lead) - this.t;
    }

    private nextSync(lead: number): number {
        return Math.ceil((this.t + lead) / SYNC) * SYNC;
    }

    debugLine(): string {
        return `clock     ${this.t.toFixed(2)} s   next sync ${this.syncTarget ?? "-"}`;
    }

    // an arrow function, so `this` is still the Loop when the browser calls it
    private frame = (now: number): void => {
        // delta time: seconds since the last frame, so speed doesn't depend on frame rate
        const dt = Math.min(CONFIG.MAX_DT, (now - this.last) / 1000);
        this.last = now;

        if (this.clips.playing) {
            // during a clip the video is the clock
            this.t = this.clips.clock();
        }
        else {
            this.t += dt;
            if (this.syncTarget !== null && this.t >= this.syncTarget) {
                this.t = this.syncTarget;          // land exactly on the sync point
                this.syncTarget = null;
            }
            this.scene?.update(dt);
        }
        this.clips.update();

        // resolve the waiters whose condition is now true (backwards, so removing is safe)
        for (let i = this.waiters.length - 1; i >= 0; i--) {
            if (!this.waiters[i].cond()) continue;
            this.waiters[i].resolve();
            this.waiters.splice(i, 1);
        }

        if (this.scene) {
            this.scene.draw(this.ctx);
        }
        else {
            this.ctx.fillStyle = CONFIG.BLACK;
            this.ctx.fillRect(0, 0, STAGE.W, STAGE.H);
        }
        this.clips.draw(this.ctx);
        this.debug.refresh();
        requestAnimationFrame(this.frame);
    };
}
