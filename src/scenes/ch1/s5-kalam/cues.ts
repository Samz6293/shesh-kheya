// Scene 5 cues: which sound plays at which second of each clip. Videos are
// silent; lines are never said inside a clip (D19): they come live between
// clips and wait for the player. Changing a sound never needs a re-render.
// Every clip has an entry, so ClipPlayer loads it. GAME only.
import { S5 } from "./layout";
import type { Cue } from "../../../types";

// one oar sound per stroke the clip shows
function oarCues(row: { T0: number, STROKES: number }): Cue[] {
    const cues: Cue[] = [];
    for (let k = 0; k < row.STROKES; k++) cues.push({ t: row.T0 + k * S5.ROW_GAP, oar: true });
    return cues;
}

export const cues: Record<string, Cue[]> = {
    intro: [
        ...oarCues(S5.INTRO_ROW),
        { t: 3.75, sfx: "sfx_thunder_far" },
    ],
    helped: [{ t: 0.1, sfx: "sfx_boat_free" }],
    farewell: [],
    declined: oarCues(S5.DECLINED_ROW),
};
