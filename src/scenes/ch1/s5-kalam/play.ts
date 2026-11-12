// Scene 5 (Kalam Majhi), as the player lives it: intro clip, his request,
// the first choice, then either rowing over and pushing his boat free (live)
// or apologising, and the clip for that choice. It reads top to bottom like
// the script because every step is awaited. GAME only.
import { composeFrame } from "../../../shared/compose";
import { depthScale } from "../../../shared/depth";
import { loadPlate, loadSprites } from "../../../shared/assets";
import { MITU_BOAT } from "../../../shared/mituBoat";
import Boat from "../../../game/Boat";
import PushBoat from "../../../game/activities/PushBoat";
import { cues } from "./cues";
import { PUSH_DX, S5, kalamSpriteName, s5Frame, s5SpriteNames } from "./layout";
import type { Game, S5Look } from "../../../types";

const CONFIG = {
    AMBIENCE: { amb_water: 0.6, amb_wind: 0.55 },      // storm coming: more wind
    DECLINE_READ: 1.8,            // seconds, at least, between her apology and rowing away
    DECLINE_SHOW: 3.2,            // seconds the apology is up: about 1.5 s typing + time to read
};

export default async function playKalam(game: Game): Promise<void> {
    // everything loads while the screen is still black
    const [plate, art] = await Promise.all([
        loadPlate(S5.ID),
        loadSprites(S5.ID, s5SpriteNames()),
        game.clips.load(S5.ID, cues),
    ]);

    // live state: Mitu's boat where the intro clip leaves it, Kalam stuck
    const boat = new Boat(game, S5.MITU_START.x, S5.MITU_START.z, S5.HEADING);
    const look: S5Look = {
        t: 0, darkness: 0, flash: 0, fade: 0, rings: boat.rings, oil: game.progress.flags.lampOil, marker: null,
        mitu: { x: boat.x, z: boat.z, sx: boat.facing, roll: 0 },
        kalamX: S5.KALAM.x,
    };
    const push = new PushBoat(game, boat, {
        contact: S5.CONTACT,
        target: S5.KALAM,
        reach: (S5.KALAM_HULL_HALF + MITU_BOAT.HULL_HALF) * depthScale(S5.KALAM.z),
        distance: PUSH_DX,
        // helping costs time: the sky darkens as the push goes on
        onProgress(p) {
            look.darkness = p;
            look.kalamX = S5.KALAM.x + p * PUSH_DX;
        },
    });

    game.loop.setScene({
        update(dt) {
            boat.update(dt);
            push.update(dt);
        },
        draw(ctx) {
            look.t = game.loop.t;
            look.mitu.x = boat.x;
            look.mitu.z = boat.z;
            look.mitu.roll = boat.roll;
            look.marker = push.marker;
            composeFrame(ctx, plate, s5Frame(look, art[boat.spriteName()], art[kalamSpriteName(look.t)]));
        },
    });
    const removeDebug = [
        game.debug.add(() => boat.debugLine()),
        game.debug.add(() => push.debugLine()),
    ];

    // the intro fades in from black by itself, so lift the curtain without waiting
    game.sound.ambience(CONFIG.AMBIENCE);
    game.fade.to(false);
    await game.clips.play(S5.ID, "intro", { fromBlack: true });
    await game.dialogue.hold("s5.intro", 0);

    // first choice
    const pick = await game.choice.ask(["choiceHelp", "choiceGoHome"]);

    if (pick === "choiceHelp") {
        game.progress.setFlags({ helpedKalam1: true });
        await push.run();
        await game.loop.waitSync();
        await game.clips.play(S5.ID, "helped", { keepLastFrame: true });
    }
    else {
        game.progress.setFlags({ helpedKalam1: false });
        // the clip can only start on a sync point (up to 4 s away), so the line
        // gets a fixed time of its own instead of waiting for the clip with it
        game.dialogue.timed("s5.declined", 0, CONFIG.DECLINE_SHOW);
        await game.loop.waitSync(CONFIG.DECLINE_READ);
        await game.clips.play(S5.ID, "declined", { keepLastFrame: true });
    }

    boat.dispose();
    for (const remove of removeDebug) remove();
}
