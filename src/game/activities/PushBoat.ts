// Activity: steer up to a stuck boat, then hold Space to push it free.
// Any touch with the other hull eases Mitu's boat into the contact pose (the
// rest pose the next clip starts from), so the player can't miss it. Releasing
// Space only pauses the push. Helping costs time: progress darkens the sky.
import { depthScale, depthY } from "../../shared/depth";
import { lerp, smooth } from "../../shared/math";
import Boat from "../Boat";
import type { Game, Marker, PushParams } from "../../types";

const CONFIG = {
    TOUCH_DZ: 0.13,               // hulls touch when their depths are this close ...
    TOUCH_PAD: 20,                // ... and their ends overlap (plus this many px)
    EASE_MIN: 0.9,                // seconds to slide into the contact pose, at least
    EASE_SPEED: 320,              // px/s for longer slides
    PUSH_TIME: 8,                 // seconds of holding Space
    STROKE_GAP: 0.45,             // seconds between Mitu's strokes while pushing
    KEY: "Space",
};

type Stage = "idle" | "row" | "ease" | "ready" | "push" | "done";

interface Ease {
    x: number
    z: number
    start: number
    seconds: number
}

export default class PushBoat {
    progress = 0;                 // 0..1
    stage: Stage = "idle";
    marker: Marker | null = null; // where to row to; the scene draws it
    private spaceDown = false;
    private ease: Ease | null = null;
    private nextStroke = 0;

    constructor(private game: Game, private boat: Boat, private params: PushParams) {}

    // resolves when the boat has been pushed free
    async run(): Promise<void> {
        const { contact } = this.params;
        this.stage = "row";
        this.boat.rowing = true;
        this.marker = { x: contact.x, y: depthY(contact.z), scale: depthScale(contact.z) };
        this.game.hint.show("steerHint");
        document.addEventListener("keydown", this.onKeyDown);
        document.addEventListener("keyup", this.onKeyUp);

        await this.game.loop.waitFor(() => this.progress >= 1);

        document.removeEventListener("keydown", this.onKeyDown);
        document.removeEventListener("keyup", this.onKeyUp);
        this.game.sound.hold("sfx_push_strain", false);
        this.game.hint.hide();
        this.stage = "done";
    }

    // called every frame by the scene
    update(dt: number): void {
        if (this.stage === "row") this.updateRow();
        if (this.stage === "ease") this.updateEase();
        if (this.stage === "ready" || this.stage === "push") this.updatePush(dt);
    }

    debugLine(): string {
        return `push      ${this.stage}  ${(this.progress * 100).toFixed(0)} %`;
    }

    private updateRow(): void {
        const { contact, target, reach } = this.params, boat = this.boat;

        // any touch with the other hull: take over and line the boats up
        const isTouching = Math.abs(boat.z - target.z) < CONFIG.TOUCH_DZ && Math.abs(boat.x - target.x) < reach + CONFIG.TOUCH_PAD;
        if (!isTouching) return;
        const distance = Math.hypot(boat.x - contact.x, (boat.z - contact.z) * Boat.DEPTH_PX);
        this.ease = { x: boat.x, z: boat.z, start: this.game.loop.t, seconds: Math.max(CONFIG.EASE_MIN, distance / CONFIG.EASE_SPEED) };
        this.stage = "ease";
        this.marker = null;
        this.game.hint.hide();        // the Space hint comes once the boats are lined up
        boat.rowing = false;
        boat.stop();
    }

    private updateEase(): void {
        const e = this.ease, boat = this.boat, { contact } = this.params;
        if (!e) return;
        const u = smooth(Math.min(1, (this.game.loop.t - e.start) / e.seconds));
        boat.x = lerp(e.x, contact.x, u);
        boat.z = lerp(e.z, contact.z, u);
        if (u < 1) return;
        this.stage = "ready";
        this.game.sound.play("sfx_boat_bump");
        this.game.hint.show("pushHint", true);
    }

    private updatePush(dt: number): void {
        const { contact, distance, onProgress } = this.params, boat = this.boat;
        const isPushing = this.spaceDown && this.progress < 1;
        this.stage = isPushing ? "push" : "ready";
        if (isPushing) {
            this.progress = Math.min(1, this.progress + dt / CONFIG.PUSH_TIME);
            // Mitu keeps rowing against the hull, alternating sides
            if (this.game.loop.t >= this.nextStroke) {
                boat.strokeAnim();
                this.nextStroke = this.game.loop.t + CONFIG.STROKE_GAP;
            }
        }
        this.game.sound.hold("sfx_push_strain", isPushing);
        boat.x = contact.x + this.progress * distance;
        onProgress(this.progress);
        this.game.hint.progress(this.progress);
    }

    private onKeyDown = (e: KeyboardEvent): void => {
        if (e.code !== CONFIG.KEY) return;
        e.preventDefault();           // Space would scroll the page
        this.spaceDown = true;
    };

    private onKeyUp = (e: KeyboardEvent): void => {
        if (e.code === CONFIG.KEY) this.spaceDown = false;
    };
}
