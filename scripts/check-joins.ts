// Checks every join of every finished scene: the game's live frame at the
// handoff against the clip's first or last frame, as the player would see them.
//   npm run check-joins            all scenes
//   npm run check-joins -- s5      one scene
// Fails (exit code 1) when a join differs by more than LIMIT per colour channel.
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { openRenderPage } from "./server";

const run = promisify(execFile);
const FPS = 24;
const LIMIT = 2;                  // out of 255; video compression alone is under 1

// one frame of a clip as a data URL, decoded by ffmpeg with the same colour
// standard (bt709) the clip was encoded with. BMP, not PNG: ffmpeg writes the
// video's colour tags into a PNG and the browser would then shift its colours
async function clipFrame(file: string, index: number): Promise<string> {
    const { stdout } = await run("ffmpeg", [
        "-loglevel", "error", "-i", file,
        "-vf", `select=eq(n\\,${index}),scale=in_color_matrix=bt709:in_range=tv:out_range=full:flags=accurate_rnd+full_chroma_int+bicubic,format=rgb24`,
        "-frames:v", "1", "-f", "image2pipe", "-c:v", "bmp", "-",
    ], { encoding: "buffer", maxBuffer: 64 * 1024 * 1024 });
    if (stdout.length === 0) throw new Error(`Could not read frame ${index} of ${file}`);
    return `data:image/bmp;base64,${stdout.toString("base64")}`;
}

async function main(): Promise<void> {
    const only = process.argv[2];
    const { page, close } = await openRenderPage();
    let failed = 0;
    try {
        const scenes = (await page.evaluate(() => window.R.scenes())).filter((s) => !only || s === only);
        if (scenes.length === 0) throw new Error(`Unknown scene: ${only}`);
        for (const scene of scenes) {
            await page.evaluate((s) => window.R.init(s), scene);
            const joins = await page.evaluate(() => window.R.joins());
            const clips = await page.evaluate(() => window.R.clips());
            for (let i = 0; i < joins.length; i++) {
                const { clip, at } = joins[i];
                const index = at === "start" ? 0 : Math.round(clips[clip] * FPS);
                const frame = await clipFrame(`public/video/${scene}/${clip}.mp4`, index);
                const result = await page.evaluate(([n, f]) => window.R.checkJoin(n, f), [i, frame] as const);
                const ok = result.diff <= LIMIT;
                if (!ok) failed++;
                console.log(`${ok ? "ok  " : "FAIL"}  ${scene}/${clip} ${at.padEnd(5)}  mean difference ${result.diff.toFixed(3)} / 255`);
            }
        }
    }
    finally {
        await close();
    }
    if (failed > 0) {
        console.error(`${failed} join(s) above ${LIMIT}/255. Re-render the scene or check layout.ts.`);
        process.exit(1);
    }
}

main().catch((err) => {
    console.error(err.message);
    process.exit(1);
});
