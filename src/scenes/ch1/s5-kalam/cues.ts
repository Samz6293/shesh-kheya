// Scene 5 cues: what happens at which second of each clip. Videos are silent
// and carry no text, so sounds and lines are fired from here against the
// video's clock. Changing a sound or a line's timing never needs a re-render.
// GAME only.
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
        { t: 5.6, line: ["s5.intro", 0], hold: true },
    ],
    helped: [
        { t: 0.1, sfx: "sfx_boat_free" },
        { t: 3.0, line: ["s5.helped", 0], dur: 3.0 },
        { t: 6.2, line: ["s5.helped", 1], dur: 1.9 },
        { t: 8.3, line: ["s5.helped", 2], dur: 1.4 },
        { t: 9.9, line: ["s5.helped", 3], dur: 2.5 },
    ],
    declined: oarCues(S5.DECLINED_ROW),
};
