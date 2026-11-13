// What lies in Mitu's boat: the memories she found (D12) and, from S4 on,
// Rahim's fish. It differs per player, so it is never in a clip; the scene
// draws it on top of each frame at the boat's position, live or from the
// clip's track (handoff rule 7). Used by every scene with Mitu's boat.
import { drawFigures } from "../shared/compose";
import { FISH, fishFrame, fishHop, fishSpriteName } from "../shared/fish";
import { MEMORY, isFound, memorySpriteName, placeInBoat } from "../shared/memories";
import { localToScreen } from "../shared/depth";
import type { BoatAnchor, FrameSprite, Game, MemoryId, SpriteArt } from "../types";

export default class Cargo {
    hasFish = false;              // set once the fish is in the boat (S4 on)
    private memories = {} as Record<MemoryId, FrameSprite>;
    private fish: FrameSprite | null = null;
    private fishArt: SpriteArt[] = [];
    private list: FrameSprite[] = [];

    // art: the scene's loaded sprites (its memories, and the fish if the scene has it)
    constructor(private game: Game, art: Record<string, SpriteArt>) {
        // in the boat nothing has a reflection of its own
        const noReflection = document.createElement("canvas");
        noReflection.width = 1;
        noReflection.height = 1;
        for (const id of MEMORY.IDS) {
            const a = art[memorySpriteName(id)];
            if (a) this.memories[id] = { def: MEMORY.SPRITE, art: { img: a.img, refl: noReflection }, x: 0, z: 0, sx: 1, roll: 0, y: 0 };
        }
        for (let i = 0; i < FISH.FRAMES; i++) {
            const a = art[fishSpriteName(i)];
            if (a) this.fishArt.push({ img: a.img, refl: noReflection });
        }
        if (this.fishArt.length > 0) this.fish = { def: FISH.SPRITE, art: this.fishArt[0], x: 0, z: 0, sx: 1, roll: 0, y: 0 };
    }

    // a memory's sprite in the boat (MemoryPickup moves it from the water into place)
    memorySprite(id: MemoryId): FrameSprite {
        return this.memories[id];
    }

    // everything aboard, placed in the boat, added to `out`
    add(out: FrameSprite[], boat: BoatAnchor, t: number): void {
        if (this.hasFish && this.fish) {
            // lying still, and every so often one flap and a little hop
            const hop = fishHop(t);
            const [x, y] = localToScreen(FISH.IN_BOAT, boat.x, boat.y, boat.scale, boat.sx, boat.roll);
            this.fish.art = this.fishArt[hop > 0 ? fishFrame(hop * FISH.FLAP) : 0];
            this.fish.x = x;
            this.fish.y = y - FISH.HOP.HEIGHT * boat.scale * Math.sin(Math.PI * hop);
            this.fish.scale = boat.scale;
            this.fish.sx = boat.sx;
            this.fish.roll = boat.roll;
            out.push(this.fish);
        }
        // the memories after the fish, so they lie on top of it (the flute must stay in sight)
        for (const id of MEMORY.IDS) {
            const s = this.memories[id];
            if (!s || !isFound(id, this.game.progress.flags)) continue;
            placeInBoat(s, id, boat);
            out.push(s);
        }
    }

    // draw what is aboard over a finished frame (boat: where the boat is; null = no boat in view)
    draw(ctx: CanvasRenderingContext2D, boat: BoatAnchor | null, backing: CanvasImageSource, t: number): void {
        if (!boat) return;
        this.list.length = 0;
        this.add(this.list, boat, t);
        drawFigures(ctx, this.list, backing, t);
    }
}
