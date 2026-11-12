// Title cards: one line of large text and its English below, centred on the
// stage (the game title, "Chapter 1 — Dusk", the Chapter 2 card). An HTML
// overlay like the dialogue, so the wording lives in dialogue.json and the
// text stays sharp. It fades in, stays, and fades out; nothing cuts.
import { screen } from "../content/text";
import type Loop from "./Loop";
import type { ScreenId } from "../types";

const CONFIG = {
    FADE: 1.2,                    // seconds to fade in, and again to fade out
    HOLD: 3,                      // seconds fully shown, if the caller doesn't say
};

export default class Card {
    private titleEl: HTMLElement;
    private subEl: HTMLElement;

    constructor(private box: HTMLElement, private loop: Loop) {
        // safe: index.html has both elements inside #card
        this.titleEl = box.querySelector(".card-title") as HTMLElement;
        this.subEl = box.querySelector(".card-sub") as HTMLElement;
        box.style.transitionDuration = `${CONFIG.FADE}s`;
    }

    // waits on the game clock, so a paused game (M9) pauses the card too.
    // isTitle: the game's own title, set larger than a chapter card
    async show(id: ScreenId, hold = CONFIG.HOLD, isTitle = false): Promise<void> {
        const text = screen(id);
        this.box.classList.toggle("title", isTitle);
        this.titleEl.textContent = text.sy;
        this.subEl.textContent = text.en;
        this.box.classList.add("on");
        await this.loop.wait(CONFIG.FADE + hold);
        this.box.classList.remove("on");
        await this.loop.wait(CONFIG.FADE);
    }
}
