// Scene 3 painters for the offline renderer: the sprites the game loads
// (Mitu's boat poses and the three memories) and the pieces only the
// `board` clip needs: the boat empty or half-ready, the lantern on its own,
// and Mitu on her feet. RENDER only: the game never imports this file.
// Mitu on her feet is S2's figure (same painter, same joints), so she looks
// the same as she did walking off the veranda.
import { MITU_BOAT } from "../../../shared/mituBoat";
import { stroke } from "../../../render/brush";
import { context, flatten, group, makeCanvas } from "../../../render/layers";
import { setSeed } from "../../../render/seed";
import paintMitu from "../../../render/paintMitu";
import { memoryJobs } from "../../../render/paintMemories";
import { paintMitu as paintFigure } from "../s2-home/paint";
import { mituSkeleton } from "../s2-home/poses";
import { S2 } from "../s2-home/layout";
import type { BoatParts, MituFloorPose, MituPose, Point, SpriteArt, SpriteJob } from "../../../types";

// a piece drawn on its own has no reflection of its own (the boat's reflection carries it once it is in place)
const NO_REFLECTION = makeCanvas(1, 1);
const SEED_ORNA = 311;
// her orna streaming out behind her in the wind, from the shoulder, as in the
// boat sprite (paintMitu.ts), so nothing appears when she becomes that sprite
const ORNA: Point[] = [[-6, -5], [-28, -2], [-48, -10], [-70, -4]];

// the lantern alone, at the spot it has on the bow: the boat painted with
// everything else hidden, so its pixels are the ones in the whole boat
export function paintLanternAlone(): SpriteArt {
    const parts: BoatParts = { hull: false, lantern: true, girl: false, oar: null };
    return { img: paintMitu(MITU_BOAT.REST, parts).img, refl: NO_REFLECTION };
}

// the boat with only some of its parts
export function paintBoatParts(pose: MituPose, parts: BoatParts): SpriteArt {
    return paintMitu(pose, parts);
}

// Mitu standing, walking, kneeling or reaching, without a reflection (she is
// on the jetty or in the boat): S2's figure with her orna out in the wind
export function paintGirl(pose: MituFloorPose): SpriteArt {
    const def = S2.MITU_SPRITE;
    const out = makeCanvas(def.w, def.h), ctx = context(out);
    const [sx, sy] = mituSkeleton(pose).shoulder;
    setSeed(SEED_ORNA);
    const g = group(def.w, def.h);
    stroke(g, ORNA.map(([x, y]): Point => [def.ax + sx + x, def.ay + sy + y]), { w: 6.5, tone: 0.42, dryness: 0.45, bristles: 6, profile: "tip", loaded: 0.7, body: 0.5 });
    ctx.drawImage(flatten(g), 0, 0);
    ctx.drawImage(paintFigure(pose).img, 0, 0);
    return { img: out, refl: NO_REFLECTION };
}

// every sprite file the game loads for this scene
export function spriteJobs(): SpriteJob[] {
    const jobs: SpriteJob[] = [{ name: "mitu_rest", paint: () => paintMitu(MITU_BOAT.REST) }];
    for (const side of ["near", "far"] as const) {
        MITU_BOAT.STROKE_FRAMES.forEach((p, i) => jobs.push({ name: `mitu_${side}_${i}`, paint: () => paintMitu({ side, p }) }));
    }
    return [...jobs, ...memoryJobs()];
}
