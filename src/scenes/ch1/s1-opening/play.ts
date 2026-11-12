// Scene 1 (the opening): black screen and water only, then grown-up Mitu's
// narration, then the game title and the chapter card. No video and no
// plate: everything is overlay text over the black canvas, and sound.
// It only waits and shows text, so it needs none of the other scene files.
import type { Game } from "../../../types";

const CONFIG = {
    AMBIENCE: { amb_water: 0.6 },             // water alone (04-audio.md)
    WATER_ALONE: 3.5,             // seconds of black and water before any text
    NARRATION: 9,                 // seconds the line is up: about 2.7 s typing + time to read both languages
    LINE_FADE: 0.4,               // the dialogue box's fade out (--fade in main.css)
    GAP: 1.2,                     // seconds of black between narration, title and chapter card
    TITLE_HOLD: 3,
    CHAPTER_HOLD: 2.5,
};

export default async function playOpening(game: Game): Promise<void> {
    // the canvas draws black when no scene is set, so lifting the curtain changes
    // nothing on screen; it lets the narration (which sits under it) show
    game.sound.ambience(CONFIG.AMBIENCE);
    game.fade.to(false);
    await game.loop.wait(CONFIG.WATER_ALONE);

    game.dialogue.setPlace("centre");
    await game.dialogue.timed("s1.opening", 0, CONFIG.NARRATION);
    await game.loop.wait(CONFIG.LINE_FADE);
    game.dialogue.setPlace("sky");
    await game.loop.wait(CONFIG.GAP - CONFIG.LINE_FADE);

    await game.card.show("gameTitle", CONFIG.TITLE_HOLD, true);
    await game.loop.wait(CONFIG.GAP);
    await game.card.show("chapterTitle", CONFIG.CHAPTER_HOLD);
}
