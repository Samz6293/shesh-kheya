// What the player did in Chapter 1, with the values a new game starts from.
// Shared so the join check draws the lantern with the same default oil
// as a game started at a scene with `?scene=`.
import type { ChapterOneFlags } from "../types";

export function defaultFlags(): ChapterOneFlags {
    return {
        lampOil: 55,              // a middling fill, until the lantern activity sets it
        foundGamchha: false,
        foundFlute: false,
        foundTiffin: false,
        helpedKalam1: false,
        fishGiven: false,
    };
}
