// Scene 3 cues: which sound plays at which second of each clip. Videos are
// silent, and lines are never said inside a clip (D19). Every clip has an
// entry, so ClipPlayer loads it. GAME only.
import { S3 } from "./layout";
import type { Cue } from "../../../types";

const AZAN_AT = 1.6;              // seconds into `board`: far off, once (script)

// one oar sound per stroke the clip shows
function oarCues(row: { t0: number, n: number }): Cue[] {
    const cues: Cue[] = [];
    for (let k = 0; k < row.n; k++) cues.push({ t: row.t0 + k * S3.ROW_GAP, oar: true });
    return cues;
}

export const cues: Record<string, Cue[]> = {
    board: [
        { t: AZAN_AT, sfx: "sfx_azan_far" },
        { t: S3.STEP_IN, sfx: "sfx_boat_bump" },
    ],
    leave: oarCues(S3.LEAVE_ROW),
};
