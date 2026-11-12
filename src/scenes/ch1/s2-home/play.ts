// Scene 2 (Home), as the player lives it. Short clips carry everything the
// player watches; between them the live scene holds still on a named state
// (layout.ts STATES) while a line waits for the player. It reads top to
// bottom like the script because every step is awaited. GAME only.
import { composeFrame, drawFront } from "../../../shared/compose";
import { STAGE } from "../../../shared/depth";
import { loadPlate, loadSprites, loadStills } from "../../../shared/assets";
import BabyKick from "../../../game/activities/BabyKick";
import PaanMaking from "../../../game/activities/PaanMaking";
import LanternOil from "../../../game/activities/LanternOil";
import SpeakerLight from "../../../game/SpeakerLight";
import { cues } from "./cues";
import { DADI_POSE, S2, STATES, STILL, bellyPoint, s2Frame, s2SpriteNames, speakerPoint, stateArt, stateLook } from "./layout";
import type { Game, S2Look, S2State } from "../../../types";

const CONFIG = {
    AMBIENCE: { amb_water: 0.4, amb_crickets: 0.35, amb_wind: 0.15 },     // crickets, light wind (script)
    CLOSEUP_FADE: 0.8,            // seconds to fade a close-up in or out over the scene
    BEAT: 0.5,                    // a breath between a line and the clip that follows it
};

// what a close-up activity offers the scene
interface Closeup {
    update(dt: number): void
    draw(ctx: CanvasRenderingContext2D): void
}

export default async function playHome(game: Game): Promise<void> {
    // everything loads while the screen is still black
    const [plate, sprites, stills] = await Promise.all([
        loadPlate(S2.ID),
        loadSprites(S2.ID, s2SpriteNames()),
        loadStills(S2.ID, Object.values(STILL)),
        game.clips.load(S2.ID, cues),
    ]);
    const kick = new BabyKick(game, bellyPoint(), stills[STILL.HAND_ICON]);
    const paan = new PaanMaking(game, stills);
    const lantern = new LanternOil(game, stills);
    const speaker = new SpeakerLight();

    // the live picture shows one state at a time; clips move between them
    let state: S2State = STATES.arrived;
    let art = stateArt(state, sprites);
    const look = stateLook(state, 0, { t: 0, fade: 0, mituX: 0, mituY: 0, box: state.box, lantern: state.lantern, bottle: state.bottle, ring: null } as S2Look);
    const setState = (name: string) => {
        state = STATES[name];
        art = stateArt(state, sprites);
    };

    // a close-up fades in over the wide shot: while it is part-way, it is
    // drawn aside and blended in whole, so its own pieces don't show through
    let closeup: Closeup | null = null;
    let closeupAlpha = 0, closeupTarget = 0;
    const scratch = document.createElement("canvas");
    scratch.width = STAGE.W;
    scratch.height = STAGE.H;
    // safe: a 2D context is always available on a new canvas
    const sctx = scratch.getContext("2d")!;

    game.loop.setScene({
        update(dt) {
            kick.update();
            closeup?.update(dt);
            const step = dt / CONFIG.CLOSEUP_FADE;
            closeupAlpha = closeupTarget > closeupAlpha ? Math.min(closeupTarget, closeupAlpha + step) : Math.max(closeupTarget, closeupAlpha - step);
            // the speaker's light: only in the wide shot
            const who = game.dialogue.speaker;
            speaker.update(dt, who && closeupAlpha === 0 ? speakerPoint(who, state) : null);
        },
        draw(ctx) {
            if (closeupAlpha < 1) {
                composeFrame(ctx, plate, s2Frame(stateLook(state, game.loop.t, look), DADI_POSE[state.dadi], art));
                speaker.draw(ctx);
                kick.draw(ctx);
            }
            if (!closeup || closeupAlpha <= 0) return;
            if (closeupAlpha >= 1) return closeup.draw(ctx);
            closeup.draw(sctx);
            ctx.globalAlpha = closeupAlpha;
            ctx.drawImage(scratch, 0, 0);
            ctx.globalAlpha = 1;
        },
    });
    const removeDebug = [
        game.debug.add(() => paan.debugLine()),
        game.debug.add(() => lantern.debugLine()),
    ];
    const showCloseup = async (next: Closeup | null) => {
        if (next) closeup = next;
        closeupTarget = next ? 1 : 0;
        await game.loop.waitFor(() => closeupAlpha === closeupTarget);
    };
    // a clip with the reeds swaying live over it; afterwards the live scene shows its end state
    const overlay = (ctx: CanvasRenderingContext2D) => drawFront(ctx, plate.front, game.loop.t);
    const clip = async (name: string, endState: string, fromBlack = false) => {
        await game.clips.play(S2.ID, name, { overlay, fromBlack });
        setState(endState);
    };
    const line = async (beat: Parameters<Game["dialogue"]["hold"]>[0], index: number) => {
        await game.dialogue.hold(beat, index);
        await game.loop.wait(CONFIG.BEAT);
    };

    // home at dusk; Mitu comes out to Amma
    game.sound.ambience(CONFIG.AMBIENCE);
    game.fade.to(false);
    await clip("arrive", "arrived", true);
    await line("s2.intro", 0);
    await line("s2.intro", 1);

    // activity 1: the baby kicks; Amma calls Mitu; the player touches; Mitu feels it
    await clip("kick", "kicked");
    await game.dialogue.hold("a1.babyKick.prompt", 0);
    await kick.run();
    await clip("touch", "touching");
    await line("a1.babyKick.after", 0);
    await line("a1.babyKick.after", 1);

    // activity 2: Dadi pulls out her paan box; Mitu sits by her; the close-up
    await clip("paanbox", "byDadi");
    await game.dialogue.hold("a2.paan.prompt", 0);
    await showCloseup(paan);
    await paan.run();
    setState("afterPaan");          // Dadi puts the box away while the close-up covers the screen
    await showCloseup(null);

    // activity 3: Dadi sends her to the ghat, hands her the lantern; the close-up
    await line("a3.lantern.prompt", 0);
    await clip("handout", "holding");
    await line("a3.lantern.prompt", 1);
    await clip("take", "ready");
    await showCloseup(lantern);
    game.oil.show(true);
    const oil = await lantern.run();
    game.progress.setFlags({ lampOil: oil });
    await showCloseup(null);

    // Mitu takes the lantern and walks off to the ghat; the picture fades to black
    await game.clips.play(S2.ID, "leave", { overlay, keepLastFrame: true });
    for (const remove of removeDebug) remove();
}
