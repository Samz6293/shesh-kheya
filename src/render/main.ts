// Entry of render.html (dev only). It puts a small set of functions on
// `window.R`; the Node scripts (scripts/render.ts, scripts/check-joins.ts)
// open this page in a headless browser and call them to get the plate, the
// sprites, every clip frame, the tracks, and the join comparison.
// preview.html imports it too, so the review tool draws with the same code.
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

function paintFrame(clip: string, index: number, withFront: boolean): void {
    if (!plate) throw new Error("Call R.init(scene) first");
    composeFrame(ctx, plate, current().clipFrame(clip, index / STAGE.FPS), false, withFront);
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

    // close-up plates and loose pieces (scenes that have them)
    stills() {
        return (current().stills?.() ?? []).map((job) => [job.name, png(job.paint())]);
    },

    clips() {
        return current().clips;
    },

    // one frame of a clip on the canvas, without lights (the game draws those
    // live). The preview calls this alone: no PNG encoding, so scrubbing is quick.
    // It shows the foreground even where the game draws it live (S2's reeds,
    // S3's jetty), so the review page looks like the game
    draw(clip, index) {
        paintFrame(clip, index, true);
    },

    // the frame as the video gets it, as a PNG, for the render script
    frame(clip, index) {
        paintFrame(clip, index, !current().isFrontLive);
        return out.toDataURL("image/png");
    },

    // where the boat is on every frame, so the game can draw lights on top of the video.
    // A clip with no boat (S2) still gets a track, for its darkness and fade; scale 0 = no boat
    track(clip) {
        const track: Track = { fps: STAGE.FPS, frames: [] };
        const count = Math.round(current().clips[clip] * STAGE.FPS);
        for (let i = 0; i <= count; i++) {
            const st = current().clipFrame(clip, i / STAGE.FPS);
            const round = (v: number) => Math.round(v * 1000) / 1000;
            const b = st.boat ?? { x: 0, y: 0, scale: 0, sx: 1, roll: 0 };
            track.frames.push([round(b.x), round(b.y), round(b.scale), round(b.sx), round(st.darkness), round(st.fade), round(b.roll), round(b.lit ?? 1)]);
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
