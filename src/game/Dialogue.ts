// The dialogue box: an HTML overlay above the canvas, so text is never part
// of a video and a wording fix never needs a re-render. Lines type out letter
// by letter; "hold" lines wait for a click or Enter, "timed" lines leave alone.
import { line, speakerName } from "../content/text";
import type { BeatId, Line } from "../types";

const CONFIG = {
    TYPE_MS: 38,                  // per letter
    TIMED_SECONDS: 3,             // a timed line with no length of its own
};

interface Pending {
    key: string
    promise: Promise<void>
}

export default class Dialogue {
    private box: HTMLElement;
    private nameEl: HTMLElement;
    private lineEl: HTMLElement;
    private subEl: HTMLElement;
    private typing: number | null = null;
    private timer: number | null = null;
    private onAdvance: (() => void) | null = null;
    private pending: Pending | null = null;
    private finishTyping: () => void = () => {};

    // New here: Intl.Segmenter. Splits text into what a reader sees as one letter
    // (grapheme), so Bengali conjuncts like "ন্ধ" never appear half-typed.
    // Docs: MDN, Intl.Segmenter
    private segmenter = new Intl.Segmenter("bn", { granularity: "grapheme" });

    constructor(box: HTMLElement) {
        this.box = box;
        // safe: index.html has these three elements inside #dialogue
        this.nameEl = box.querySelector(".dialogue-name") as HTMLElement;
        this.lineEl = box.querySelector(".dialogue-line") as HTMLElement;
        this.subEl = box.querySelector(".dialogue-sub") as HTMLElement;
    }

    // show a line and wait for the player to move on.
    // If a clip cue already put this line up, wait for that one instead of showing it twice
    hold(beatId: BeatId, index: number): Promise<void> {
        const key = `${beatId}[${index}]`;
        if (this.pending?.key === key) {
            const promise = this.pending.promise;
            this.pending = null;
            return promise;
        }
        return this.startHold(beatId, index);
    }

    // a clip cue shows a hold line while the clip is still playing
    cueHold(beatId: BeatId, index: number): void {
        this.pending = { key: `${beatId}[${index}]`, promise: this.startHold(beatId, index) };
    }

    // show a line that hides by itself (lines spoken inside a clip, ambient lines)
    timed(beatId: BeatId, index: number, seconds = CONFIG.TIMED_SECONDS): Promise<void> {
        this.show(line(beatId, index));
        return new Promise((resolve) => {
            this.timer = window.setTimeout(() => {
                this.timer = null;
                this.hide();
                resolve();
            }, seconds * 1000);
        });
    }

    // drop a timed line now (a skipped clip); hold lines stay
    hideTimed(): void {
        if (this.timer === null) return;
        clearTimeout(this.timer);
        this.timer = null;
        this.hide();
    }

    // "sky": the usual place, above the scene. "centre": the middle of the
    // stage, for narration over black (the opening). Change it while the box is hidden
    setPlace(place: "sky" | "centre"): void {
        this.box.classList.toggle("centre", place === "centre");
    }

    // click or Enter: first finish the typing, the next one moves on
    advance(): void {
        this.onAdvance?.();
    }

    private startHold(beatId: BeatId, index: number): Promise<void> {
        this.show(line(beatId, index));
        return new Promise((resolve) => {
            this.onAdvance = () => {
                if (this.typing !== null) return this.finishTyping();
                this.onAdvance = null;
                this.hide();
                resolve();
            };
        });
    }

    private show(l: Line): void {
        this.stopTimers();
        this.onAdvance = null;
        const name = speakerName(l.speaker);
        this.nameEl.textContent = name;
        this.nameEl.classList.toggle("on", name !== "");
        this.subEl.textContent = l.en;
        this.subEl.classList.remove("on");
        this.lineEl.textContent = "";
        this.box.classList.add("on");

        const letters = [...this.segmenter.segment(l.sy)].map((s) => s.segment);
        let i = 0;
        // the English subtitle fades in once the Sylheti line is complete
        this.finishTyping = () => {
            if (this.typing !== null) clearInterval(this.typing);
            this.typing = null;
            this.lineEl.textContent = l.sy;
            this.subEl.classList.add("on");
        };
        this.typing = window.setInterval(() => {
            this.lineEl.textContent += letters[i++];
            if (i >= letters.length) this.finishTyping();
        }, CONFIG.TYPE_MS);
    }

    private hide(): void {
        this.stopTimers();
        this.box.classList.remove("on");
    }

    private stopTimers(): void {
        if (this.typing !== null) clearInterval(this.typing);
        if (this.timer !== null) clearTimeout(this.timer);
        this.typing = null;
        this.timer = null;
    }
}
