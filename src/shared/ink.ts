// The one ink colour ramp: cool grey when thin, warm near-black when dense.
// Every stroke, mass and water ring gets its colour here, so the whole game
// looks painted with the same ink.
import { clamp01 } from "./math";

const INK = {
    THIN: [133, 140, 148],        // watery ink: cool grey
    DENSE: [19, 17, 16],          // full ink: warm black
    CURVE: 0.7,
};

// a = strength of the ink, 0..1. Returns a CSS colour string.
export function inkRGBA(a: number): string {
    a = clamp01(a);
    const k = Math.pow(a, INK.CURVE);
    const r = INK.THIN[0] + (INK.DENSE[0] - INK.THIN[0]) * k;
    const g = INK.THIN[1] + (INK.DENSE[1] - INK.THIN[1]) * k;
    const b = INK.THIN[2] + (INK.DENSE[2] - INK.THIN[2]) * k;
    // `| 0` drops the decimals (colour channels are whole numbers)
    return `rgba(${r | 0},${g | 0},${b | 0},${a})`;
}
