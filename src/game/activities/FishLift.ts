// Activity: lifting Rahim's fish into Mitu's boat. The fish thrashes in the
// net with a soft light on it; press on it and drag it over to her boat. Let
// go over the boat and it lands there; let go anywhere else and it slides
// back into the net. Nothing can go wrong. The scene draws the fish sprite
// wherever this says it is.
import { drawGlow } from "../../shared/lights";
import { lerp, smooth } from "../../shared/math";
import type { Game, Point } from "../../types";

const CONFIG = {
    PICK: 70,                     // px round the fish that picks it up
    BACK: 0.5,                    // seconds to slide back into the net
    GLOW: { RADIUS: 80, STRENGTH: 0.8 },
};

export interface FishLiftParams {
    inNet(): Point                // where the fish is in the net now (it bobs)
    isOverBoat(x: number, y: number): boolean
}

export default class FishLift {
    at: Point = [0, 0];           // where the fish is on screen
    isLoose = false;              // out of the net (being dragged or sliding back)
    private grab: Point | null = null;
    private sliding: { from: Point, start: number } | null = null;
    private isOn = false;
    private isDone = false;

    constructor(private game: Game, private params: FishLiftParams) {}

    // resolves when the fish is in the boat
    async run(): Promise<void> {
        this.isOn = true;
        this.game.pointer.reset();
        await this.game.loop.waitFor(() => this.isDone);
        this.game.pointer.setCursor("default");
        this.isOn = false;
    }

    update(): void {
        if (!this.isOn) return;
        const pointer = this.game.pointer;
        if (this.grab) {
            this.at = [pointer.x - this.grab[0], pointer.y - this.grab[1]];
            pointer.setCursor("grabbing");
            if (pointer.takeRelease()) this.drop();
            return;
        }
        if (this.sliding) {
            const u = smooth(Math.min(1, (this.game.loop.t - this.sliding.start) / CONFIG.BACK));
            const net = this.params.inNet();
            this.at = [lerp(this.sliding.from[0], net[0], u), lerp(this.sliding.from[1], net[1], u)];
            if (u >= 1) {
                this.sliding = null;
                this.isLoose = false;
            }
            return;
        }
        this.at = this.params.inNet();
        const isNear = pointer.isNear(this.at[0], this.at[1], CONFIG.PICK);
        pointer.setCursor(isNear ? "grab" : "default");
        if (!pointer.takePress() || !isNear) return;
        this.grab = [pointer.x - this.at[0], pointer.y - this.at[1]];
        this.isLoose = true;
        pointer.takeRelease();        // a release from before this press doesn't count
        this.game.sound.play("sfx_fish_jump");
    }

    // the soft light that says "take me", while it waits in the net
    draw(ctx: CanvasRenderingContext2D): void {
        if (!this.isOn || this.isLoose) return;
        drawGlow(ctx, this.at[0], this.at[1], CONFIG.GLOW.RADIUS, CONFIG.GLOW.STRENGTH, this.game.loop.t);
    }

    private drop(): void {
        this.grab = null;
        if (this.params.isOverBoat(this.at[0], this.at[1])) {
            this.game.sound.play("sfx_fish_jump");
            this.isDone = true;
            return;
        }
        this.sliding = { from: [this.at[0], this.at[1]], start: this.game.loop.t };
    }
}
