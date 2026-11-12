// The list of scenes the renderer knows. Each entry gathers what a scene's
// paint.ts, clips.ts and layout.ts offer, in the shape the renderer page
// expects, so adding a scene is one more entry here.
import paintS5Plate from "../scenes/ch1/s5-kalam/paintPlate";
import { spriteJobs as s5SpriteJobs } from "../scenes/ch1/s5-kalam/paint";
import { clipFrame as s5ClipFrame } from "../scenes/ch1/s5-kalam/clips";
import { JOINS as S5_JOINS, S5, s5JoinFrame, s5SpriteNames } from "../scenes/ch1/s5-kalam/layout";
import type { SceneRender } from "../types";

export const SCENES: Record<string, SceneRender> = {
    [S5.ID]: {
        paintPlate: paintS5Plate,
        spriteJobs: s5SpriteJobs,
        clips: S5.CLIP,
        clipFrame: s5ClipFrame,
        spriteNames: s5SpriteNames(),
        joins: S5_JOINS,
        joinFrame: s5JoinFrame,
    },
};
