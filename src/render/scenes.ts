// The list of scenes the renderer knows. Each entry gathers what a scene's
// paint.ts, clips.ts and layout.ts offer, in the shape the renderer page
// expects, so adding a scene is one more entry here.
import paintS2Plate from "../scenes/ch1/s2-home/paintPlate";
import { spriteJobs as s2SpriteJobs } from "../scenes/ch1/s2-home/paint";
import { stillJobs as s2StillJobs } from "../scenes/ch1/s2-home/paintCloseups";
import { clipFrame as s2ClipFrame } from "../scenes/ch1/s2-home/clips";
import { JOINS as S2_JOINS, S2, s2JoinFrame, s2SpriteNames } from "../scenes/ch1/s2-home/layout";
import paintS3Plate from "../scenes/ch1/s3-rowing/paintPlate";
import { spriteJobs as s3SpriteJobs } from "../scenes/ch1/s3-rowing/paint";
import { clipFrame as s3ClipFrame } from "../scenes/ch1/s3-rowing/clips";
import { JOINS as S3_JOINS, S3, s3JoinFrame, s3SpriteNames } from "../scenes/ch1/s3-rowing/layout";
import paintS4Plate from "../scenes/ch1/s4-rahim/paintPlate";
import { spriteJobs as s4SpriteJobs } from "../scenes/ch1/s4-rahim/paint";
import { clipFrame as s4ClipFrame } from "../scenes/ch1/s4-rahim/clips";
import { JOINS as S4_JOINS, S4, s4JoinFrame, s4SpriteNames } from "../scenes/ch1/s4-rahim/layout";
import paintS5Plate from "../scenes/ch1/s5-kalam/paintPlate";
import { spriteJobs as s5SpriteJobs } from "../scenes/ch1/s5-kalam/paint";
import { clipFrame as s5ClipFrame } from "../scenes/ch1/s5-kalam/clips";
import { JOINS as S5_JOINS, S5, s5JoinFrame, s5SpriteNames } from "../scenes/ch1/s5-kalam/layout";
import type { SceneRender } from "../types";

export const SCENES: Record<string, SceneRender> = {
    [S2.ID]: {
        paintPlate: paintS2Plate,
        spriteJobs: s2SpriteJobs,
        stills: s2StillJobs,
        clips: S2.CLIP,
        clipFrame: s2ClipFrame,
        spriteNames: s2SpriteNames(),
        joins: S2_JOINS,
        joinFrame: s2JoinFrame,
        isFrontLive: true,
    },
    [S3.ID]: {
        paintPlate: paintS3Plate,
        spriteJobs: s3SpriteJobs,
        clips: S3.CLIP,
        clipFrame: s3ClipFrame,
        spriteNames: s3SpriteNames(),
        joins: S3_JOINS,
        joinFrame: s3JoinFrame,
        isFrontLive: true,
    },
    [S4.ID]: {
        paintPlate: paintS4Plate,
        spriteJobs: s4SpriteJobs,
        clips: S4.CLIP,
        clipFrame: s4ClipFrame,
        spriteNames: s4SpriteNames(),
        joins: S4_JOINS,
        joinFrame: s4JoinFrame,
        isFrontLive: true,
    },
    [S5.ID]: {
        paintPlate: paintS5Plate,
        spriteJobs: s5SpriteJobs,
        clips: S5.CLIP,
        clipFrame: s5ClipFrame,
        spriteNames: s5SpriteNames(),
        joins: S5_JOINS,
        joinFrame: s5JoinFrame,
        isFrontLive: true,
    },
};
