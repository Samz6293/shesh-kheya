// Scene 5 (Kalam Majhi), as the player lives it: intro clip, his request,
// the first choice, then either rowing over and pushing his boat free (live),
// his thanks and a farewell nod, or apologising and rowing on. Lines are said
// live between clips and wait for the player (D19), with a light over the
// speaker. It reads top to bottom like the script because every step is awaited.
// What lies in her boat (Rahim's fish, the memories she found) is drawn live
// over clips and live frames, under the reeds (M7). GAME only.
import { composeFrame, drawFront } from "../../../shared/compose";
import { depthScale } from "../../../shared/depth";
import { loadPlate, loadSprites } from "../../../shared/assets";
import { MITU_BOAT } from "../../../shared/mituBoat";
import Boat from "../../../game/Boat";
import Cargo from "../../../game/Cargo";
import SpeakerLight from "../../../game/SpeakerLight";
import { lineCount } from "../../../content/text";
import PushBoat from "../../../game/activities/PushBoat";
import { cues } from "./cues";
import { MITU_AFTER_HELP, PUSH_DX, S5, kalamSpriteName, s5Frame, s5SpriteNames, speakerPoint } from "./layout";
import type { BoatAnchor, Game, S5Look } from "../../../types";

const CONFIG = {
    AMBIENCE: { amb_water: 0.6, amb_wind: 0.55 },      // storm coming: more wind
    REST_SPRITE: "kalam_0",       // Kalam standing still, once his boat is free
    END_FADE: 1.4,                // seconds for the curtain to close on the scene
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
    const speaker = new SpeakerLight();
    // Rahim's fish is in every player's boat by now (S4); the memories only if found
    const cargo = new Cargo(game, art);
    cargo.hasFish = true;
    let isKalamPushing = true;    // he stops once his boat is free
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
            const who = game.dialogue.speaker;
            speaker.update(dt, who ? speakerPoint(who, look) : null);
        },
        draw(ctx) {
            look.t = game.loop.t;
            look.mitu.x = boat.x;
            look.mitu.z = boat.z;
            look.mitu.roll = boat.roll;
            look.marker = push.marker;
            const frame = s5Frame(look, art[boat.spriteName()], art[isKalamPushing ? kalamSpriteName(look.t) : CONFIG.REST_SPRITE]);
            // the reeds go on last, as they do over the clips
            composeFrame(ctx, plate, frame, true, false);
            cargo.draw(ctx, frame.boat, plate.backing, look.t);
            drawFront(ctx, plate.front, look.t);
            speaker.draw(ctx);
        },
    });
    const removeDebug = [
        game.debug.add(() => boat.debugLine()),
        game.debug.add(() => push.debugLine()),
    ];

    // over every clip: what lies in her boat, and the swaying reeds
    const overlay = (ctx: CanvasRenderingContext2D, at: BoatAnchor | null) => {
        cargo.draw(ctx, at, plate.backing, game.loop.t);
        drawFront(ctx, plate.front, game.loop.t);
    };

    // the intro starts on a sync point (while the screen is still black), so the
    // boats' bob and Kalam's pushing are in step at its end; the curtain lifts over it
    game.sound.ambience(CONFIG.AMBIENCE);
    await game.loop.waitSync();
    const arriving = game.clips.play(S5.ID, "intro", { overlay, fromBlack: true });
    game.fade.to(false);
    await arriving;
    await game.dialogue.hold("s5.intro", 0);

    // first choice
    const pick = await game.choice.ask(["choiceHelp", "choiceGoHome"]);

    if (pick === "choiceHelp") {
        game.progress.setFlags({ helpedKalam1: true });
        await push.run();
        await game.loop.waitSync();
        await game.clips.play(S5.ID, "helped", { overlay });
        // his boat is free: he rests, Mitu's boat where it drifted to, and they talk
        isKalamPushing = false;
        look.kalamX = S5.KALAM_FREE;
        boat.x = MITU_AFTER_HELP;
        for (let i = 0; i < lineCount("s5.helped"); i++) await game.dialogue.hold("s5.helped", i);
        await game.loop.waitSync();
        await game.clips.play(S5.ID, "farewell", { overlay, keepLastFrame: true });
    }
    else {
        game.progress.setFlags({ helpedKalam1: false });
        await game.dialogue.hold("s5.declined", 0);
        await game.loop.waitSync();
        await game.clips.play(S5.ID, "declined", { overlay, keepLastFrame: true });
    }
    await game.fade.to(true, CONFIG.END_FADE);

    boat.dispose();
    for (const remove of removeDebug) remove();
}
