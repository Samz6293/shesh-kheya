// Scene 3 (Rowing and memories): positions, rest poses and sizes.
// SHARED: the only file of this scene that both the renderer and the game
// import. Changing anything here means re-rendering the scene
// (`npm run render -- s3`) and running `npm run check-joins`.
// S3 leaves home, so everything moves left to right (D18). The ghat's jetty
// comes in from the left edge, where home is; the way to Rahim is off the right.
// The reeds and the jetty are drawn live over the clips (isFrontLive), like S2,
// because the memories (live, per player) must sit behind them.
import { bob, depthScale, depthY, localToScreen } from "../../../shared/depth";
import { JOURNEY, MITU_BOAT, mituSpriteNames } from "../../../shared/mituBoat";
import { MEMORY, memorySpriteName } from "../../../shared/memories";
import type { BoatAnchor, FrameSprite, FrameState, Join, MemoryId, Point, S3Look, SpriteArt } from "../../../types";

export const S3 = {
    ID: "s3",
    HEADING: JOURNEY.OUTWARD,
    MOORED: { x: 560, z: 1 },                 // Mitu's boat at the ghat, nearest the camera (scale 1)
    // the ghat's bamboo jetty, from beyond the left edge to just short of the boat's stern
    JETTY: { X0: -40, X1: 336, Y: 866 },      // Y: the deck she walks on
    // Abba's things, floating where she can row to them (never on the way in or out)
    MEMORIES: {
        gamchha: { x: 840, z: 0.38 },
        flute: { x: 1080, z: 0.8 },
        tiffin: { x: 1310, z: 0.2 },
    } as Record<MemoryId, { x: number, z: number }>,
    EXIT_FROM: 1560,                          // rowing past this x takes her on to Rahim
    EXIT: { x: 1640, z: 0.56 },               // where the `leave` clip starts
    CLIP: { board: 12, leave: 5 },            // board ends on a sync point; leave ends the scene
    // heads, from the boat's anchor (facing right), for the light over whoever is speaking
    HEAD: { mitu: [-139, -126] as Point },
    SPEAKER_ABOVE: 26,
    // Mitu's strokes in `leave`: the renderer paints them, cues.ts plays their sound
    ROW_GAP: 0.65,                            // seconds between strokes (= render/rowing.ts ROW.GAP)
    LEAVE_ROW: { t0: 0.3, n: 7 },
    // when her foot lands in the boat in `board` (cues.ts plays the bump)
    STEP_IN: 4,
};

// every sprite the game loads: Mitu's boat poses and the three memories
export function s3SpriteNames(): string[] {
    return [...mituSpriteNames(), ...MEMORY.IDS.map(memorySpriteName)];
}

// one frame object, reused every frame so the game loop creates no garbage.
// (`null as unknown as SpriteArt` is safe: s3Frame() fills the art in before anyone reads it)
const mituSprite: FrameSprite = { def: MITU_BOAT.SPRITE, art: null as unknown as SpriteArt, x: 0, z: 0, sx: S3.HEADING, roll: 0 };
const boat: BoatAnchor = { x: 0, y: 0, scale: 1, sx: S3.HEADING, roll: 0, lit: 1 };
const frame: FrameState = {
    t: 0, darkness: 0, flash: 0, fade: 0, rings: [], oil: 0, marker: null, glints: [], ring: null,
    boat,
    sprites: [mituSprite],
};

// turn "where things are" into what composeFrame() draws. `others`: anything
// else on the water this frame (the floating memories live; Mitu on her feet
// and the lantern on its own in `board`), sorted by depth with the boat
export function s3Frame(look: S3Look, mitu: SpriteArt, others: FrameSprite[], oil: number): FrameState {
    const scale = depthScale(look.mitu.z);
    frame.t = look.t;
    frame.fade = look.fade;
    frame.rings = look.rings;
    frame.oil = oil;

    mituSprite.art = mitu;
    mituSprite.x = look.mitu.x;
    mituSprite.z = look.mitu.z;
    mituSprite.sx = look.mitu.sx;
    mituSprite.roll = look.mitu.roll;
    // refilled every frame: composeFrame() sorts this list in place
    frame.sprites.length = 0;
    frame.sprites.push(mituSprite);
    for (const s of others) frame.sprites.push(s);

    // the lantern glow follows the boat, bob included
    boat.x = look.mitu.x;
    boat.y = depthY(look.mitu.z) + bob(look.t, scale);
    boat.scale = scale;
    boat.sx = look.mitu.sx;
    boat.roll = look.mitu.roll;
    boat.lit = look.lit;
    return frame;
}

// where the light over a speaker's head goes, following the boat's bob; null = not in view
export function speakerPoint(id: string, look: S3Look): Point | null {
    if (id !== "mitu") return null;
    const scale = depthScale(look.mitu.z);
    const [hx, hy] = localToScreen(S3.HEAD.mitu, look.mitu.x, depthY(look.mitu.z) + bob(look.t, scale), scale, look.mitu.sx);
    return [hx, hy - S3.SPEAKER_ABOVE * scale];
}

// the moments where a clip meets live play; check-joins compares both sides
export const JOINS: Join[] = [
    { clip: "board", at: "end", mitu: S3.MOORED, darkness: 0 },
    { clip: "leave", at: "start", mitu: S3.EXIT, darkness: 0 },
];

// the game's frame at a join: the boat at rest, at a sync point (t = 0)
export function s3JoinFrame(join: Join, art: Record<string, SpriteArt>, oil: number): FrameState {
    const look: S3Look = {
        t: 0, fade: 0, lit: 1, rings: [],
        mitu: { x: join.mitu.x, z: join.mitu.z, sx: S3.HEADING, roll: 0 },
    };
    return s3Frame(look, art["mitu_rest"], [], oil);
}
