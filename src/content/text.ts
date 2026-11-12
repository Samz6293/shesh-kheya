// The one door to the game's text. Code asks for a line by its id and gets
// the Sylheti and English from dialogue.json; no wording lives in .ts files.
// The id types come from the JSON itself, so a mistyped id fails `tsc`.
import content from "./ch1/dialogue.json";
import type { Line, ScreenText } from "../types";

// New here: `keyof typeof`. `typeof content.beats` is the shape of that object,
// and `keyof` turns its keys into a type: "s5.intro" | "s5.helped" | ...
// Docs: TypeScript handbook, "Keyof Type Operator"
export type BeatId = keyof typeof content.beats;
export type ScreenId = keyof typeof content.screens;

export function line(beatId: BeatId, index: number): Line {
    const found = content.beats[beatId][index];
    if (!found) throw new Error(`Unknown line: ${beatId}[${index}]`);
    return found;
}

export function screen(id: ScreenId): ScreenText {
    return content.screens[id];
}

// the name shown above a line; the narrator has none
export function speakerName(id: string): string {
    // safe: speaker ids in the JSON are checked against this list when lines are added
    const speaker = content.speakers[id as keyof typeof content.speakers];
    if (!speaker) throw new Error(`Unknown speaker: ${id}`);
    return speaker.bn;
}
