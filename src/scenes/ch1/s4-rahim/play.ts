// Scene 4 (Rahim Chacha), as the player lives it: Mitu rows up to Rahim, who
// is struggling with his net; they talk; she takes hold of the line and the
// player pulls in time (Space), Rahim telling what he saw of Abba as the net
// comes up; a big aair is in it; Rahim gives it to her and the player drags it
// into her boat; he looks at the sky and sends her home; she turns and rows
// off. Between clips the live scene holds a named state (layout.ts STATES)
// while lines wait for the player (D19). GAME only.
import { composeFrame, drawFront } from "../../../shared/compose";
import { depthScale, depthY } from "../../../shared/depth";
import { loadPlate, loadSprites } from "../../../shared/assets";
import { FISH, fishFrame, fishSpriteName } from "../../../shared/fish";
import { MITU_BOAT } from "../../../shared/mituBoat";
import Cargo from "../../../game/Cargo";
import SpeakerLight from "../../../game/SpeakerLight";
import NetPull from "../../../game/activities/NetPull";
import FishLift from "../../../game/activities/FishLift";
import { lineCount } from "../../../content/text";
import { cues } from "./cues";
import { S4, STATES, fishInNet, haulFrame, haulingGirl, netArtName, s4Frame, s4SpriteNames, speakerPoint, stateLook, stateRahim } from "./layout";
import type { BoatAnchor, FrameSprite, Game, GirlOnFoot, S4Look, S4State } from "../../../types";

const CONFIG = {
    AMBIENCE: { amb_water: 0.5, amb_crickets: 0.45, amb_wind: 0.28 },    // the wind getting up
    BEAT: 0.4,                    // a breath between a line and what follows it
    NET_LINES: ["a5.net.pull1", "a5.net.pull2", "a5.net.pull3"] as const,
    BOAT_DROP: { ABOVE: 90, BELOW: 20 },    // px at scale 1: how far above and below the waterline a fish dropped on her boat counts
};

export default async function playRahim(game: Game): Promise<void> {
    // everything loads while the screen is still black
    const [plate, art] = await Promise.all([
        loadPlate(S4.ID),
        loadSprites(S4.ID, s4SpriteNames()),
        game.clips.load(S4.ID, cues),
    ]);
    const cargo = new Cargo(game, art);
    const speaker = new SpeakerLight();

    // the live picture shows one state at a time; clips move between them
    let state: S4State = STATES.arrived;
    const look: S4Look = stateLook(state, 0, { t: 0, fade: 0, rings: [], mitu: { x: 0, z: 0, sx: 1, roll: 0 }, net: 0, rahimHolds: true, mituPull: null });
    const netPull = new NetPull(game, {
        levels: S4.NET.LEVELS,
        bar: S4.TIMING_BAR,
        say: (n) => game.dialogue.hold(CONFIG.NET_LINES[n], 0),
    });
    const fishLift = new FishLift(game, {
        inNet: () => fishInNet(S4.NET.UP, game.loop.t),
        isOverBoat(x, y) {
            const scale = depthScale(S4.MITU.z), waterY = depthY(S4.MITU.z);
            return Math.abs(x - S4.MITU.x) < MITU_BOAT.HULL_HALF * scale && y > waterY - CONFIG.BOAT_DROP.ABOVE * scale && y < waterY + CONFIG.BOAT_DROP.BELOW * scale;
        },
    });
    let isPulling = false;        // the net pull is on: the net and Mitu follow it

    // the fish while the player drags it (in the net it is part of the net's picture)
    const fishSprite: FrameSprite = { def: FISH.SPRITE, art: art[fishSpriteName(0)], x: 0, z: S4.MITU.z + 0.02, sx: 1, roll: 0, y: 0, scale: depthScale(S4.NET.z) };
    const others: FrameSprite[] = [];
    // Mitu on her feet hauling, when she is (null: she is at her oar)
    let girl: GirlOnFoot | null = null;
    let girlArt = "girl_haul_0";

    game.loop.setScene({
        update(dt) {
            netPull.update(dt);
            fishLift.update();
            const who = game.dialogue.speaker;
            speaker.update(dt, who ? speakerPoint(who, look, stateRahim(state, game.loop.t).pose, girl) : null);
        },
        draw(ctx) {
            const t = game.loop.t;
            stateLook(state, t, look);
            // the net's picture shows whole steps; a slip shows once it has lost one
            if (isPulling) look.net = Math.floor(netPull.level) * S4.NET.LEVEL;
            // Mitu hauling: her heave as the sprite nearest to it; the line goes taut with it
            girl = null;
            if (look.mituPull !== null) {
                const frame = haulFrame(isPulling ? netPull.pull : look.mituPull);
                look.mituPull = frame / (S4.HAUL_FRAMES - 1);
                girl = haulingGirl(look.mituPull, t);
                girlArt = `girl_haul_${frame}`;
            }
            const rahim = stateRahim(state, t);
            // the fish thrashes in the net until the player lifts it out
            others.length = 0;
            const isFishInNet = state.fish && !fishLift.isLoose;
            if (state.fish && fishLift.isLoose) {
                fishSprite.art = art[fishSpriteName(fishFrame(t))];
                fishSprite.x = fishLift.at[0];
                fishSprite.y = fishLift.at[1];
                others.push(fishSprite);
            }
            const net = look.net >= 0 ? art[netArtName(look.net, isFishInNet ? fishFrame(t) : null)] : null;
            const frame = s4Frame(look, { mitu: art[state.mitu], rahim: art[rahim.name], net, girl: girl ? art[girlArt] : null }, rahim.pose, girl, others, game.progress.flags.lampOil);
            // the reeds go on last, as they do over the clips
            composeFrame(ctx, plate, frame, true, false);
            cargo.draw(ctx, frame.boat, plate.backing, t);
            drawFront(ctx, plate.front, t);
            netPull.draw(ctx);
            fishLift.draw(ctx);
            speaker.draw(ctx);
        },
    });
    const removeDebug = [game.debug.add(() => netPull.debugLine())];
    // over every clip: what lies in her boat, and the swaying reeds
    const overlay = (ctx: CanvasRenderingContext2D, at: BoatAnchor | null) => {
        cargo.draw(ctx, at, plate.backing, game.loop.t);
        drawFront(ctx, plate.front, game.loop.t);
    };
    // a clip from a sync point; afterwards the live scene shows its end state
    const clip = async (name: string, endState: string) => {
        await game.loop.waitSync();
        await game.clips.play(S4.ID, name, { overlay });
        state = STATES[endState];
    };
    const lines = async (beat: "s4.intro" | "s4.fish" | "s4.leave") => {
        for (let i = 0; i < lineCount(beat); i++) await game.dialogue.hold(beat, i);
        await game.loop.wait(CONFIG.BEAT);
    };

    // Mitu rows up to Rahim; the curtain lifts over the clip (it has no fade of its own)
    game.sound.ambience(CONFIG.AMBIENCE);
    await game.loop.waitSync();
    const arriving = game.clips.play(S4.ID, "meet", { overlay, fromBlack: true });
    game.fade.to(false);
    await arriving;
    state = STATES.arrived;
    await lines("s4.intro");

    // activity 5: she takes the line; the net comes up step by step, Rahim talking
    await clip("grab", "holding");
    isPulling = true;
    await netPull.run();
    isPulling = false;
    state = STATES.pulled;

    // the big fish; Rahim gives it to her; the player lifts it into her boat
    await clip("fish", "netUp");
    await lines("s4.fish");
    await fishLift.run();
    cargo.hasFish = true;
    state = STATES.emptyNet;

    // Rahim looks at the sky and sends her home; she turns and rows away
    await clip("look", "done");
    await lines("s4.leave");
    await game.loop.waitSync();
    await game.clips.play(S4.ID, "leave", { overlay, keepLastFrame: true });

    for (const remove of removeDebug) remove();
}
