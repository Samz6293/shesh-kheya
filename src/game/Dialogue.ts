// The dialogue box: an HTML overlay above the canvas, so text is never part
// of a video and a wording fix never needs a re-render. The same box and the
// same rule in every scene (D19): a line types out letter by letter, then
// waits; a small mark pulses in the box's bottom-right corner until the player
// clicks anywhere or presses Space or Enter (main.ts). Nothing leaves by
// itself, and lines are never said inside a clip: scenes say them between clips.
import { line, speakerName } from "../content/text";
import type { BeatId, Line } from "../types";

const CONFIG = {
    TYPE_MS: 38,                  // per letter
};

export default class Dialogue {
    private box: HTMLElement;
    private nameEl: HTMLElement;
    private lineEl: HTMLElement;
    private subEl: HTMLElement;
    private nextEl: HTMLElement;
    private speakerId: string | null = null;
    private typing: number | null = null;
    private onAdvance: (() => void) | null = null;
    private finishTyping: () => void = () => {};

    // New here: Intl.Segmenter. Splits text into what a reader sees as one letter
    // (grapheme), so Bengali conjuncts like "ন্ধ" never appear half-typed.
    // Docs: MDN, Intl.Segmenter
    private segmenter = new Intl.Segmenter("bn", { granularity: "grapheme" });

    constructor(box: HTMLElement) {
        this.box = box;
        // safe: index.html has these four elements inside #dialogue
        this.nameEl = box.querySelector(".dialogue-name") as HTMLElement;
        this.lineEl = box.querySelector(".dialogue-line") as HTMLElement;
        this.subEl = box.querySelector(".dialogue-sub") as HTMLElement;
        this.nextEl = box.querySelector(".dialogue-next") as HTMLElement;
    }

    // who is talking right now (a speaker id from dialogue.json), or null.
    // Scenes use it to light up the speaker in the picture (game/SpeakerLight.ts)
    get speaker(): string | null {
        return this.speakerId;
    }

    // show a line and resolve when the player moves on
    hold(beatId: BeatId, index: number): Promise<void> {
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

    // "sky": the usual place, above the scene. "centre": the middle of the
    // stage, for narration over black (the opening). Change it while the box is hidden
    setPlace(place: "sky" | "centre"): void {
        this.box.classList.toggle("centre", place === "centre");
    }

    // a click, Space or Enter: first finish the typing, the next one moves on
    advance(): void {
        this.onAdvance?.();
    }

    private show(l: Line): void {
        this.stopTyping();
        this.onAdvance = null;
        this.speakerId = l.speaker;
        this.nextEl.classList.remove("on");
        const name = speakerName(l.speaker);
        this.nameEl.textContent = name;
        this.nameEl.classList.toggle("on", name !== "");
        this.subEl.textContent = l.en;
        this.subEl.classList.remove("on");
        this.lineEl.textContent = "";
        this.box.classList.add("on");

        const letters = [...this.segmenter.segment(l.sy)].map((s) => s.segment);
        let i = 0;
        // the English subtitle and the "go on" mark come once the Sylheti line is complete
        this.finishTyping = () => {
            this.stopTyping();
            this.lineEl.textContent = l.sy;
            this.subEl.classList.add("on");
            this.nextEl.classList.add("on");
        };
        this.typing = window.setInterval(() => {
            this.lineEl.textContent += letters[i++];
            if (i >= letters.length) this.finishTyping();
        }, CONFIG.TYPE_MS);
    }

    private hide(): void {
        this.stopTyping();
        this.speakerId = null;
        this.nextEl.classList.remove("on");
        this.box.classList.remove("on");
    }

    private stopTyping(): void {
        if (this.typing !== null) clearInterval(this.typing);
        this.typing = null;
    }
}
