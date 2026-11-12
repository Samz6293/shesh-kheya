// The light over the speaker: while someone talks, a soft warm glow sits just
// above their head in the picture, so the player sees who is speaking. When
// the speaker changes it fades out, moves, and fades in again: it never jumps.
// Small moves (a head bobbing with a boat) it simply follows.
// A scene gives it a point each frame (or null when nobody in view speaks).
import { drawSpeakerLight } from "../shared/lights";
import type { Point } from "../types";

const CONFIG = {
    EASE: 6,                      // how quickly it fades (per second)
    RADIUS: 16,                   // px
    MOVE_BELOW: 0.05,             // it only jumps to a new speaker once it has faded this far
    FOLLOW: 40,                   // px: a move smaller than this is the same speaker moving
};

export default class SpeakerLight {
    private alpha = 0;
    private at: Point = [0, 0];

    update(dt: number, target: Point | null): void {
        const distance = target ? Math.hypot(target[0] - this.at[0], target[1] - this.at[1]) : 0;
        const isFollowing = target !== null && distance < CONFIG.FOLLOW;
        if (target && (isFollowing || this.alpha < CONFIG.MOVE_BELOW)) {
            this.at[0] = target[0];
            this.at[1] = target[1];
        }
        const wanted = target && isFollowing ? 1 : 0;
        this.alpha += (wanted - this.alpha) * Math.min(1, dt * CONFIG.EASE);
    }

    draw(ctx: CanvasRenderingContext2D): void {
        drawSpeakerLight(ctx, this.at[0], this.at[1], CONFIG.RADIUS, this.alpha);
    }
}
