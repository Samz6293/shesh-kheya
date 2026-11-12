// The game's entry point: builds the shared tools, shows the start screen,
// then plays the scenes in order from wherever the player starts (a new game,
// Continue, or `?scene=` while testing). Each scene is one async function,
// so the whole chapter is a simple loop of awaits.
import { STAGE } from "../shared/depth";
import { screen } from "../content/text";
import Loop from "./Loop";
import ClipPlayer from "./ClipPlayer";
import Dialogue from "./Dialogue";
import Choice from "./Choice";
import Hint from "./Hint";
import Sound from "./Sound";
import Fade from "./Fade";
import Card from "./Card";
import Debug from "./Debug";
import Progress from "./Progress";
import Pointer from "./Pointer";
import OilMeter from "./OilMeter";
import { SAVE, loadSave } from "./save";
import playOpening from "../scenes/ch1/s1-opening/play";
import playHome from "../scenes/ch1/s2-home/play";
import playKalam from "../scenes/ch1/s5-kalam/play";
import type { Game, ScenePlay } from "../types";

const CONFIG = {
    END_FADE: 2,                  // seconds for the sound to fade after the last scene
    FONT: '40px "Tiro Bangla"',
    LANTERN_SCENE: "s2",          // where the oil meter first appears
};

// scene id -> its play function, in story order
const SCENES: [string, ScenePlay][] = [
    ["s1", playOpening],
    ["s2", playHome],
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
    const game = { progress: new Progress() } as Game;
    game.debug = new Debug(el("#hud"));
    game.sound = new Sound();
    game.fade = new Fade(el("#fade"));
    game.dialogue = new Dialogue(el("#dialogue"));
    game.choice = new Choice(el("#choice"));
    game.hint = new Hint(el("#hint"));
    game.clips = new ClipPlayer(game, el("#clips"));
    game.loop = new Loop(ctx, game.clips, game.debug);
    game.card = new Card(el("#card"), game.loop);
    game.pointer = new Pointer(el("#stage"), canvas);
    game.oil = new OilMeter(el("#oil"));

    game.debug.add(() => game.loop.debugLine());
    game.debug.add(() => game.clips.debugLine());
    game.debug.add(() => game.progress.debugLine());
    return game;
}

function listenForKeys(game: Game): void {
    document.addEventListener("keydown", (e) => {
        if (e.repeat) return;
        // Space or Enter moves a waiting line on
        if (e.code === "Enter" || e.code === "Space") game.dialogue.advance();
        if (e.code === "Escape") game.clips.skip();
        if (e.code === "Backquote") game.debug.toggle();
    });
    // and so does a click anywhere on the stage (D19), except on a button (Begin, choices)
    el("#stage").addEventListener("click", (e) => {
        // safe: click targets inside the stage are always elements
        if ((e.target as HTMLElement).closest("button")) return;
        game.dialogue.advance();
    });
}

// where in SCENES a scene id is; -1 if it isn't one (or is CHAPTER_END)
function sceneIndex(id: string | null): number {
    return SCENES.findIndex(([sceneId]) => sceneId === id);
}

// ?scene=s4 starts a new game at that scene, for testing. Unknown ids are ignored
function sceneFromUrl(): number {
    const id = new URLSearchParams(location.search).get("scene");
    const index = sceneIndex(id);
    if (id !== null && index < 0) console.warn(`?scene=${id} is not a scene; starting from the beginning`);
    return Math.max(0, index);
}

// Show the start screen and resolve with the scene to start at, once Begin or
// Continue is clicked. Continue only shows when the save has a scene to resume.
function startScreen(game: Game): Promise<number> {
    const box = el("#start");
    const begin = el<HTMLButtonElement>("#begin");
    const resume = el<HTMLButtonElement>("#continue");
    const saved = sceneIndex(loadSave()?.checkpoint ?? null);
    resume.hidden = saved < 0;
    begin.disabled = false;
    resume.disabled = false;
    box.classList.add("on");

    return new Promise((resolve) => {
        const pick = (isContinue: boolean) => {
            // browsers only allow sound after a click, so it starts right here
            game.sound.start();
            begin.disabled = true;
            resume.disabled = true;
            box.classList.remove("on");
            begin.removeEventListener("click", onBegin);
            resume.removeEventListener("click", onContinue);

            // the save is read again: it could have changed in another tab
            if (isContinue && game.progress.resume()) {
                const index = sceneIndex(game.progress.checkpoint);
                if (index >= 0) return resolve(index);
            }
            const from = sceneFromUrl();
            game.progress.startNew(SCENES[from][0]);
            resolve(from);
        };
        const onBegin = () => pick(false);
        const onContinue = () => pick(true);
        begin.addEventListener("click", onBegin);
        resume.addEventListener("click", onContinue);
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
    el("#continue").textContent = screen("continue").sy;

    // the font must be ready before the first Bengali text is measured and shown
    await document.fonts.load(CONFIG.FONT, title.sy);
    game.loop.start();

    // TODO: after the last scene, show the Chapter 2 card instead of going back to the start screen (M8)
    while (true) {
        const from = await startScreen(game);
        for (const [id, play] of SCENES.slice(from)) {
            // saved as the scene starts, so a reload resumes here
            game.progress.reach(id);
            // the oil meter is up from the lantern activity in S2 to the end
            game.oil.set(game.progress.flags.lampOil);
            game.oil.show(sceneIndex(id) > sceneIndex(CONFIG.LANTERN_SCENE));
            await play(game);
            await game.fade.to(true);
            game.clips.clear();
            game.loop.setScene(null);
        }
        game.progress.reach(SAVE.CHAPTER_END);
        game.oil.show(false);
        game.sound.fadeOut(CONFIG.END_FADE);
        await game.loop.wait(CONFIG.END_FADE);
    }
}

boot();
