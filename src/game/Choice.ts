// The choice menu: two or more buttons in the sky. ask() returns a Promise
// that resolves with the id of the option the player picked, by click or by
// number key, so play.ts can write `const pick = await game.choice.ask([...])`.
import { screen } from "../content/text";
import type { ScreenId } from "../types";

export default class Choice {
    constructor(private box: HTMLElement) {}

    ask<Id extends ScreenId>(ids: Id[]): Promise<Id> {
        this.box.replaceChildren();
        return new Promise((resolve) => {
            const pick = (id: Id) => {
                document.removeEventListener("keydown", onKey);
                this.box.classList.remove("on");
                resolve(id);
            };
            // keys 1, 2, ... pick an option
            const onKey = (e: KeyboardEvent) => {
                const id = ids[Number(e.key) - 1];
                if (id) pick(id);
            };

            ids.forEach((id, i) => {
                const text = screen(id);
                const button = document.createElement("button");
                const sub = document.createElement("small");
                button.textContent = `${i + 1}. ${text.sy}`;
                sub.textContent = text.en;
                button.appendChild(sub);
                button.addEventListener("click", () => pick(id));
                this.box.appendChild(button);
            });
            document.addEventListener("keydown", onKey);
            this.box.classList.add("on");
        });
    }
}
