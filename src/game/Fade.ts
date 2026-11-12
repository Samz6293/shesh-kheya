// The black curtain over the whole stage, for the moments the canvas can't
// fade by itself: between the start screen and a scene, and between scenes.
// Nothing in the game cuts; this is what scene changes use instead.

const CONFIG = { SECONDS: 0.7 };

export default class Fade {
    constructor(private el: HTMLElement) {}

    // toBlack true = fade to black, false = fade the picture back in.
    // seconds: longer for slow story fades (the end of the chapter).
    // Resolves when the fade has finished.
    to(toBlack: boolean, seconds = CONFIG.SECONDS): Promise<void> {
        this.el.style.transitionDuration = `${seconds}s`;
        this.el.classList.toggle("on", toBlack);
        return new Promise((resolve) => setTimeout(resolve, seconds * 1000));
    }
}
