// Paints Mitu's boat for one pose: hull, lantern, the girl at the stern, and
// the oar on the near or far side. Used by every scene she rows in.
// A painter takes a pose and returns a picture; it never reads the clock,
// so the same pose always gives the same pixels.
// S3 (boarding) also needs the boat in parts: empty, the lantern alone, the
// oar lying down or being lifted. A hidden part is still painted, onto a
// spare canvas that is thrown away, so every part uses up the same seeded
// random numbers and looks exactly as it does in the whole boat.
import { MITU_BOAT, oarGeometry } from "../shared/mituBoat";
import { stroke } from "./brush";
import { blob, mass } from "./mass";
import { context, flatten, group, makeCanvas, reflect } from "./layers";
import { setSeed } from "./seed";
import type { BoatParts, InkLayer, MituPose, OarShape, Point, SpriteArt } from "../types";

const SEED = { FAR_OAR: 301, BOAT: 302, REFLECTION: 303 };
const BLADE_DRY = 2.4;            // a blade out of the water is darker than the pale one under it

// the whole boat, as in every rowing scene
const WHOLE: BoatParts = { hull: true, lantern: true, girl: true, oar: null };

export default function paintMitu(pose: MituPose, parts: BoatParts = WHOLE): SpriteArt {
    const def = MITU_BOAT.SPRITE;
    const out = makeCanvas(def.w, def.h), octx = context(out);
    // P moves a point measured from the anchor into the sprite image
    const P = ([x, y]: Point): Point => [x + def.ax, y + def.ay];
    const PP = (pts: Point[]) => pts.map(P);
    // a hidden part goes onto this spare canvas instead (see the header)
    const spare = group(def.w, def.h);
    const on = (isShown: boolean, g: InkLayer) => (isShown ? g : spare);
    const isPoseOar = parts.girl && parts.oar === null;

    const paintOar = (g: InkLayer, tone: number, oar: OarShape) => {
        stroke(g, [P(oar.top), P(oar.entry)], { w: 4.5, tone, dryness: 0.12, bristles: 4, profile: "even", loaded: 1, body: 0.3 });
        // the part under water is fainter (an oar out of the water has none)
        const isWet = oar.entry !== oar.tip;
        if (isWet) stroke(g, [P(oar.entry), P(oar.tip)], { w: 4, tone: tone * 0.3, dryness: 0.4, bristles: 3, profile: "even", body: 0.2 });
        const blade = isWet ? 1 : BLADE_DRY;
        const t = oar.tip, d = [Math.sin(oar.a), Math.cos(oar.a)], n = [d[1], -d[0]];
        mass(g.wet, PP([
            [t[0] - d[0] * 34 + n[0] * 3, t[1] - d[1] * 34 + n[1] * 3],
            [t[0] + n[0] * 8, t[1] + n[1] * 8],
            [t[0] - n[0] * 8, t[1] - n[1] * 8],
            [t[0] - d[0] * 34 - n[0] * 3, t[1] - d[1] * 34 - n[1] * 3],
        ]), { tone: tone * 0.25 * blade, tone2: tone * 0.12 * blade, jitter: 1 });
    };

    // a far-side oar sits behind the hull, so it is painted first
    if (pose.side === "far") {
        setSeed(SEED.FAR_OAR);
        const gFar = group(def.w, def.h);
        paintOar(gFar, 0.6, oarGeometry(pose));
        if (isPoseOar) octx.drawImage(flatten(gFar), 0, 0);
    }

    setSeed(SEED.BOAT);
    const boat = group(def.w, def.h);
    let g = on(parts.hull, boat);

    // hull
    mass(g.wet, PP([[-210, -44], [-162, -20], [-2, -12], [163, -22], [208, -50], [182, -16], [138, 2], [-2, 12], [-142, 2], [-186, -14]]), { tone: 0.72, tone2: 0.9, jitter: 1.6 });
    stroke(g, PP([[-208, -42], [-174, -10], [-82, 8], [-2, 12], [98, 6], [178, -16], [210, -49]]), { w: 11, tone: 0.98, dryness: 0.22, bristles: 10, profile: "brush", loaded: 1, body: 0.4 });
    stroke(g, PP([[-204, -43], [-142, -21], [-2, -10], [138, -21], [206, -49]]), { w: 3.5, tone: 0.85, dryness: 0.35, bristles: 4, profile: "even", body: 0 });

    // lantern on the bow (its light is drawn live, see shared/lights.ts)
    g = on(parts.lantern, boat);
    const [lx, ly] = MITU_BOAT.LANTERN;
    mass(g.wet, PP([[lx - 9, ly + 14], [lx + 9, ly + 14], [lx + 9, ly + 19], [lx - 9, ly + 19]]), { tone: 0.95, jitter: 0.6 });
    stroke(g, PP([[lx - 8, ly + 14], [lx - 10, ly], [lx - 7, ly - 11]]), { w: 2.4, tone: 0.95, dryness: 0.1, bristles: 2, profile: "even", body: 0 });
    stroke(g, PP([[lx + 8, ly + 14], [lx + 10, ly], [lx + 7, ly - 11]]), { w: 2.4, tone: 0.95, dryness: 0.1, bristles: 2, profile: "even", body: 0 });
    mass(g.wet, PP([[lx - 8, ly - 11], [lx + 8, ly - 11], [lx + 4, ly - 18], [lx - 4, ly - 18]]), { tone: 0.95, jitter: 0.6 });
    stroke(g, PP([[lx - 7, ly - 16], [lx, ly - 28], [lx + 7, ly - 16]]), { w: 1.6, tone: 0.9, dryness: 0.2, bristles: 2, profile: "even", body: 0 });

    // Mitu at the stern: head, hair, dress, legs
    g = on(parts.girl, boat);
    const [fx, fy] = MITU_BOAT.GIRL;
    const head = P([fx + 1, fy - 110]);
    blob(g.wet, head[0], head[1], 10, 0.9);
    stroke(g, PP([[fx - 5, fy - 114], [fx - 14, fy - 104], [fx - 17, fy - 86]]), { w: 4, tone: 0.95, dryness: 0.25, bristles: 4, profile: "tip", body: 0.3 });
    mass(g.wet, PP([[fx - 8, fy - 99], [fx + 9, fy - 99], [fx + 18, fy - 42], [fx - 16, fy - 42]]), { tone: 0.38, tone2: 0.5, jitter: 1.5 });
    stroke(g, PP([[fx + 8, fy - 98], [fx + 13, fy - 70], [fx + 18, fy - 43]]), { w: 4, tone: 0.95, dryness: 0.15, bristles: 4, profile: "brush", loaded: 1, body: 0.3 });
    stroke(g, PP([[fx - 16, fy - 43], [fx + 1, fy - 41], [fx + 18, fy - 44]]), { w: 3, tone: 0.9, dryness: 0.3, bristles: 3, profile: "even", body: 0 });
    stroke(g, PP([[fx - 4, fy - 42], [fx - 5, fy]]), { w: 3, tone: 0.95, dryness: 0.1, bristles: 2, profile: "even", body: 0.3 });
    stroke(g, PP([[fx + 5, fy - 42], [fx + 7, fy]]), { w: 3, tone: 0.95, dryness: 0.1, bristles: 2, profile: "even", body: 0.3 });

    // orna trailing behind her
    stroke(g, PP([[fx - 4, fy - 99], [fx - 28, fy - 96], [fx - 50, fy - 104], [fx - 74, fy - 98]]), { w: 7, tone: 0.42, dryness: 0.45, bristles: 6, profile: "tip", loaded: 0.7, body: 0.5 });

    // arms to the oar
    const oar = oarGeometry(pose);
    const sh: Point = [fx + 2, fy - 94];
    stroke(g, PP([sh, [(sh[0] + oar.hand[0]) / 2 + 4, (sh[1] + oar.hand[1]) / 2 + 8], oar.hand]), { w: 3, tone: 0.95, dryness: 0.1, bristles: 3, profile: "even", body: 0.3 });
    stroke(g, PP([[sh[0] + 3, sh[1] + 2], [(sh[0] + oar.lower[0]) / 2 + 6, (sh[1] + oar.lower[1]) / 2 + 4], oar.lower]), { w: 3, tone: 0.95, dryness: 0.1, bristles: 3, profile: "even", body: 0.3 });
    if (pose.side === "near") paintOar(on(isPoseOar, boat), 0.98, oar);

    // an oar placed by hand (lying in the boat, being picked up): last, so it changes nothing above
    if (parts.oar) paintOar(boat, 0.98, parts.oar);

    octx.drawImage(flatten(boat), 0, 0);
    return { img: out, refl: reflect(out, def.ay, 0.38, 130, SEED.REFLECTION) };
}
