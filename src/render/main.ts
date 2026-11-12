// Entry of render.html (dev only). It puts a small set of functions on
// `window.R`; the Node scripts (scripts/render.ts, scripts/check-joins.ts)
// open this page in a headless browser and call them to get the plate, the
// sprites, every clip frame, the tracks, and the join comparison.
import { STAGE } from "../shared/depth";
import { composeFrame } from "../shared/compose";
import { context } from "./layers";
import { checkJoin } from "./joins";
import { SCENES } from "./scenes";
import type { PaintedPlate, RenderApi, SceneRender, Track } from "../types";

// safe: render.html always has <canvas id="out">
const out = document.getElementById("out") as HTMLCanvasElement;
out.width = STAGE.W;
out.height = STAGE.H;
const ctx = context(out);

let sceneId = "";
let scene: SceneRender | null = null;
let plate: PaintedPlate | null = null;

function current(): SceneRender {
    if (!scene) throw new Error("Call R.init(scene) first");
    return scene;
}

function png(c: CanvasImageSource): string {
    // safe: every painter returns a canvas
    return (c as HTMLCanvasElement).toDataURL("image/png");
}

const api: RenderApi = {
    scenes() {
        return Object.keys(SCENES);
    },

    init(id) {
        if (!SCENES[id]) throw new Error(`Unknown scene: ${id}`);
        sceneId = id;
        scene = SCENES[id];
        plate = scene.paintPlate();
    },

    plate() {
        if (!plate) throw new Error("Call R.init(scene) first");
        return { plate: png(plate.img), backing: png(plate.backing), front: png(plate.front.img), pieces: plate.front.pieces };
    },

    // [name, picture, reflection] for every sprite the game needs
    sprites() {
        return current().spriteJobs().map((job) => {
            const art = job.paint();
            return [job.name, png(art.img), png(art.refl)];
        });
    },

    clips() {
        return current().clips;
    },

    // one frame of a clip, without lights (the game draws those live)
    frame(clip, index) {
        if (!plate) throw new Error("Call R.init(scene) first");
        composeFrame(ctx, plate, current().clipFrame(clip, index / STAGE.FPS), false);
        return out.toDataURL("image/png");
    },

    // where the boat is on every frame, so the game can draw lights on top of the video
    track(clip) {
        const track: Track = { fps: STAGE.FPS, frames: [] };
        const count = Math.round(current().clips[clip] * STAGE.FPS);
        for (let i = 0; i <= count; i++) {
            const st = current().clipFrame(clip, i / STAGE.FPS);
            if (!st.boat) throw new Error(`Clip ${clip} has no boat to track`);
            const round = (v: number) => Math.round(v * 1000) / 1000;
            track.frames.push([round(st.boat.x), round(st.boat.y), round(st.boat.scale), round(st.boat.sx), round(st.darkness), round(st.fade), round(st.boat.roll)]);
        }
        return track;
    },

    joins() {
        return current().joins;
    },

    checkJoin(index, clipFrame) {
        return checkJoin(sceneId, current(), index, clipFrame);
    },
};

window.R = api;
