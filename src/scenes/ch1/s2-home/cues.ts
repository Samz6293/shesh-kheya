// Scene 2 cues: sounds at given seconds of each clip. Videos are silent; all
// lines are said live between clips (each waits for the player), so no clip
// carries a line. Every clip has an entry, so ClipPlayer loads it. GAME only.
import type { Cue } from "../../../types";

export const cues: Record<string, Cue[]> = {
    arrive: [{ t: 1.6, sfx: "sfx_cow" }],
    kick: [{ t: 0.5, sfx: "sfx_kick" }],
    touch: [{ t: 3.6, sfx: "sfx_kick" }, { t: 3.6, sfx: "sfx_ripple" }],
    paanbox: [],
    handout: [],
    take: [],
    leave: [],
};
