// Scene 3 (Rowing and memories), as the player lives it: the `board` clip at
// the ghat, then the player rows (W A S D) out across the haor. Abba's three
// things float there, each with a faint light; rowing alongside and pressing E
// lifts one into the boat and Mitu remembers (her lines wait for the player,
// D19). Rowing on past the right side takes over: the boat glides to where
// `leave` starts, arriving on a sync point, and rows out of the picture.
// GAME only.
import { composeFrame, drawFront } from "../../../shared/compose";
import { loadPlate, loadSprites } from "../../../shared/assets";
import { lerp, smooth } from "../../../shared/math";
import { MEMORY } from "../../../shared/memories";
import Boat from "../../../game/Boat";
import SpeakerLight from "../../../game/SpeakerLight";
import MemoryPickup from "../../../game/activities/MemoryPickup";
import { lineCount } from "../../../content/text";
import { cues } from "./cues";
import { S3, s3Frame, s3SpriteNames, speakerPoint } from "./layout";
import type { BoatAnchor, FrameSprite, Game, S3Look } from "../../../types";

const CONFIG = {
    AMBIENCE: { amb_water: 0.5, amb_crickets: 0.4, amb_wind: 0.15 },     // oar, crickets (script); the azan is a cue
    STEER_HINT: 7,                // seconds the steering hint stays up
    FLUTE: 4.6,                   // seconds of Abba's tune before her line about it
    EXIT_LEAD: 1.4,               // the glide to `leave` takes at least this long (s)
    EXIT_REST: 0.6,               // no new stroke this close to the end of the glide, so she arrives at rest
};

interface Glide {
    x: number
    z: number
    start: number
    end: number
}

export default async function playRowing(game: Game): Promise<void> {
    // everything loads while the screen is still black
    const [plate, art] = await Promise.all([
        loadPlate(S3.ID),
        loadSprites(S3.ID, s3SpriteNames()),
        game.clips.load(S3.ID, cues),
    ]);
    // the memories are back in the water whenever this scene starts (Continue replays it from the top)
    game.progress.setFlags({ foundGamchha: false, foundFlute: false, foundTiffin: false });

    // live state: the boat where `board` leaves it, at the ghat
    const boat = new Boat(game, S3.MOORED.x, S3.MOORED.z, S3.HEADING);
    const look: S3Look = {
        t: 0, fade: 0, lit: 1, rings: boat.rings,
        mitu: { x: boat.x, z: boat.z, sx: boat.facing, roll: 0 },
    };
    const memories = new MemoryPickup(game, boat, S3.MEMORIES, art);
    const speaker = new SpeakerLight();
    const floating: FrameSprite[] = [];
    let glide: Glide | null = null;
    let nextStroke = 0;

    // the end of the scene: the boat slides to where `leave` starts, Mitu still rowing
    const updateGlide = (g: Glide) => {
        const t = game.loop.t, u = smooth(Math.min(1, (t - g.start) / (g.end - g.start)));
        boat.x = lerp(g.x, S3.EXIT.x, u);
        boat.z = lerp(g.z, S3.EXIT.z, u);
        if (t >= nextStroke && t < g.end - CONFIG.EXIT_REST) {
            boat.strokeAnim();
            nextStroke = t + S3.ROW_GAP;
        }
    };

    game.loop.setScene({
        update(dt) {
            boat.update(dt);
            if (glide) updateGlide(glide);
            memories.update();
            const who = game.dialogue.speaker;
            speaker.update(dt, who ? speakerPoint(who, look) : null);
        },
        draw(ctx) {
            look.t = game.loop.t;
            look.mitu.x = boat.x;
            look.mitu.z = boat.z;
            look.mitu.roll = boat.roll;
            floating.length = 0;
            memories.addFloating(floating);
            const frame = s3Frame(look, art[boat.spriteName()], floating, game.progress.flags.lampOil);
            // the reeds and jetty go on last, as they do over the clips
            composeFrame(ctx, plate, frame, true, false);
            memories.drawOver(ctx, frame.boat, plate.backing, look.t, false);
            drawFront(ctx, plate.front, look.t);
            speaker.draw(ctx);
        },
    });
    const removeDebug = [
        game.debug.add(() => boat.debugLine()),
        game.debug.add(() => memories.debugLine()),
    ];
    // over every clip: the memories (floating and in the boat) and the swaying reeds
    const overlay = (ctx: CanvasRenderingContext2D, at: BoatAnchor | null) => {
        memories.drawOver(ctx, at, plate.backing, game.loop.t, true);
        drawFront(ctx, plate.front, game.loop.t);
    };

    // Mitu boards at the ghat. The clip starts on a sync point, so the bob is
    // in step at its end; the curtain lifts over it (the clip itself has no fade)
    game.sound.ambience(CONFIG.AMBIENCE);
    await game.loop.waitSync();
    const boarding = game.clips.play(S3.ID, "board", { overlay, fromBlack: true });
    game.fade.to(false);
    await boarding;

    // activity 4 and the memories: row anywhere; each find is lifted in and remembered
    boat.rowing = true;
    game.hint.show("steerHint");
    game.loop.wait(CONFIG.STEER_HINT).then(() => game.hint.hide("steerHint"));
    while (true) {
        await game.loop.waitFor(() => memories.chosen !== null || boat.x >= S3.EXIT_FROM);
        const id = memories.chosen;
        if (!id) break;
        boat.rowing = false;
        await memories.collect(id);
        // the flute plays Abba's tune before she speaks
        if (id === "flute") {
            game.sound.play("sfx_flute_memory");
            await game.loop.wait(CONFIG.FLUTE);
        }
        const beat = MEMORY.BEAT[id];
        for (let i = 0; i < lineCount(beat); i++) await game.dialogue.hold(beat, i);
        boat.rowing = true;
    }

    // on to Rahim: glide to where `leave` starts, arriving exactly on a sync point
    boat.rowing = false;
    boat.stop();
    game.hint.hide();
    glide = { x: boat.x, z: boat.z, start: game.loop.t, end: game.loop.t + game.loop.untilSync(CONFIG.EXIT_LEAD) };
    await game.loop.waitSync(CONFIG.EXIT_LEAD);
    glide = null;
    await game.clips.play(S3.ID, "leave", { overlay, keepLastFrame: true });

    boat.dispose();
    memories.dispose();
    for (const remove of removeDebug) remove();
}
