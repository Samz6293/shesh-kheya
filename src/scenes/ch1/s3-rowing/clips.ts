// Scene 3 cutscenes, each as a pure function of time: state(t) says where
// everything is at second t, and nothing else. The renderer asks for every
// 1/24 s and encodes the frames. RENDER only.
//   board   Mitu boards at the ghat, lights the lantern, takes up the oar (board.ts)
//   leave   from where the player brought her, she rows on out of the right edge
// Neither clip fades: the game's curtain fades the scene in and out, so the
// memories and reeds drawn live on top fade with it.
import { STAGE } from "../../../shared/depth";
import { lerp } from "../../../shared/math";
import { MITU_BOAT } from "../../../shared/mituBoat";
import { defaultFlags } from "../../../shared/flags";
import { rowAway, rowPitch, rowPose, rowRings, surged, wakeRings } from "../../../render/rowing";
import { S2 } from "../s2-home/layout";
import { GIRL_SCALE, boardLook, partsKey } from "./board";
import { paintBoatParts, paintGirl, paintLanternAlone } from "./paint";
import { S3, s3Frame } from "./layout";
import type { ClipDef, FrameSprite, FrameState, S3ClipLook, SpriteArt } from "../../../types";

const OIL = defaultFlags().lampOil;           // unused in clips: lights are live
const WHOLE = { hull: true, lantern: true, girl: true, oar: null };
const LEAVE = {
    TO: STAGE.W + 320,            // out past the right edge, wake and all
    RAMP: 1,                      // seconds to get up to speed
    ROW_TIME: 4.6,                // seconds from the first stroke until she is gone
};
const DEPTH_STEP = 0.01;          // how far apart in drawing order Mitu, the lantern and the boat are

export const CLIPS: Record<string, ClipDef<S3ClipLook>> = {
    board: {
        duration: S3.CLIP.board,
        state: boardLook,
    },

    leave: {
        duration: S3.CLIP.leave,
        state(t) {
            const s = S3.LEAVE_ROW;
            const boatX = (at: number) => lerp(S3.EXIT.x, LEAVE.TO, rowAway(surged(at, s) - s.t0, LEAVE.RAMP, LEAVE.ROW_TIME));
            return {
                t, fade: 0, lit: 1,
                mitu: { x: boatX(t), z: S3.EXIT.z, sx: S3.HEADING, roll: rowPitch(t, s, S3.HEADING) },
                pose: rowPose(t, s),
                parts: WHOLE,
                girl: null,
                lantern: null,
                rings: [...rowRings(t, s, S3.EXIT.z, S3.HEADING, boatX), ...wakeRings(t, S3.EXIT.z, S3.HEADING, boatX)],
            };
        },
    },
};

// painting a pose is slow and many frames share one (rest poses), so keep each result
const painted = new Map<string, SpriteArt>();
function cached(key: string, paint: () => SpriteArt): SpriteArt {
    let art = painted.get(key);
    if (!art) {
        art = paint();
        painted.set(key, art);
    }
    return art;
}

// Mitu on her feet and the lantern on its own: floor sprites (no bob of their
// own, they follow what `board` says), reused every frame
const noArt = null as unknown as SpriteArt;   // safe: filled in below before the frame is drawn
const girlSprite: FrameSprite = { def: S2.MITU_SPRITE, art: noArt, x: 0, z: 0, sx: 1, roll: 0, y: 0, scale: GIRL_SCALE };
const lanternSprite: FrameSprite = { def: MITU_BOAT.SPRITE, art: noArt, x: 0, z: 0, sx: 1, roll: 0, y: 0 };
const others: FrameSprite[] = [];

// the frame of a clip at time t, with freshly painted poses
export function clipFrame(clip: string, t: number): FrameState {
    const look = CLIPS[clip].state(t);
    const boat = cached(`b ${look.pose.side} ${look.pose.p.toFixed(4)} ${partsKey(look.parts)}`, () => paintBoatParts(look.pose, look.parts));
    others.length = 0;
    if (look.girl) {
        const g = look.girl;
        girlSprite.art = cached(`g ${JSON.stringify(g.pose)}`, () => paintGirl(g.pose));
        girlSprite.x = g.x;
        girlSprite.y = g.y;
        girlSprite.sx = g.sx;
        // in the boat she is in front of the hull; on the jetty, behind it
        girlSprite.z = look.mitu.z + (g.isInBoat ? DEPTH_STEP : -DEPTH_STEP);
        others.push(girlSprite);
    }
    if (look.lantern) {
        lanternSprite.art = cached("lantern", paintLanternAlone);
        // the sprite is boat-sized: put its anchor where the lantern's spot on the bow would be
        lanternSprite.x = look.lantern[0] - MITU_BOAT.LANTERN[0];
        lanternSprite.y = look.lantern[1] - MITU_BOAT.LANTERN[1];
        lanternSprite.z = girlSprite.z + DEPTH_STEP;
        others.push(lanternSprite);
    }
    return s3Frame(look, boat, others, OIL);
}
