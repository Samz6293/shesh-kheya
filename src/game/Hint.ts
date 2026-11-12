// Key hints at the bottom of the screen, with an optional progress bar
// (used while holding Space to push Kalam's boat).
import { screen } from "../content/text";
import type { ScreenId } from "../types";

export default class Hint {
    private textEl: HTMLElement;
    private subEl: HTMLElement;
    private barEl: HTMLElement;
    private fillEl: HTMLElement;
    private current: ScreenId | null = null;

    constructor(private box: HTMLElement) {
        // safe: index.html has these four elements inside #hint
        this.textEl = box.querySelector(".hint-text") as HTMLElement;
        this.subEl = box.querySelector(".hint-sub") as HTMLElement;
        this.barEl = box.querySelector(".hint-bar") as HTMLElement;
        this.fillEl = box.querySelector(".hint-fill") as HTMLElement;
    }

    show(id: ScreenId, withBar = false): void {
        this.barEl.classList.toggle("on", withBar);
        if (this.current === id) return;
        this.current = id;
        const text = screen(id);
        this.textEl.textContent = text.sy;
        this.subEl.textContent = text.en;
        this.box.classList.add("on");
    }

    // p from 0 to 1
    progress(p: number): void {
        this.fillEl.style.width = `${Math.min(100, p * 100)}%`;
    }

    hide(): void {
        this.current = null;
        this.box.classList.remove("on");
    }
}
