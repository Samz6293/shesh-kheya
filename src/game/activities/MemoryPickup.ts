// Activity: Abba's things floating in the water, each with a faint light.
// Row alongside one and the "Press E" hint appears; E lifts it out of the
// water into the boat, where it stays (D12). All three are optional and
// nothing can be missed for good: the hint shows whenever the boat is close.
// Found or not is per player, so everything here is drawn live, over clips
// and live frames alike (handoff rule 7). The scene says the lines.
import { bob, depthScale, depthY } from "../../shared/depth";
import { drawFigures } from "../../shared/compose";
import { drawGlow } from "../../shared/lights";
import { lerp, smooth } from "../../shared/math";
import { MITU_BOAT } from "../../shared/mituBoat";
import { MEMORY, isFound, memorySpriteName, placeInBoat } from "../../shared/memories";
import type Boat from "../Boat";
import type { BoatAnchor, FrameSprite, Game, MemoryId, SpriteArt } from "../../types";

const CONFIG = {
    REACH_DZ: 0.14,               // close enough in depth ...
    REACH_PAD: 30,                // ... and alongside the hull, plus this many px
    LIFT: 0.9,                    // seconds from the water into the boat
    ARC: 46,                      // px it rises on the way (at scale 1)
    GLOW: { RADIUS: 64, STRENGTH: 0.75, ABOVE: 10 },     // the faint light on each one, px at scale 1
    KEY: "KeyE",
};

interface Lift {
    id: MemoryId
    start: number
    x: number
    y: number
    scale: number
}

export default class MemoryPickup {
    chosen: MemoryId | null = null;          // the one the player pressed E at; the scene collects it
    private near: MemoryId | null = null;
    private lift: Lift | null = null;
    private isHinting = false;
    private floatSprites = {} as Record<MemoryId, FrameSprite>;
    private boatSprites = {} as Record<MemoryId, FrameSprite>;
    private drawList: FrameSprite[] = [];

    constructor(private game: Game, private boat: Boat, private spots: Record<MemoryId, { x: number, z: number }>, art: Record<string, SpriteArt>) {
        // in the boat (or on the way) a memory has no reflection of its own
        const noReflection = document.createElement("canvas");
        noReflection.width = 1;
        noReflection.height = 1;
        for (const id of MEMORY.IDS) {
            const a = art[memorySpriteName(id)];
            this.floatSprites[id] = { def: MEMORY.SPRITE, art: a, x: spots[id].x, z: spots[id].z, sx: 1, roll: 0 };
            this.boatSprites[id] = { def: MEMORY.SPRITE, art: { img: a.img, refl: noReflection }, x: 0, z: 0, sx: 1, roll: 0, y: 0 };
        }
        document.addEventListener("keydown", this.onKeyDown);
    }

    dispose(): void {
        document.removeEventListener("keydown", this.onKeyDown);
        this.showHint(false);
    }

    // the ones still floating, added to `out` so the live frame sorts them by depth with the boat
    addFloating(out: FrameSprite[]): void {
        for (const id of MEMORY.IDS) if (this.isFloating(id)) out.push(this.floatSprites[id]);
    }

    // called every frame by the scene: which one is close enough to pick up
    update(): void {
        const b = this.boat;
        this.near = null;
        if (b.rowing && !this.chosen) {
            const reach = MITU_BOAT.HULL_HALF * depthScale(b.z) + CONFIG.REACH_PAD;
            for (const id of MEMORY.IDS) {
                const spot = this.spots[id];
                if (this.isFloating(id) && Math.abs(b.z - spot.z) < CONFIG.REACH_DZ && Math.abs(b.x - spot.x) < reach) this.near = id;
            }
        }
        this.showHint(this.near !== null);
    }

    // lift the chosen one into the boat; resolves once it lies there (its flag is then set)
    async collect(id: MemoryId): Promise<void> {
        const spot = this.spots[id], t = this.game.loop.t, scale = depthScale(spot.z);
        this.lift = { id, start: t, x: spot.x, y: depthY(spot.z) + bob(t, scale), scale };
        this.game.sound.play("sfx_pickup");
        await this.game.loop.waitFor(() => this.game.loop.t - t >= CONFIG.LIFT);
        // New here: a computed key. `{ [name]: true }` makes an object whose key is
        // the value of `name` ("foundFlute"), so one line sets whichever flag this is.
        // Docs: MDN, "Object initializer" → computed property names
        this.game.progress.setFlags({ [MEMORY.FLAG[id]]: true });
        this.lift = null;
        this.chosen = null;
    }

    // drawn over the picture: the light on each floating one, the one being
    // lifted, and those lying in the boat (boat: where the boat is; null = none).
    // withFloating: also the floating ones themselves (over a clip, which has none)
    drawOver(ctx: CanvasRenderingContext2D, boat: BoatAnchor | null, backing: CanvasImageSource, t: number, withFloating: boolean): void {
        const list = this.drawList;
        list.length = 0;
        if (withFloating) this.addFloating(list);
        if (boat) {
            for (const id of MEMORY.IDS) {
                if (!isFound(id, this.game.progress.flags)) continue;
                placeInBoat(this.boatSprites[id], id, boat);
                list.push(this.boatSprites[id]);
            }
            if (this.lift) list.push(this.lifted(this.lift, boat, t));
        }
        drawFigures(ctx, list, backing, t);

        for (const id of MEMORY.IDS) {
            if (!this.isFloating(id)) continue;
            const spot = this.spots[id], scale = depthScale(spot.z);
            const y = depthY(spot.z) + bob(t, scale) - CONFIG.GLOW.ABOVE * scale;
            drawGlow(ctx, spot.x, y, CONFIG.GLOW.RADIUS * scale, CONFIG.GLOW.STRENGTH, t);
        }
    }

    debugLine(): string {
        const found = MEMORY.IDS.filter((id) => isFound(id, this.game.progress.flags));
        return `memories  near ${this.near ?? "-"}  found ${found.join(" ") || "-"}`;
    }

    private isFloating(id: MemoryId): boolean {
        return !isFound(id, this.game.progress.flags) && this.lift?.id !== id;
    }

    // on its way from the water to its place in the boat: rising, then dropping in
    private lifted(lift: Lift, boat: BoatAnchor, t: number): FrameSprite {
        const s = this.boatSprites[lift.id];
        placeInBoat(s, lift.id, boat);
        const u = smooth(Math.min(1, (t - lift.start) / CONFIG.LIFT));
        s.x = lerp(lift.x, s.x, u);
        s.y = lerp(lift.y, s.y ?? 0, u) - CONFIG.ARC * boat.scale * Math.sin(Math.PI * u);
        s.scale = lerp(lift.scale, boat.scale, u);
        s.roll *= u;
        return s;
    }

    private showHint(on: boolean): void {
        if (on && !this.isHinting) this.game.hint.show("pickupHint");
        if (!on && this.isHinting) this.game.hint.hide("pickupHint");
        this.isHinting = on;
    }

    private onKeyDown = (e: KeyboardEvent): void => {
        if (e.code === CONFIG.KEY && this.near && !this.chosen) this.chosen = this.near;
    };
}
