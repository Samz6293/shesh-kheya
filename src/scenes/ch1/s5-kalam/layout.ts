// Scene 5 (Kalam Majhi): positions, rest poses and sizes.
// SHARED: the only file of this scene that both the renderer and the game
// import. The clips are painted from these numbers and the game places its
// sprites with them, so changing anything here means re-rendering the scene
// (`npm run render -- s5`) and running `npm run check-joins`.
import { bob, depthScale, depthY, localToScreen } from "../../../shared/depth";
import { JOURNEY, MITU_BOAT, mituSpriteNames } from "../../../shared/mituBoat";
import { FISH, fishSpriteName } from "../../../shared/fish";
import { MEMORY, memorySpriteName } from "../../../shared/memories";
import type { BoatAnchor, FrameSprite, FrameState, Join, Point, S5Look, SpriteArt, SpriteDef } from "../../../types";

export const S5 = {
    ID: "s5",
    // New here: the journey rule (decision D18). Leaving home, Mitu travels
    // left to right; going back home, right to left. S5 is on the way back,
    // so everything here moves left: 1 = rightward, -1 = leftward.
    HEADING: JOURNEY.HOMEWARD,
    KALAM: { x: 620, z: 0.35 },               // his boat, stuck in the hyacinth, between Mitu and home
    MITU_START: { x: 1360, z: 0.85 },         // where the intro clip leaves Mitu
    CONTACT: { x: 884, z: 0.35 },             // Mitu's bow against Kalam's stern
    PUSH_DISTANCE: 50,                        // how far the push moves both boats (along HEADING)
    KALAM_LOOP: 2,                            // seconds per push of his pole (divides SYNC)
    KALAM_FRAMES: 8,                          // sprites the game has for that loop
    KALAM_SPRITE: { w: 640, h: 560, ax: 320, ay: 300 } as SpriteDef,
    KALAM_HULL_HALF: 246,                     // half his hull's length, in sprite pixels
    CLIP: { intro: 8, helped: 4, farewell: 4, declined: 11 },   // clip lengths in seconds (multiples of SYNC or ending the scene)
    KALAM_FREE: 360,                          // where Kalam's freed boat comes to rest, towards home
    DRIFT_AFTER_HELP: 26,                     // Mitu's boat drifts back this far as his slides free
    // heads, from each sprite's anchor (facing right), for the light over whoever is speaking
    HEAD: { mitu: [-139, -126] as Point, kalam: [50, -124] as Point },
    SPEAKER_ABOVE: 26,
    // Mitu's strokes inside the clips: the renderer paints them, cues.ts plays their sound
    ROW_GAP: 0.65,
    INTRO_ROW: { T0: 0.3, STROKES: 9 },
    DECLINED_ROW: { T0: 1.4, STROKES: 13 },
};

// 0..1 through Kalam's pole push
export function kalamPhase(t: number): number {
    return (((t / S5.KALAM_LOOP) % 1) + 1) % 1;
}

// which of his sprites the game shows at clock time t
export function kalamSpriteName(t: number): string {
    return `kalam_${Math.floor(kalamPhase(t) * S5.KALAM_FRAMES) % S5.KALAM_FRAMES}`;
}

// Mitu's boat, Kalam, and what can lie in her boat (her memories, Rahim's fish)
export function s5SpriteNames(): string[] {
    const names = mituSpriteNames();
    for (let i = 0; i < S5.KALAM_FRAMES; i++) names.push(`kalam_${i}`);
    for (let i = 0; i < FISH.FRAMES; i++) names.push(fishSpriteName(i));
    return [...names, ...MEMORY.IDS.map(memorySpriteName)];
}

// one frame object, reused every frame so the game loop creates no garbage.
// (`null as unknown as SpriteArt` is safe: s5Frame() fills the art in before anyone reads it)
const mituSprite: FrameSprite = { def: MITU_BOAT.SPRITE, art: null as unknown as SpriteArt, x: 0, z: 0, sx: 1, roll: 0 };
// Kalam is heading home the same way, so his boat faces along HEADING too
const kalamSprite: FrameSprite = { def: S5.KALAM_SPRITE, art: null as unknown as SpriteArt, x: 0, z: S5.KALAM.z, sx: S5.HEADING, roll: 0 };
const boat: BoatAnchor = { x: 0, y: 0, scale: 1, sx: 1, roll: 0 };
const frame: FrameState = {
    t: 0, darkness: 0, flash: 0, fade: 0, rings: [], oil: 0, marker: null, glints: [], ring: null,
    boat,
    sprites: [mituSprite, kalamSprite],
};

// turn "where things are" into what composeFrame() draws.
// The renderer passes freshly painted art, the game passes loaded sprites.
export function s5Frame(look: S5Look, mitu: SpriteArt, kalam: SpriteArt): FrameState {
    const scale = depthScale(look.mitu.z);
    frame.t = look.t;
    frame.darkness = look.darkness;
    frame.flash = look.flash;
    frame.fade = look.fade;
    frame.rings = look.rings;
    frame.oil = look.oil;
    frame.marker = look.marker;

    mituSprite.art = mitu;
    mituSprite.x = look.mitu.x;
    mituSprite.z = look.mitu.z;
    mituSprite.sx = look.mitu.sx;
    mituSprite.roll = look.mitu.roll;
    kalamSprite.art = kalam;
    kalamSprite.x = look.kalamX;

    // the lantern glow follows the boat, bob included
    boat.x = look.mitu.x;
    boat.y = depthY(look.mitu.z) + bob(look.t, scale);
    boat.scale = scale;
    boat.sx = look.mitu.sx;
    boat.roll = look.mitu.roll;
    return frame;
}

// how far along x the push moves both boats: PUSH_DISTANCE in the direction of travel
export const PUSH_DX = S5.PUSH_DISTANCE * S5.HEADING;

// where Mitu's boat rests once Kalam's has slid free (it drifts back a little)
export const MITU_AFTER_HELP = S5.CONTACT.x + PUSH_DX - S5.HEADING * S5.DRIFT_AFTER_HELP;

// where the light over a speaker's head goes, following the bob of the boat; null = not in view
export function speakerPoint(id: string, look: S5Look): Point | null {
    const head = id === "mitu" ? S5.HEAD.mitu : id === "kalam" ? S5.HEAD.kalam : null;
    if (!head) return null;
    const isMitu = id === "mitu";
    const x = isMitu ? look.mitu.x : look.kalamX, z = isMitu ? look.mitu.z : S5.KALAM.z;
    const scale = depthScale(z);
    const [hx, hy] = localToScreen(head, x, depthY(z) + bob(look.t, scale), scale, S5.HEADING);
    return [hx, hy - S5.SPEAKER_ABOVE * scale];
}

// the moments where a clip meets live play; check-joins compares both sides
export const JOINS: Join[] = [
    { clip: "intro", at: "end", mitu: S5.MITU_START, kalamX: S5.KALAM.x, darkness: 0 },
    { clip: "helped", at: "start", mitu: { x: S5.CONTACT.x + PUSH_DX, z: S5.CONTACT.z }, kalamX: S5.KALAM.x + PUSH_DX, darkness: 1 },
    { clip: "helped", at: "end", mitu: { x: MITU_AFTER_HELP, z: S5.CONTACT.z }, kalamX: S5.KALAM_FREE, darkness: 1 },
    { clip: "farewell", at: "start", mitu: { x: MITU_AFTER_HELP, z: S5.CONTACT.z }, kalamX: S5.KALAM_FREE, darkness: 1 },
    { clip: "declined", at: "start", mitu: S5.MITU_START, kalamX: S5.KALAM.x, darkness: 0 },
];

// the game's frame at a join: both boats at rest, at a sync point (t = 0)
export function s5JoinFrame(join: Join, art: Record<string, SpriteArt>, oil: number): FrameState {
    const look: S5Look = {
        t: 0, darkness: join.darkness, flash: 0, fade: 0, rings: [], oil, marker: null,
        mitu: { x: join.mitu.x, z: join.mitu.z, sx: S5.HEADING, roll: 0 },
        kalamX: join.kalamX ?? S5.KALAM.x,
    };
    return s5Frame(look, art["mitu_rest"], art[kalamSpriteName(0)]);
}
