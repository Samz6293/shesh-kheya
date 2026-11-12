// Scene 2 (Home): positions, poses, the live states between clips, and the
// frame builder. SHARED: the only file of this scene (with poses.ts) that both
// the renderer and the game import. Changing anything here means re-rendering
// the scene (`npm run render -- s2`) and running `npm run check-joins`.
// The house is on the left of the picture: home is always on the left (D18).
// The reeds are drawn live over the clips (isFrontLive), and nothing else in
// S2 loops, so its clips start the moment the player is ready, no sync point.
import { localToScreen } from "../../../shared/depth";
import { dadiSkeleton, mituSkeleton } from "./poses";
import type { AmmaPose, DadiPose, FrameSprite, FrameState, Glint, Join, LightRing, MituFloorPose, Point, PropPlace, S2Look, S2State, SpriteArt, SpriteDef } from "../../../types";

export const S2 = {
    ID: "s2",
    FLOOR_Y: 760,                             // the veranda floor: figures and props stand on this line
    // the bamboo walkway from the end of the veranda down to the ghat, off the right edge
    WALKWAY: { X0: 1252, X1: 1960, DROP: 52 },
    // where the figures are along the veranda, and which way they face (1 = right)
    MITU_DOOR: 560,                           // in the doorway, where `arrive` starts
    MITU_REST: 822,                           // standing by Amma
    MITU_KNEEL: 872,                          // kneeling at Amma's side
    MITU_SIT: 1000,                           // sitting in front of Dadi
    MITU_GONE: 2000,                          // off the right edge, on the way to the ghat
    AMMA: { x: 930, sx: -1 },                 // Amma and Dadi face Mitu
    DADI: { x: 1110, sx: -1 },
    MITU_SX: 1,
    MITU_SPRITE: { w: 180, h: 200, ax: 90, ay: 190 } as SpriteDef,
    AMMA_SPRITE: { w: 200, h: 180, ax: 100, ay: 170 } as SpriteDef,
    DADI_SPRITE: { w: 240, h: 180, ax: 120, ay: 170 } as SpriteDef,
    BOX_SPRITE: { w: 100, h: 60, ax: 50, ay: 52 } as SpriteDef,
    LANTERN_SPRITE: { w: 64, h: 74, ax: 32, ay: 66 } as SpriteDef,
    BOTTLE_SPRITE: { w: 60, h: 80, ax: 30, ay: 72 } as SpriteDef,
    // where a hand holds each prop: the top of the box, the lantern's handle (px above its bottom)
    BOX_TOP: 24,
    LANTERN_HANDLE: 38,
    // props on the floor (x on screen)
    BOX_BACK: 1150,                           // behind Dadi, before and after the paan
    BOX_FRONT: 1052,                          // in front of her, for the paan
    LANTERN_BACK: 1170,                       // beside Dadi, behind her
    LANTERN_DOWN: 1044,                       // where Mitu sets it down, by the bottle
    BOTTLE_X: 1074,                           // the kerosene bottle, by Dadi's knee all along
    HOLD: [1058, 668] as Point,               // Dadi's hand, holding the lantern out
    MEET: [1046, 684] as Point,               // where the lantern passes from her hand to Mitu's
    KUPI: [690, 654] as Point,                // the lamp in the window (screen)
    BELLY: [26, -44] as Point,                // the hotspot on Amma's belly, from her anchor (facing right)
    SPEAKER_ABOVE: 26,                        // px above a head where the speaker's light sits
    FADE: 1.4,                                // `arrive` fades in, `leave` fades out, over this long
    CLIP: { arrive: 5.6, kick: 3.2, touch: 6, paanbox: 6, handout: 3.2, take: 4, leave: 14 },
};

// ---------- poses each live sprite is painted in ----------
const STAND: MituFloorPose = { walk: 0, low: 0, sit: 0, lean: 0, reach: null, carry: false };
// Mitu's hand on the belly, from her kneeling anchor: the belly point on screen minus her position
const bellyScreen = localToScreen(S2.BELLY, S2.AMMA.x, S2.FLOOR_Y, 1, S2.AMMA.sx);
export const MITU_POSE: Record<string, MituFloorPose> = {
    mitu_stand: STAND,
    mitu_kneel: { walk: 0, low: 1, sit: 0, lean: 0.25, reach: [bellyScreen[0] - 2 - S2.MITU_KNEEL, bellyScreen[1] + 2 - S2.FLOOR_Y], carry: false },
    mitu_sit: { walk: 0, low: 0, sit: 1, lean: 0, reach: null, carry: false },
};
export const AMMA_POSE: Record<string, AmmaPose> = {
    amma_lap: { hand: 0, gasp: 0 },
    amma_belly: { hand: 1, gasp: 0 },
};
// Dadi faces left, so a point in front of her on screen is +x in her own (facing right) coordinates
const dadiLocal = ([x, y]: Point): Point => [(x - S2.DADI.x) * S2.DADI.sx, y - S2.FLOOR_Y];
export const DADI_POSE: Record<string, DadiPose> = {
    dadi_rest: { chuckle: 0, reach: null, lean: 0 },
    dadi_hold: { chuckle: 0, reach: dadiLocal(S2.HOLD), lean: 0.3 },
};
export const PROP = { BOX: "paan_box", LANTERN: "lantern", BOTTLE: "bottle_small" };

// ---------- the live states between clips ----------
const onFloor = (x: number, z: number): PropPlace => ({ x, y: S2.FLOOR_Y, z });
const Z = { DADI: 0.4, BOX: 0.45, LANTERN: 0.47, BOTTLE: 0.48, AMMA: 0.5, MITU: 0.6, CARRIED: 0.65 };
const START = {
    box: onFloor(S2.BOX_BACK, Z.BOX), lantern: onFloor(S2.LANTERN_BACK, Z.LANTERN), bottle: onFloor(S2.BOTTLE_X, Z.BOTTLE),
};
export const STATES: Record<string, S2State> = {
    arrived: { mituX: S2.MITU_REST, mitu: "mitu_stand", amma: "amma_lap", dadi: "dadi_rest", ...START },
    kicked: { mituX: S2.MITU_REST, mitu: "mitu_stand", amma: "amma_belly", dadi: "dadi_rest", ...START },
    touching: { mituX: S2.MITU_KNEEL, mitu: "mitu_kneel", amma: "amma_belly", dadi: "dadi_rest", ...START },
    byDadi: { mituX: S2.MITU_SIT, mitu: "mitu_sit", amma: "amma_belly", dadi: "dadi_rest", ...START, box: onFloor(S2.BOX_FRONT, Z.BOX) },
    // after the paan close-up Dadi has put the box back (it changed while the close-up covered the screen)
    afterPaan: { mituX: S2.MITU_SIT, mitu: "mitu_sit", amma: "amma_belly", dadi: "dadi_rest", ...START },
    holding: { mituX: S2.MITU_SIT, mitu: "mitu_sit", amma: "amma_belly", dadi: "dadi_hold", ...START, lantern: heldBy(S2.HOLD, Z.CARRIED) },
    ready: { mituX: S2.MITU_SIT, mitu: "mitu_sit", amma: "amma_belly", dadi: "dadi_rest", ...START, lantern: onFloor(S2.LANTERN_DOWN, Z.LANTERN) },
};

// the lantern hanging from a hand at this screen point
export function heldBy(hand: Point, z: number): PropPlace {
    return { x: hand[0], y: hand[1] + S2.LANTERN_HANDLE, z };
}

export function s2SpriteNames(): string[] {
    return [...Object.keys(MITU_POSE), ...Object.keys(AMMA_POSE), ...Object.keys(DADI_POSE), PROP.BOX, PROP.LANTERN, PROP.BOTTLE];
}

// the floor under x: the veranda, then the walkway sloping down to the ghat
export function floorY(x: number): number {
    const { X0, X1, DROP } = S2.WALKWAY;
    if (x <= X0) return S2.FLOOR_Y;
    return S2.FLOOR_Y + (DROP * (x - X0)) / (X1 - X0);
}

// ---------- screen points the game needs ----------
export function bellyPoint(): Point {
    return bellyScreen;
}

// where the light over a speaker's head goes, for a live state; null = not in the picture
export function speakerPoint(id: string, state: S2State): Point | null {
    if (id === "mitu") {
        const [x, y] = mituSkeleton(MITU_POSE[state.mitu]).head;
        return [state.mituX + x * S2.MITU_SX, S2.FLOOR_Y + y - S2.SPEAKER_ABOVE];
    }
    if (id === "ma") return localToScreen([-1, -93 - S2.SPEAKER_ABOVE], S2.AMMA.x, S2.FLOOR_Y, 1, S2.AMMA.sx);
    if (id === "dadi") {
        const [x, y] = dadiSkeleton(DADI_POSE[state.dadi]).head;
        return localToScreen([x, y - S2.SPEAKER_ABOVE], S2.DADI.x, S2.FLOOR_Y, 1, S2.DADI.sx);
    }
    return null;
}

// ---------- the frame ----------
// one frame object, reused every frame so the game loop creates no garbage.
// (`null as unknown as SpriteArt` is safe: s2Frame() fills the art in before anyone reads it)
const noArt = null as unknown as SpriteArt;
const figure = (def: SpriteDef, x: number, sx: number, z: number): FrameSprite => ({ def, art: noArt, x, z, sx, roll: 0, y: S2.FLOOR_Y });
const mitu = figure(S2.MITU_SPRITE, S2.MITU_REST, S2.MITU_SX, Z.MITU);
const amma = figure(S2.AMMA_SPRITE, S2.AMMA.x, S2.AMMA.sx, Z.AMMA);
const dadi = figure(S2.DADI_SPRITE, S2.DADI.x, S2.DADI.sx, Z.DADI);
const box = figure(S2.BOX_SPRITE, 0, 1, Z.BOX);
const lantern = figure(S2.LANTERN_SPRITE, 0, 1, Z.LANTERN);
const bottle = figure(S2.BOTTLE_SPRITE, 0, 1, Z.BOTTLE);
const bangle: Glint = { x: 0, y: 0, r: 9, light: "bangle", phase: 0, isBehind: false };
const frame: FrameState = {
    t: 0, darkness: 0, flash: 0, fade: 0, rings: [], oil: 0, marker: null, boat: null, ring: null,
    sprites: [mitu, amma, dadi, box, lantern, bottle],
    glints: [{ x: S2.KUPI[0], y: S2.KUPI[1], r: 26, light: "kupi", phase: 0, isBehind: true }, bangle],
};

export interface S2Art {
    mitu: SpriteArt
    amma: SpriteArt
    dadi: SpriteArt
    box: SpriteArt
    lantern: SpriteArt
    bottle: SpriteArt
}

function place(s: FrameSprite, p: PropPlace): void {
    s.x = p.x;
    s.y = p.y;
    s.z = p.z;
}

// turn "where things are" into what composeFrame() draws. The renderer passes
// freshly painted art, the game passes loaded sprites. Dadi's pose places the
// bangle's glint on her wrist
export function s2Frame(look: S2Look, dadiPose: DadiPose, art: S2Art): FrameState {
    frame.t = look.t;
    frame.fade = look.fade;
    frame.ring = look.ring;
    mitu.x = look.mituX;
    mitu.y = look.mituY;
    mitu.art = art.mitu;
    amma.art = art.amma;
    dadi.art = art.dadi;
    place(box, look.box);
    box.art = art.box;
    place(lantern, look.lantern);
    lantern.art = art.lantern;
    place(bottle, look.bottle);
    bottle.art = art.bottle;
    const [bx, by] = localToScreen(dadiSkeleton(dadiPose).wrist, S2.DADI.x, S2.FLOOR_Y, 1, S2.DADI.sx);
    bangle.x = bx;
    bangle.y = by;
    return frame;
}

// a live state as a look (t = the clock, no fade, no ring)
export function stateLook(state: S2State, t: number, look: S2Look): S2Look {
    look.t = t;
    look.fade = 0;
    look.ring = null;
    look.mituX = state.mituX;
    look.mituY = S2.FLOOR_Y;
    look.box = state.box;
    look.lantern = state.lantern;
    look.bottle = state.bottle;
    return look;
}

export function stateArt(state: S2State, sprites: Record<string, SpriteArt>): S2Art {
    return {
        mitu: sprites[state.mitu], amma: sprites[state.amma], dadi: sprites[state.dadi],
        box: sprites[PROP.BOX], lantern: sprites[PROP.LANTERN], bottle: sprites[PROP.BOTTLE],
    };
}

// the moments where a clip meets live play; check-joins compares both sides
const join = (clip: string, at: "start" | "end", state: string): Join => ({ clip, at, state, mitu: { x: STATES[state].mituX, z: 0 }, darkness: 0 });
export const JOINS: Join[] = [
    join("arrive", "end", "arrived"),
    join("kick", "start", "arrived"), join("kick", "end", "kicked"),
    join("touch", "start", "kicked"), join("touch", "end", "touching"),
    join("paanbox", "start", "touching"), join("paanbox", "end", "byDadi"),
    join("handout", "start", "afterPaan"), join("handout", "end", "holding"),
    join("take", "start", "holding"), join("take", "end", "ready"),
    join("leave", "start", "ready"),
];

// the game's frame at a join (t = 0)
export function s2JoinFrame(j: Join, sprites: Record<string, SpriteArt>): FrameState {
    const state = STATES[j.state ?? ""];
    if (!state) throw new Error(`S2 join without a state: ${j.clip} ${j.at}`);
    const look = stateLook(state, 0, { t: 0, fade: 0, mituX: 0, mituY: 0, box: state.box, lantern: state.lantern, bottle: state.bottle, ring: null as LightRing | null });
    return s2Frame(look, DADI_POSE[state.dadi], stateArt(state, sprites));
}

// ---------- the two close-ups ----------
// Each is a whole-screen picture faded in over the scene. Pieces are separate
// pictures ("stills"), drawn centred on these points.
export const PAAN = {
    PLATE: [900, 790] as Point,               // the brass plate; the leaf goes here
    PLATE_RADIUS: 230,                        // a leaf dropped this close lands on the plate
    LEAF_RADIUS: 130,                         // lime or supari dropped this close lands on the leaf
    LEAF_HOME: [360, 930] as Point,           // the leaves, in the open paan box
    CHUN_HOME: [570, 905] as Point,           // the lime pot
    SUPARI_HOME: [700, 975] as Point,         // the supari
    // Dadi sits across the plate: her left arm comes down to the wrist with the bangle
    ELBOW: [1200, 372] as Point,
    WRIST: [1236, 552] as Point,
    BANGLE: { RX: 24, RY: 8, TILT: -0.17 },   // the ring round her wrist, across the forearm
    HAND: [1010, 585] as Point,               // her other hand, open on her lap: the folded paan goes here
    BOX: { X0: 230, X1: 790, TOP: 880, DIVIDERS: [470, 640] },    // the open paan box
    PICK_RADIUS: 80,                          // px round a piece that picks it up
    CHECKLIST: { X: 1780, Y0: 380, GAP: 150, SCALE: 0.55 },   // the picture checklist down the right side
};

export const LANTERN = {
    CAP: [740, 716] as Point,                 // the lantern's filler cap: where the oil goes in
    BOTTLE_REST: [1120, 652] as Point,        // the bottle's middle, standing on the ledge
    BOTTLE_POUR: [875, 582] as Point,         // its middle while pouring: the mouth is over the cap
    POUR_ANGLE: -2,                           // radians: tipped over to the left
    BOTTLE_MOUTH: [0, -140] as Point,         // from the bottle's middle, upright
    BOTTLE_SIZE: [140, 300] as Point,         // the bottle picture, drawn centred
    LIQUID: { HALF_W: 40, BOTTOM: 138, HEIGHT: 178 },  // the kerosene inside, from the middle
    PICK_RADIUS: 120,
};

// close-up picture names
export const STILL = {
    PAAN_PLATE: "closeup_paan",
    LANTERN_PLATE: "closeup_lantern",
    LEAF: "leaf",
    CHUN: "chun_pot",
    SUPARI: "supari_bowl",
    CHUN_DAB: "chun_dab",
    SUPARI_BITS: "supari_bits",
    PAAN_FOLDED: "paan_folded",
    BOTTLE: "bottle",
    HAND_ICON: "hand_icon",                   // "touch here", over Amma's belly
};
