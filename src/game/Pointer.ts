// The mouse, in stage pixels (1920 × 1080) whatever the window size, so an
// activity can compare it with positions in layout.ts. Activities read it
// every frame instead of each adding their own listeners: `isDown`, `x`, `y`,
// and takePress() / takeRelease() for the moment a button goes down or up.
import { STAGE } from "../shared/depth";

export type Cursor = "default" | "pointer" | "grab" | "grabbing";

export default class Pointer {
    x = -1;
    y = -1;
    isDown = false;
    private pressed = false;
    private released = false;

    constructor(private stage: HTMLElement, private canvas: HTMLCanvasElement) {
        // New here: pointer events. One set of events for mouse, pen and touch.
        // Docs: MDN, "Pointer events"
        stage.addEventListener("pointerdown", (e) => {
            this.move(e);
            this.isDown = true;
            this.pressed = true;
        });
        // on the window, so letting go outside the stage still counts
        window.addEventListener("pointerup", (e) => {
            this.move(e);
            if (!this.isDown) return;
            this.isDown = false;
            this.released = true;
        });
        window.addEventListener("pointermove", (e) => this.move(e));
    }

    // true once for each press (the frame it happened)
    takePress(): boolean {
        const was = this.pressed;
        this.pressed = false;
        return was;
    }

    takeRelease(): boolean {
        const was = this.released;
        this.released = false;
        return was;
    }

    // forget a press or release from before an activity started
    reset(): void {
        this.pressed = false;
        this.released = false;
    }

    isNear(x: number, y: number, radius: number): boolean {
        return Math.hypot(this.x - x, this.y - y) <= radius;
    }

    setCursor(cursor: Cursor): void {
        this.stage.style.cursor = cursor;
    }

    // window pixels -> stage pixels: the canvas is the 16:9 stage, scaled to fit
    private move(e: PointerEvent): void {
        const box = this.canvas.getBoundingClientRect();
        this.x = ((e.clientX - box.left) / box.width) * STAGE.W;
        this.y = ((e.clientY - box.top) / box.height) * STAGE.H;
    }
}
