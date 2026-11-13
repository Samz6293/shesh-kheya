// Scene 4 cues: which sound plays at which second of each clip. Videos are
// silent, and lines are never said inside a clip (D19). Every clip has an
// entry, so ClipPlayer loads it. GAME only.
import { S4 } from "./layout";
import type { Cue } from "../../../types";

const FISH = { HAUL: 0.4, JUMPS: [1.2, 2.1, 2.9, 3.8, 4.9] };   // seconds into `fish` (the splashes in clips.ts)

// one oar sound per stroke the clip shows
function oarCues(row: { t0: number, n: number }): Cue[] {
    const cues: Cue[] = [];
    for (let k = 0; k < row.n; k++) cues.push({ t: row.t0 + k * S4.ROW_GAP, oar: true });
    return cues;
}

export const cues: Record<string, Cue[]> = {
    meet: oarCues(S4.MEET_ROW),
    grab: [],
    fish: [
        { t: FISH.HAUL, sfx: "sfx_net_pull" },
        ...FISH.JUMPS.map((t): Cue => ({ t, sfx: "sfx_fish_jump" })),
    ],
    look: [],
    leave: oarCues(S4.LEAVE_ROW),
};
