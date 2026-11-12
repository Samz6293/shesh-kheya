// Building a scene's foreground (reeds, hyacinth, the near bank): each piece
// is painted on its own small canvas, then all pieces are packed side by side
// into one atlas picture plus a list of where each goes and how it sways.
// The same idea as S5's paintPlate.ts, as a helper so S2 doesn't copy it.
// RENDER only.
import { STAGE } from "../shared/depth";
import { stroke } from "./brush";
import { context, flatten, group, makeCanvas } from "./layers";
import { rr } from "./seed";
import type { FrontPiece, InkLayer, PaintedPlate, Point, StrokeOptions } from "../types";

const FRONT = {
    PAD: 24,                      // px of room round each piece for the ink's bleed
    GAP: 2,                       // px between pieces in the atlas
    REED_SWAY: 0.05,              // how far a reed's tip moves, as a share of its height
};

export interface FrontPart {
    art: HTMLCanvasElement
    piece: FrontPiece
}

// one piece covering x0..x1 from y0 down to the bottom of the screen.
// paint() draws in screen coordinates; it is moved into the piece's own canvas.
// rootY: the screen height where it is fixed (a tree's foot); below it nothing moves
export function frontPart(x0: number, x1: number, y0: number, sway: number, paint: (g: InkLayer) => void, rootY?: number): FrontPart {
    const x = Math.floor(x0 - FRONT.PAD), y = Math.floor(y0 - FRONT.PAD);
    const w = Math.ceil(x1 + FRONT.PAD) - x, h = STAGE.H - y;
    const g = group(w, h);
    g.wet.translate(-x, -y);
    g.dry.translate(-x, -y);
    paint(g);
    // the atlas position (sx) is filled in when the pieces are packed
    const piece: FrontPiece = { sx: 0, sy: 0, w, h, x, y, sway, phase: rr(0, Math.PI * 2) };
    if (rootY !== undefined) piece.root = rootY - y;
    return { art: flatten(g), piece };
}

// one reed from the bottom edge at x, h tall, leaning by `lean` px at the tip
export function reed(x: number, h: number, lean: number, options: StrokeOptions): FrontPart {
    const H = STAGE.H;
    const pts: Point[] = [[x, H + 10], [x + lean * 0.15, H - h * 0.45], [x + lean * 0.55, H - h * 0.8], [x + lean, H - h]];
    const xs = pts.map((p) => p[0]);
    return frontPart(Math.min(...xs), Math.max(...xs), H - h, h * FRONT.REED_SWAY, (g) => stroke(g, pts, options));
}

// pack the pieces side by side into one picture: one file for the game to load
export function packFront(parts: FrontPart[]): PaintedPlate["front"] {
    const width = parts.reduce((sum, p) => sum + p.piece.w + FRONT.GAP, 0);
    const height = Math.max(...parts.map((p) => p.piece.h));
    const atlas = makeCanvas(width, height), actx = context(atlas);
    let sx = 0;
    for (const p of parts) {
        p.piece.sx = sx;
        actx.drawImage(p.art, sx, 0);
        sx += p.piece.w + FRONT.GAP;
    }
    return { img: atlas, pieces: parts.map((p) => p.piece) };
}
