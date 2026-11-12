// Activity 3: filling the lantern, on the close-up. Holding the mouse on the
// kerosene bottle tips it over the lantern's filler cap and oil pours while
// held; the meter in the corner rises. The bottle only holds so much, so the
// lamp can never be full. It ends when the bottle is empty, or a little while
// after the player stops pouring. The result is saved as lampOil (0-100).
import { drawGlow } from "../../shared/lights";
import { inkRGBA } from "../../shared/ink";
import { lerp, smooth } from "../../shared/math";
import { localToScreen } from "../../shared/depth";
import { LANTERN, STILL } from "../../scenes/ch1/s2-home/layout";
import type { Game } from "../../types";

const CONFIG = {
    START: 12,                    // oil already in the lamp
    BOTTLE: 72,                   // oil in the bottle: START + BOTTLE stays under 100
    RATE: 16,                     // oil per second while pouring (the whole bottle takes 4.5 s)
    TILT_SPEED: 2.6,              // per second, 0 = upright, 1 = pouring
    POUR_FROM: 0.92,              // oil only flows once the bottle is this far over
    IDLE_END: 2.4,                // seconds after the last pour (bottle upright again) that it ends
    MAX_TIME: 30,                 // it always ends by then (each activity ends within 30 s)
    GLOW: { RADIUS: 150, STRENGTH: 0.7 },
    STREAM: { INK: 0.5, WIDTH: 3, WOBBLE: 2.5, HZ: 9, STEPS: 8 },
    LIQUID_INK: 0.2,
};

export default class LanternOil {
    oil = CONFIG.START;
    private left = CONFIG.BOTTLE;
    private tilt = 0;
    private isHolding = false;
    private isFlowing = false;
    private lastPourAt: number | null = null;
    private startAt = 0;
    private isRunning = false;
    private isDone = false;

    constructor(private game: Game, private stills: Record<string, HTMLImageElement>) {}

    // resolves with the oil in the lamp, as a whole number
    async run(): Promise<number> {
        this.isRunning = true;
        this.startAt = this.game.loop.t;
        this.game.pointer.reset();
        this.game.oil.set(this.oil);
        await this.game.loop.waitFor(() => this.isDone);
        this.isRunning = false;
        this.game.sound.hold("sfx_pour", false);
        this.game.pointer.setCursor("default");
        return Math.round(this.oil);
    }

    update(dt: number): void {
        if (!this.isRunning || this.isDone) return;
        const t = this.game.loop.t, pointer = this.game.pointer;
        const [bx, by] = this.bottleMiddle();
        const isNear = pointer.isNear(bx, by, LANTERN.PICK_RADIUS);

        if (pointer.takePress() && isNear && this.left > 0) this.isHolding = true;
        if (pointer.takeRelease() || !pointer.isDown) this.isHolding = false;
        pointer.setCursor(this.isHolding ? "grabbing" : isNear && this.left > 0 ? "grab" : "default");

        // the bottle tips over while held and rights itself when let go (or empty)
        const wantsTilt = this.isHolding && this.left > 0;
        this.tilt = Math.max(0, Math.min(1, this.tilt + (wantsTilt ? 1 : -1) * CONFIG.TILT_SPEED * dt));
        this.isFlowing = wantsTilt && this.tilt >= CONFIG.POUR_FROM;
        if (this.isFlowing) {
            const amount = Math.min(this.left, CONFIG.RATE * dt);
            this.left -= amount;
            this.oil += amount;
            this.lastPourAt = t;
            this.game.oil.set(this.oil);
        }
        this.game.sound.hold("sfx_pour", this.isFlowing);

        // done: the bottle is empty, or the player poured and then stopped, or time is up
        const isUpright = this.tilt === 0 && !this.isHolding;
        const isEmpty = this.left <= 0;
        const hasStopped = this.lastPourAt !== null && t - this.lastPourAt > CONFIG.IDLE_END;
        const isLate = t - this.startAt > CONFIG.MAX_TIME;
        if (isUpright && (isEmpty || hasStopped || isLate)) this.isDone = true;
    }

    draw(ctx: CanvasRenderingContext2D): void {
        const t = this.game.loop.t;
        ctx.drawImage(this.stills[STILL.LANTERN_PLATE], 0, 0);
        const [bx, by] = this.bottleMiddle();
        const angle = LANTERN.POUR_ANGLE * smooth(this.tilt);

        // the bottle, with the kerosene left in it as a pale wash
        const img = this.stills[STILL.BOTTLE], L = LANTERN.LIQUID;
        ctx.save();
        ctx.translate(bx, by);
        ctx.rotate(angle);
        ctx.globalCompositeOperation = "multiply";
        const level = L.HEIGHT * (this.left / CONFIG.BOTTLE);
        ctx.fillStyle = inkRGBA(CONFIG.LIQUID_INK);
        ctx.fillRect(-L.HALF_W, L.BOTTOM - level, L.HALF_W * 2, level);
        ctx.globalCompositeOperation = "source-over";
        ctx.drawImage(img, -img.width / 2, -img.height / 2);
        ctx.restore();

        if (this.isFlowing) this.drawStream(ctx, bx, by, angle, t);
        if (!this.isHolding && this.left > 0 && !this.isDone) drawGlow(ctx, bx, by, CONFIG.GLOW.RADIUS, CONFIG.GLOW.STRENGTH, t);
    }

    debugLine(): string {
        return `lantern   oil ${this.oil.toFixed(0)}  bottle ${this.left.toFixed(0)}  tilt ${this.tilt.toFixed(2)}`;
    }

    private bottleMiddle(): [number, number] {
        const u = smooth(this.tilt);
        return [lerp(LANTERN.BOTTLE_REST[0], LANTERN.BOTTLE_POUR[0], u), lerp(LANTERN.BOTTLE_REST[1], LANTERN.BOTTLE_POUR[1], u)];
    }

    // a thin wavering line of kerosene from the bottle's mouth to the cap
    private drawStream(ctx: CanvasRenderingContext2D, bx: number, by: number, angle: number, t: number): void {
        const [mx, my] = localToScreen(LANTERN.BOTTLE_MOUTH, bx, by, 1, 1, angle);
        const [cx, cy] = LANTERN.CAP, S = CONFIG.STREAM;
        ctx.save();
        ctx.globalCompositeOperation = "multiply";
        ctx.strokeStyle = inkRGBA(S.INK);
        ctx.lineWidth = S.WIDTH;
        ctx.lineCap = "round";
        ctx.beginPath();
        for (let i = 0; i <= S.STEPS; i++) {
            const u = i / S.STEPS;
            const wobble = S.WOBBLE * Math.sin(2 * Math.PI * S.HZ * t + u * 6) * u * (1 - u) * 4;
            const x = lerp(mx, cx, u) + wobble, y = lerp(my, cy, u);
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.stroke();
        ctx.restore();
    }
}
