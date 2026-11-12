// Keeps every frame of the open clip as a small picture, so playback is smooth.
// Painting a frame from code can take up to half a second (S5 intro), far too
// slow for 24 fps; showing a stored picture takes about a millisecond. The
// frames are painted once, in the background, at half size to save memory
// (a full-size frame is 8 MB). Paused frames are always painted full size.
import { STAGE } from "../shared/depth";

const CONFIG = {
    SCALE: 0.5,             // stored size, as a part of the stage size
};

export default class FrameCache {
    private frames: ImageBitmap[] = [];
    // bumped on every clear(), so a fill that belongs to an old clip stops
    private run = 0;

    constructor(private readonly source: HTMLCanvasElement) {}

    get(index: number): ImageBitmap | undefined {
        return this.frames[index];
    }

    clear(): void {
        this.run++;
        for (const frame of this.frames) frame?.close();     // frees the memory now, not when the browser gets round to it
        this.frames = [];
    }

    // paint frames 0..last one by one, giving the page a turn between frames
    // so scrubbing and typing stay usable; onProgress gets 0..1
    async fill(last: number, paint: (index: number) => void, onProgress: (done: number) => void): Promise<void> {
        const run = this.run;
        for (let i = 0; i <= last; i++) {
            if (run !== this.run) return;
            paint(i);
            // New here: createImageBitmap. Copies the canvas as it is right now
            // into a picture that is quick to draw, resized on the way.
            // Docs: MDN, createImageBitmap()
            const frame = await createImageBitmap(this.source, {
                resizeWidth: STAGE.W * CONFIG.SCALE,
                resizeHeight: STAGE.H * CONFIG.SCALE,
                resizeQuality: "medium",
            });
            if (run !== this.run) {
                frame.close();
                return;
            }
            this.frames[i] = frame;
            onProgress((i + 1) / (last + 1));
            await new Promise((resolve) => setTimeout(resolve, 0));
        }
    }
}
