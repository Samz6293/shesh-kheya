// The box a review note points at. Drag on the picture to draw it, drag inside
// it to move it, drag a corner to resize it; a plain click drops a box of the
// default size. Kept in stage pixels (1920 x 1080), shown in % of the stage, so
// it lands on the same spot whatever the window size.
import { STAGE } from "../shared/depth";
import type { NoteBox } from "../types";

const CONFIG = {
    MIN: 24,                // smaller than this (stage px) counts as a click
    DEFAULT: 200,           // a click makes a box this big around the point
};

// what a drag changes: the whole box, one corner, or a new box being drawn
type Grip = "move" | "nw" | "ne" | "sw" | "se" | "draw";

export function boxStyle(box: NoteBox): Partial<CSSStyleDeclaration> {
    return {
        left: `${(box.x / STAGE.W) * 100}%`,
        top: `${(box.y / STAGE.H) * 100}%`,
        width: `${(box.w / STAGE.W) * 100}%`,
        height: `${(box.h / STAGE.H) * 100}%`,
    };
}

const clamp = (v: number, lo: number, hi: number): number => Math.min(Math.max(v, lo), hi);

export default class BoxTool {
    box: NoteBox | null = null;
    private grip: Grip | null = null;
    private start = { x: 0, y: 0, box: { x: 0, y: 0, w: 0, h: 0 } };

    // onPlaced: the first box of a note is ready (open the form)
    constructor(private readonly stage: HTMLElement, private readonly el: HTMLElement, private readonly onPlaced: () => void) {
        stage.addEventListener("pointerdown", (e) => this.down(e));
        stage.addEventListener("pointermove", (e) => this.move(e));
        stage.addEventListener("pointerup", () => this.up());
    }

    clear(): void {
        this.box = null;
        this.grip = null;
        this.el.hidden = true;
    }

    // the mouse in stage pixels (same maths as game/Pointer.ts)
    private point(e: PointerEvent): { x: number, y: number } {
        const r = this.stage.getBoundingClientRect();
        return { x: clamp(((e.clientX - r.left) / r.width) * STAGE.W, 0, STAGE.W), y: clamp(((e.clientY - r.top) / r.height) * STAGE.H, 0, STAGE.H) };
    }

    private down(e: PointerEvent): void {
        // a corner handle says which corner it is in data-grip; the box itself moves
        const target = e.target as HTMLElement;     // safe: pointer events on the stage come from elements
        const grip = (target.dataset.grip as Grip | undefined) ?? (target === this.el ? "move" : "draw");
        const p = this.point(e);
        if (grip === "draw") this.box = { x: p.x, y: p.y, w: 0, h: 0 };
        if (!this.box) return;

        this.grip = grip;
        this.start = { ...p, box: { ...this.box } };
        // New here: setPointerCapture. Keeps sending this pointer's moves to the
        // stage even when the mouse leaves it mid-drag. Docs: MDN, setPointerCapture()
        this.stage.setPointerCapture(e.pointerId);
        this.show();
    }

    private move(e: PointerEvent): void {
        if (!this.grip || !this.box) return;
        const p = this.point(e);
        const b = this.start.box;
        const dx = p.x - this.start.x;
        const dy = p.y - this.start.y;

        if (this.grip === "move") {
            this.box.x = clamp(b.x + dx, 0, STAGE.W - b.w);
            this.box.y = clamp(b.y + dy, 0, STAGE.H - b.h);
        }
        else {
            // drawing is dragging the far corner of a box that starts at the press
            const grip = this.grip === "draw" ? "se" : this.grip;
            // the corner that doesn't move, and the one under the mouse
            const fixedX = grip.includes("w") ? b.x + b.w : b.x;
            const fixedY = grip.includes("n") ? b.y + b.h : b.y;
            const movedX = (grip.includes("w") ? b.x : b.x + b.w) + dx;
            const movedY = (grip.includes("n") ? b.y : b.y + b.h) + dy;
            this.box = { x: Math.min(fixedX, movedX), y: Math.min(fixedY, movedY), w: Math.abs(movedX - fixedX), h: Math.abs(movedY - fixedY) };
        }
        this.show();
    }

    private up(): void {
        if (!this.grip || !this.box) return;
        const wasDrawing = this.grip === "draw";
        this.grip = null;

        // a click, not a drag: a default box around the point
        if (wasDrawing && this.box.w < CONFIG.MIN && this.box.h < CONFIG.MIN) {
            const half = CONFIG.DEFAULT / 2;
            this.box = { x: clamp(this.box.x - half, 0, STAGE.W - CONFIG.DEFAULT), y: clamp(this.box.y - half, 0, STAGE.H - CONFIG.DEFAULT), w: CONFIG.DEFAULT, h: CONFIG.DEFAULT };
        }
        this.box = { x: Math.round(this.box.x), y: Math.round(this.box.y), w: Math.round(this.box.w), h: Math.round(this.box.h) };
        this.show();
        if (wasDrawing) this.onPlaced();
    }

    private show(): void {
        if (!this.box) return;
        Object.assign(this.el.style, boxStyle(this.box));
        this.el.hidden = false;
    }
}
