// The lantern oil meter in the bottom-left corner. It appears when Mitu
// fills the lantern (S2) and stays for the rest of the game, so the player
// knows the oil matters (decision D8: it doesn't burn down in Chapter 1).
// An HTML overlay like the hints: no text, only a bar.

export default class OilMeter {
    private fillEl: HTMLElement;

    constructor(private box: HTMLElement) {
        // safe: index.html has .oil-fill inside #oil
        this.fillEl = box.querySelector(".oil-fill") as HTMLElement;
    }

    // fades in or out
    show(isOn: boolean): void {
        this.box.classList.toggle("on", isOn);
    }

    // oil 0..100
    set(oil: number): void {
        this.fillEl.style.height = `${Math.max(0, Math.min(100, oil))}%`;
    }
}
