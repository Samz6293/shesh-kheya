// The black curtain over the whole stage, for the moments the canvas can't
// fade by itself: between the start screen and a scene, and between scenes.
// Nothing in the game cuts; this is what scene changes use instead.

const CONFIG = { SECONDS: 0.7 };

export default class Fade {
    constructor(private el: HTMLElement) {
        el.style.transitionDuration = `${CONFIG.SECONDS}s`;
    }

    // toBlack true = fade to black, false = fade the picture back in.
    // Resolves when the fade has finished.
    to(toBlack: boolean): Promise<void> {
        this.el.classList.toggle("on", toBlack);
        return new Promise((resolve) => setTimeout(resolve, CONFIG.SECONDS * 1000));
    }
}
