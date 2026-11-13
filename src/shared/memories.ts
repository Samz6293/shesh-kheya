// Abba's three things that float in S3: the gamchha, the flute and the tiffin
// box. Once found they lie in Mitu's boat for the rest of the chapter (D12).
// SHARED: the renderer paints them at this size; the game places them in the
// boat with these offsets, in S3 now and, from the clips' tracks, later scenes.
// Whether each one was found is per player, so they are always drawn live,
// never into a clip (handoff rule 7).
import { localToScreen } from "./depth";
import type { BoatAnchor, ChapterOneFlags, FrameSprite, MemoryId, Point, SpriteDef } from "../types";

// the flags that say a memory was found (only these boolean flags)
type MemoryFlag = "foundGamchha" | "foundFlute" | "foundTiffin";

export const MEMORY = {
    IDS: ["gamchha", "flute", "tiffin"] as MemoryId[],
    SPRITE: { w: 160, h: 120, ax: 80, ay: 80 } as SpriteDef,   // anchor: where it touches the water (or the boat)
    // where each one lies in the boat, from the boat's anchor (facing right):
    // between Mitu at the stern (-140) and the lantern on the bow (166)
    CARGO: {
        gamchha: [-66, -14],
        tiffin: [-12, -16],
        flute: [44, -20],             // lies across the fish (S4 on), so it rides a little higher
    } as Record<MemoryId, Point>,
    FLAG: {
        gamchha: "foundGamchha",
        flute: "foundFlute",
        tiffin: "foundTiffin",
    } as Record<MemoryId, MemoryFlag>,
    BEAT: {
        gamchha: "mem.gamchha",
        flute: "mem.flute",
        tiffin: "mem.tiffin",
    } as const,
};

export function memorySpriteName(id: MemoryId): string {
    return `mem_${id}`;
}

export function isFound(id: MemoryId, flags: Readonly<ChapterOneFlags>): boolean {
    return flags[MEMORY.FLAG[id]];
}

// put a memory's sprite where it lies in the boat: a floor sprite (no bob of
// its own) that rides the boat's position, size, facing and pitch exactly
export function placeInBoat(s: FrameSprite, id: MemoryId, boat: BoatAnchor): void {
    const [x, y] = localToScreen(MEMORY.CARGO[id], boat.x, boat.y, boat.scale, boat.sx, boat.roll);
    s.x = x;
    s.y = y;
    s.scale = boat.scale;
    s.sx = boat.sx;
    s.roll = boat.roll;
}
