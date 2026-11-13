// Activity: pulling Rahim's net. A mark slides to and fro along a bar; Space
// while it is in the warm zone is a pull: the net comes up a step, Mitu
// heaves on the line. Space at the wrong moment only lets it slip back a
// step; it can never fail (D9: 5 steps to finish). After the 1st, 3rd and
// 5th good pull the scene gets to say one of Rahim's lines; the bar waits.
import { drawTimingBar } from "../../shared/lights";
import type { Game } from "../../types";

const CONFIG = {
    SWEEP: 1.7,                   // seconds for the mark to go across and back
    ZONE: 0.26,                   // half the warm zone, as a share of the bar (generous)
    PULL: 0.5,                    // seconds Mitu heaves after a good pull
    SLIP: 1 / 3,                  // steps a miss lets the net slip back: always less than a pull gains
    GLOW: 0.35,                   // seconds the zone stays lit after a good pull
    LINES_AFTER: [1, 3, 5],       // good pulls after which Rahim speaks (D9)
    KEY: "Space",
};

export interface NetPullParams {
    levels: number                // steps until the net is up
    bar: { X: number, Y: number, HALF: number }
    // Rahim's n-th line (0, 1, 2); the bar waits until it resolves
    say(n: number): Promise<void>
}

export default class NetPull {
    level = 0;                    // how far the net has come up, in steps (a miss takes off part of one)
    private hits = 0;
    private phase = 0;            // 0..1 through one sweep of the mark
    private pullStart = -Infinity;
    private glowStart = -Infinity;
    private isOn = false;
    private isWaiting = false;    // a line is up: the mark stops and Space is the dialogue's
    private pressed = false;

    constructor(private game: Game, private params: NetPullParams) {}

    // resolves when the net is up
    async run(): Promise<void> {
        this.isOn = true;
        this.game.hint.show("netHint");
        document.addEventListener("keydown", this.onKeyDown);
        while (this.level < this.params.levels) {
            await this.game.loop.waitFor(() => this.pressed);
            this.pressed = false;
            if (!this.isOnTime()) {
                // only slips back a little, never below the start
                this.level = Math.max(0, this.level - CONFIG.SLIP);
                this.game.sound.play("sfx_net_slip");
                continue;
            }
            this.level++;
            this.hits++;
            this.pullStart = this.glowStart = this.game.loop.t;
            this.game.sound.play("sfx_net_pull");
            const line = CONFIG.LINES_AFTER.indexOf(this.hits);
            if (line < 0) continue;
            this.isWaiting = true;
            this.game.hint.hide("netHint");
            await this.params.say(line);
            this.isWaiting = false;
            if (this.level < this.params.levels) this.game.hint.show("netHint");
        }
        document.removeEventListener("keydown", this.onKeyDown);
        this.game.hint.hide("netHint");
        this.isOn = false;
    }

    // 0..1: how far through Mitu's heave on the line she is (0 = at rest)
    get pull(): number {
        const u = (this.game.loop.t - this.pullStart) / CONFIG.PULL;
        return u >= 0 && u < 1 ? Math.sin(Math.PI * u) : 0;
    }

    update(dt: number): void {
        if (this.isOn && !this.isWaiting) this.phase = (this.phase + dt / CONFIG.SWEEP) % 1;
    }

    draw(ctx: CanvasRenderingContext2D): void {
        if (!this.isOn || this.isWaiting) return;
        const { X, Y, HALF } = this.params.bar;
        const glow = Math.max(0, 1 - (this.game.loop.t - this.glowStart) / CONFIG.GLOW);
        drawTimingBar(ctx, X, Y, HALF, CONFIG.ZONE, this.mark(), glow);
    }

    debugLine(): string {
        return `net       level ${this.level.toFixed(2)}/${this.params.levels}  good pulls ${this.hits}  mark ${this.mark().toFixed(2)}`;
    }

    // where the mark is along the bar, -1..1, swinging smoothly to and fro
    private mark(): number {
        return -Math.cos(2 * Math.PI * this.phase);
    }

    private isOnTime(): boolean {
        return Math.abs(this.mark()) <= CONFIG.ZONE;
    }

    private onKeyDown = (e: KeyboardEvent): void => {
        if (e.code !== CONFIG.KEY || e.repeat || this.isWaiting) return;
        e.preventDefault();           // Space would scroll the page
        this.pressed = true;
    };
}
