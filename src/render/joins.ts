// The join check, run inside the renderer page. For one join it draws both
// sides the way the player sees them: the game's live frame (loaded plate and
// sprite PNGs) and the clip's frame (decoded from the MP4) with the live
// lights on top, then measures how different the two pictures are.
import { STAGE } from "../shared/depth";
import { composeFrame } from "../shared/compose";
import { drawLights } from "../shared/lights";
import { defaultFlags } from "../shared/flags";
import { loadImage, loadPlate, loadSprites, loadTrack } from "../shared/assets";
import { context, makeCanvas } from "./layers";
import type { JoinResult, SceneRender } from "../types";

// average difference per colour channel, 0..255
function meanDifference(a: CanvasRenderingContext2D, b: CanvasRenderingContext2D): number {
    const da = a.getImageData(0, 0, STAGE.W, STAGE.H).data;
    const db = b.getImageData(0, 0, STAGE.W, STAGE.H).data;
    let sum = 0;
    for (let i = 0; i < da.length; i += 4) {
        sum += Math.abs(da[i] - db[i]) + Math.abs(da[i + 1] - db[i + 1]) + Math.abs(da[i + 2] - db[i + 2]);
    }
    return sum / (STAGE.W * STAGE.H * 3);
}

// clipFrame: the clip's first or last frame as a data URL (extracted by the script)
export async function checkJoin(sceneId: string, scene: SceneRender, index: number, clipFrame: string): Promise<JoinResult> {
    const join = scene.joins[index];
    const oil = defaultFlags().lampOil;
    const [plate, art, track, clipImage] = await Promise.all([
        loadPlate(sceneId),
        loadSprites(sceneId, scene.spriteNames),
        loadTrack(sceneId, join.clip),
        loadImage(clipFrame),
    ]);

    // the game's side
    const live = context(makeCanvas(STAGE.W, STAGE.H));
    composeFrame(live, plate, scene.joinFrame(join, art, oil));

    // the clip's side: video frame + lights from the track, as ClipPlayer draws it
    const clip = context(makeCanvas(STAGE.W, STAGE.H));
    clip.drawImage(clipImage, 0, 0);
    const [x, y, scale, sx, darkness, fade, roll] = track.frames[join.at === "start" ? 0 : track.frames.length - 1];
    drawLights(clip, { x, y, scale, sx, roll }, oil, darkness, 1 - fade);

    return { clip: join.clip, at: join.at, diff: meanDifference(live, clip) };
}
