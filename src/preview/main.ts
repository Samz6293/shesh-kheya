// Entry of preview.html (dev only): watch any clip straight from the renderer
// code, frame by frame, without rendering an MP4. It draws with window.R, the
// same functions the render script uses, so the picture is the one that will
// be encoded. The scene, clip and frame live in the URL (#s2/arrive/37), so
// when a code change reloads the page it comes back to the same frame.
import "../render/main";
import { STAGE } from "../shared/depth";
import FrameCache from "./FrameCache";
import Notes from "./Notes";

const CONFIG = {
    SECOND_STEP: STAGE.FPS,     // Shift + arrow moves one second
};

function byId<T extends HTMLElement>(id: string): T {
    // safe: preview.html has every id this page asks for
    return document.getElementById(id) as T;
}

const R = window.R;
const sceneSelect = byId<HTMLSelectElement>("scene");
const clipSelect = byId<HTMLSelectElement>("clip");
const scrub = byId<HTMLInputElement>("scrub");
const playButton = byId<HTMLButtonElement>("play");
const buffer = byId<HTMLSpanElement>("buffer");

// R paints on #out (hidden); the page shows #view, so painting frames for the
// cache in the background never flickers on screen
const out = byId<HTMLCanvasElement>("out");
const view = byId<HTMLCanvasElement>("view");
view.width = STAGE.W;
view.height = STAGE.H;
const viewCtx = view.getContext("2d");
if (!viewCtx) throw new Error("No 2D canvas");

let scene = "";
let clip = "";
let frame = 0;
let last = 0;
let playing = false;
let playStart = { time: 0, frame: 0 };

const cache = new FrameCache(out);
const notes = new Notes({
    scene: () => scene,
    clip: () => clip,
    frame: () => frame,
    jump: (c, f) => showClip(c, f),
});

function fillSelect(select: HTMLSelectElement, names: string[], picked: string): void {
    select.replaceChildren(...names.map((name) => new Option(name, name, false, name === picked)));
}

// draw the frame, move the slider, update the numbers and the URL.
// Playing uses the stored half-size frame when there is one; otherwise full size from code
function show(index: number): void {
    if (!viewCtx) return;
    frame = Math.min(Math.max(index, 0), last);
    const stored = playing ? cache.get(frame) : undefined;
    if (stored) viewCtx.drawImage(stored, 0, 0, STAGE.W, STAGE.H);
    else {
        R.draw(clip, frame);
        viewCtx.drawImage(out, 0, 0);
    }
    scrub.value = String(frame);
    byId("frame").textContent = String(frame);
    byId("sec").textContent = (frame / STAGE.FPS).toFixed(2);
    history.replaceState(null, "", `#${scene}/${clip}/${frame}`);
    notes.showMarks();
}

function showClip(name: string, index: number): void {
    stop();
    notes.cancel();
    clip = name;
    clipSelect.value = name;
    last = Math.round(R.clips()[name] * STAGE.FPS);   // the frame at t = duration is included, as in the render
    scrub.max = String(last);
    byId("last").textContent = String(last);
    show(index);

    // store the clip's frames in the background for smooth playback
    cache.clear();
    buffer.hidden = false;
    cache.fill(last, (i) => R.draw(name, i), (done) => {
        byId("buffered").textContent = String(Math.round(done * 100));
        buffer.hidden = done === 1;
    });
}

// painting the plate blocks the page for a few seconds, so let the status show first
async function showScene(id: string, clipName?: string, index = 0): Promise<void> {
    stop();
    cache.clear();
    notes.setStatus("painting");
    await new Promise(requestAnimationFrame);
    scene = id;
    sceneSelect.value = id;
    R.init(id);
    const clips = Object.keys(R.clips());
    const name = clipName && clips.includes(clipName) ? clipName : clips[0];
    fillSelect(clipSelect, clips, name);
    await notes.load(id);
    showClip(name, index);
    notes.setStatus("ready");
}

// playback: the frame comes from the clock, so it runs at real speed even
// when drawing is slow (frames are skipped, never slowed down); it loops
function tick(now: number): void {
    if (!playing) return;
    const index = playStart.frame + Math.floor(((now - playStart.time) / 1000) * STAGE.FPS);
    show(index % (last + 1));
    requestAnimationFrame(tick);
}

function play(): void {
    playing = true;
    playButton.dataset.playing = "true";
    playStart = { time: performance.now(), frame: frame === last ? 0 : frame };
    requestAnimationFrame(tick);
}

function stop(): void {
    playing = false;
    playButton.dataset.playing = "false";
}

// stop and repaint the frame at full size
function pause(): void {
    if (!playing) return;
    stop();
    show(frame);
}

// controls
sceneSelect.addEventListener("change", () => showScene(sceneSelect.value));
clipSelect.addEventListener("change", () => showClip(clipSelect.value, 0));
scrub.addEventListener("input", () => {
    stop();
    show(Number(scrub.value));
});
playButton.addEventListener("click", () => (playing ? pause() : play()));

// boxing a note starts with a press on the picture (Notes / BoxTool do the rest)
byId("stage").addEventListener("pointerdown", pause);

window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") notes.cancel();
    if (notes.isWriting) return;          // typing a note: keys belong to the text box
    const step = e.shiftKey ? CONFIG.SECOND_STEP : 1;
    if (e.key === "ArrowRight") {
        stop();
        show(frame + step);
    }
    else if (e.key === "ArrowLeft") {
        stop();
        show(frame - step);
    }
    else if (e.key === " ") playing ? pause() : play();
    else return;
    e.preventDefault();
});

// start: the scene, clip and frame from the URL, else the first scene
const [hashScene, hashClip, hashFrame] = location.hash.slice(1).split("/");
const scenes = R.scenes();
fillSelect(sceneSelect, scenes, hashScene);
showScene(scenes.includes(hashScene) ? hashScene : scenes[0], hashClip, Number(hashFrame) || 0);
