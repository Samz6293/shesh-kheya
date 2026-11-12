// The renderer driver: paints a scene's plate and sprites and encodes its clips.
//   npm run render -- s5            plate, sprites and every clip of one scene
//   npm run render -- s5 helped     one clip
//   npm run render -- all           every scene
// Frames are painted by the page (src/render) and piped straight into ffmpeg.
// Needs ffmpeg on PATH and Playwright's Chromium (`npx playwright install chromium`).
import { spawn } from "node:child_process";
import { once } from "node:events";
import { mkdir, writeFile } from "node:fs/promises";
import { dataUrlToBuffer, openRenderPage } from "./server";
import type { Page } from "playwright";

const FPS = 24;
const OUT = { ASSETS: "public/assets", VIDEO: "public/video", CHECK: "render/_check" };

// H.264, 1080p, no audio. bt709 is the colour standard browsers expect for HD
// video; tagging it keeps the clip's colours equal to the live canvas.
function ffmpegArgs(file: string): string[] {
    return [
        "-y", "-loglevel", "error",
        "-f", "image2pipe", "-framerate", String(FPS), "-c:v", "png", "-i", "-",
        // RGB frames -> video colours with the bt709 matrix, rounded exactly
        "-vf", "scale=out_color_matrix=bt709:out_range=tv:flags=accurate_rnd+full_chroma_int+bicubic,format=yuv420p",
        "-c:v", "libx264", "-preset", "medium", "-crf", "20", "-g", String(FPS),
        "-colorspace", "bt709", "-color_primaries", "bt709", "-color_trc", "bt709", "-color_range", "tv",
        "-movflags", "+faststart", "-an", file,
    ];
}

async function renderAssets(page: Page, scene: string): Promise<void> {
    const dir = `${OUT.ASSETS}/${scene}`;
    await mkdir(dir, { recursive: true });
    const plate = await page.evaluate(() => window.R.plate());
    await writeFile(`${dir}/plate.png`, dataUrlToBuffer(plate.plate));
    await writeFile(`${dir}/backing.png`, dataUrlToBuffer(plate.backing));
    await writeFile(`${dir}/front.png`, dataUrlToBuffer(plate.front));
    await writeFile(`${dir}/front.json`, JSON.stringify(plate.pieces));
    const sprites = await page.evaluate(() => window.R.sprites());
    for (const [name, img, refl] of sprites) {
        await writeFile(`${dir}/${name}.png`, dataUrlToBuffer(img));
        await writeFile(`${dir}/${name}_refl.png`, dataUrlToBuffer(refl));
    }
    console.log(`${scene}: plate + ${sprites.length} sprites`);
}

async function renderClip(page: Page, scene: string, clip: string, duration: number): Promise<void> {
    const dir = `${OUT.VIDEO}/${scene}`;
    await mkdir(dir, { recursive: true });
    await mkdir(OUT.CHECK, { recursive: true });
    const started = Date.now();

    // New here: spawn starts another program (ffmpeg) and gives us its input
    // as a stream we can write frames into. Docs: Node.js, child_process.spawn
    const ffmpeg = spawn("ffmpeg", ffmpegArgs(`${dir}/${clip}.mp4`), { stdio: ["pipe", "inherit", "inherit"] });
    const last = Math.round(duration * FPS);           // the frame at t = duration is included
    for (let i = 0; i <= last; i++) {
        const frame = dataUrlToBuffer(await page.evaluate(([c, n]) => window.R.frame(c, n), [clip, i] as const));
        // write() returns false when ffmpeg is busy; wait until it has caught up
        if (!ffmpeg.stdin.write(frame)) await once(ffmpeg.stdin, "drain");
        if (i === 0) await writeFile(`${OUT.CHECK}/${scene}_${clip}_first.png`, frame);
        if (i === last) await writeFile(`${OUT.CHECK}/${scene}_${clip}_last.png`, frame);
    }
    ffmpeg.stdin.end();
    const [code] = await once(ffmpeg, "close");
    if (code !== 0) throw new Error(`ffmpeg failed on ${clip} (exit code ${code})`);

    const track = await page.evaluate((c) => window.R.track(c), clip);
    await writeFile(`${dir}/${clip}.track.json`, JSON.stringify(track));
    console.log(`${scene}/${clip}: ${last + 1} frames in ${Math.round((Date.now() - started) / 1000)} s`);
}

async function main(): Promise<void> {
    const [sceneArg, clipArg] = process.argv.slice(2);
    if (!sceneArg) throw new Error("Usage: npm run render -- <scene|all> [clip]");

    const { page, close } = await openRenderPage();
    try {
        const all = await page.evaluate(() => window.R.scenes());
        const scenes = sceneArg === "all" ? all : [sceneArg];
        for (const scene of scenes) {
            if (!all.includes(scene)) throw new Error(`Unknown scene: ${scene} (have: ${all.join(", ")})`);
            await page.evaluate((s) => window.R.init(s), scene);
            if (!clipArg) await renderAssets(page, scene);
            const clips = await page.evaluate(() => window.R.clips());
            for (const [clip, duration] of Object.entries(clips)) {
                if (clipArg && clip !== clipArg) continue;
                await renderClip(page, scene, clip, duration);
            }
        }
    }
    finally {
        await close();
    }
}

main().catch((err) => {
    console.error(err.message);
    process.exit(1);
});
