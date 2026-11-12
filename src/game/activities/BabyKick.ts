// Activity 1: the baby kick, the player's part. After Amma's "Come, put your
// hand here", an ink hand pulses over her belly with a soft glow; one click on
// it and run() resolves. The rest (Mitu kneeling, her hand on the belly, the
// kick and the light) is the `touch` clip. No text: the hand is the prompt.
// Clicking anywhere else does nothing, so nothing can go wrong.
import { drawGlow } from "../../shared/lights";
import type { Game, Point } from "../../types";

const CONFIG = {
    HIT_RADIUS: 75,               // px round the belly that count as clicking it
    GLOW_RADIUS: 85,
    FADE_IN: 0.6,                 // seconds for the hand to appear
    PULSE: { SPEED: 3.2, MIN: 0.55 },        // the hand breathes between MIN and full strength
    ICON_ABOVE: 8,                // px the hand sits above the belly point
};

export default class BabyKick {
    private shownAt: number | null = null;
    private isClicked = false;

    constructor(private game: Game, private belly: Point, private icon: HTMLImageElement) {}

    // resolves when the player clicks the hand
    async run(): Promise<void> {
        this.shownAt = this.game.loop.t;
        this.isClicked = false;
        this.game.pointer.reset();
        await this.game.loop.waitFor(() => this.isClicked);
        this.shownAt = null;
        this.game.pointer.setCursor("default");
    }

    update(): void {
        if (this.shownAt === null) return;
        const pointer = this.game.pointer;
        const isNear = pointer.isNear(this.belly[0], this.belly[1], CONFIG.HIT_RADIUS);
        pointer.setCursor(isNear ? "pointer" : "default");
        if (pointer.takePress() && isNear) this.isClicked = true;
    }

    // drawn by the scene on top of the wide shot
    draw(ctx: CanvasRenderingContext2D): void {
        if (this.shownAt === null) return;
        const t = this.game.loop.t;
        const appear = Math.min(1, (t - this.shownAt) / CONFIG.FADE_IN);
        const pulse = CONFIG.PULSE.MIN + (1 - CONFIG.PULSE.MIN) * (0.5 + 0.5 * Math.sin(t * CONFIG.PULSE.SPEED));
        const [x, y] = this.belly;
        drawGlow(ctx, x, y, CONFIG.GLOW_RADIUS, appear, t);
        ctx.save();
        ctx.globalAlpha = appear * pulse;
        ctx.drawImage(this.icon, x - this.icon.width / 2, y - this.icon.height / 2 - CONFIG.ICON_ABOVE);
        ctx.restore();
    }
}
