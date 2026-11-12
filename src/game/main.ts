// The game's entry point: builds the shared tools, shows the start screen,
// then plays the scenes in order. Each scene is one async function, so the
// whole chapter is a simple loop of awaits.
import { STAGE } from "../shared/depth";
import { defaultFlags } from "../shared/flags";
import { screen } from "../content/text";
import Loop from "./Loop";
import ClipPlayer from "./ClipPlayer";
import Dialogue from "./Dialogue";
import Choice from "./Choice";
import Hint from "./Hint";
import Sound from "./Sound";
import Fade from "./Fade";
import Debug from "./Debug";
import playKalam from "../scenes/ch1/s5-kalam/play";
import type { Game, ScenePlay } from "../types";

const CONFIG = {
    END_FADE: 2,                  // seconds for the sound to fade after the last scene
    FONT: '40px "Tiro Bangla"',
};

// scene id -> its play function, in story order
const SCENES: [string, ScenePlay][] = [
    ["s5", playKalam],
];

// every element the game needs from index.html; a missing one is a bug in the page
function el<T extends HTMLElement>(selector: string): T {
    const found = document.querySelector<T>(selector);
    if (!found) throw new Error(`index.html is missing ${selector}`);
    return found;
}

function buildGame(): Game {
    const canvas = el<HTMLCanvasElement>("#game");
    canvas.width = STAGE.W;
    canvas.height = STAGE.H;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas 2D is not available");

    // the tools refer to each other through `game`, so make the object first
    // and fill it in. (safe cast: every field is set before boot() uses it)
    const game = { flags: defaultFlags() } as Game;
    game.debug = new Debug(el("#hud"));
    game.sound = new Sound();
    game.fade = new Fade(el("#fade"));
    game.dialogue = new Dialogue(el("#dialogue"));
    game.choice = new Choice(el("#choice"));
    game.hint = new Hint(el("#hint"));
    game.clips = new ClipPlayer(game, el("#clips"));
    game.loop = new Loop(ctx, game.clips, game.debug);

    game.debug.add(() => game.loop.debugLine());
    game.debug.add(() => game.clips.debugLine());
    game.debug.add(() => `flags     ${JSON.stringify(game.flags)}`);
    return game;
}

function listenForKeys(game: Game): void {
    document.addEventListener("keydown", (e) => {
        if (e.repeat) return;
        if (e.code === "Enter") game.dialogue.advance();
        if (e.code === "Escape") game.clips.skip();
        if (e.code === "Backquote") game.debug.toggle();
    });
    // a click anywhere on the stage moves a line on, except clicks on buttons
    el("#stage").addEventListener("click", (e) => {
        // safe: click targets inside the stage are always elements
        if ((e.target as HTMLElement).closest("button")) return;
        game.dialogue.advance();
    });
}

// show the start screen and resolve when Begin is clicked
function startScreen(game: Game): Promise<void> {
    const box = el("#start");
    const begin = el<HTMLButtonElement>("#begin");
    box.classList.add("on");
    begin.disabled = false;
    return new Promise((resolve) => {
        begin.addEventListener("click", () => {
            // browsers only allow sound after a click, so it starts right here
            game.sound.start();
            begin.disabled = true;
            box.classList.remove("on");
            resolve();
        }, { once: true });
    });
}

async function boot(): Promise<void> {
    const game = buildGame();
    listenForKeys(game);

    const title = screen("gameTitle");
    document.title = `${title.sy} — ${title.en}`;
    el("#start .screen-title").textContent = title.sy;
    el("#start .screen-sub").textContent = title.en;
    el("#begin").textContent = screen("begin").sy;

    // the font must be ready before the first Bengali text is measured and shown
    await document.fonts.load(CONFIG.FONT, title.sy);
    game.loop.start();

    // TODO: after the last scene, show the Chapter 2 card instead of going back to the start screen (M8)
    while (true) {
        await startScreen(game);
        game.flags = defaultFlags();
        for (const [, play] of SCENES) {
            await play(game);
            await game.fade.to(true);
            game.clips.clear();
            game.loop.setScene(null);
        }
        game.sound.fadeOut(CONFIG.END_FADE);
        await game.loop.wait(CONFIG.END_FADE);
    }
}

boot();
