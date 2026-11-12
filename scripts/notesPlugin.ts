// Saves frame-review notes from preview.html to render/notes/, so the agent
// can read them. A route on the dev server is the simplest way for a page to
// write a file in the repo; the alternative was a download dh1 moves by hand.
// Dev server only: `vite build` never runs configureServer.
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import type { IncomingMessage } from "node:http";
import type { Plugin } from "vite";

const DIR = "render/notes";
const ROUTE = "/__notes";

// scene ids and note ids become file names, so only plain names are allowed
const SAFE_NAME = /^[a-z0-9-]+$/;

interface SaveRequest {
    scene: string
    notes: unknown[]
    picture?: { id: string, png: string }     // PNG data URL of the frame with the pin
    removed?: string                            // id of a deleted note: its picture goes too
}

// a request body arrives in pieces (chunks); join them, then read the JSON
async function readBody(req: IncomingMessage): Promise<string> {
    const chunks: Buffer[] = [];
    for await (const chunk of req) chunks.push(chunk as Buffer);   // safe: Node gives Buffers when no encoding is set
    return Buffer.concat(chunks).toString("utf8");
}

export default function notesPlugin(): Plugin {
    return {
        name: "review-notes",

        // New here: a Vite plugin's configureServer. It gets the dev server, and
        // server.middlewares.use() adds a route next to the ones Vite already has.
        // Docs: Vite, "Plugin API" -> configureServer
        configureServer(server) {
            server.middlewares.use(ROUTE, async (req, res) => {
                try {
                    // read: GET /__notes?scene=s2 -> the scene's notes (empty list if none yet)
                    if (req.method === "GET") {
                        const scene = new URL(req.url ?? "", "http://x").searchParams.get("scene") ?? "";
                        if (!SAFE_NAME.test(scene)) throw new Error(`Bad scene id: ${scene}`);
                        const json = await readFile(`${DIR}/${scene}.json`, "utf8").catch(() => "[]");
                        res.setHeader("Content-Type", "application/json");
                        res.end(json);
                        return;
                    }

                    // write: POST the whole list, plus the new note's picture or the deleted note's id
                    const body = JSON.parse(await readBody(req)) as SaveRequest;   // safe: only preview.html posts here
                    if (!SAFE_NAME.test(body.scene)) throw new Error(`Bad scene id: ${body.scene}`);
                    await mkdir(`${DIR}/${body.scene}`, { recursive: true });
                    await writeFile(`${DIR}/${body.scene}.json`, JSON.stringify(body.notes, null, 4));

                    if (body.picture && SAFE_NAME.test(body.picture.id)) {
                        const png = body.picture.png.slice(body.picture.png.indexOf(",") + 1);
                        await writeFile(`${DIR}/${body.scene}/${body.picture.id}.png`, Buffer.from(png, "base64"));
                    }
                    if (body.removed && SAFE_NAME.test(body.removed)) {
                        await rm(`${DIR}/${body.scene}/${body.removed}.png`, { force: true });
                    }
                    res.end("{}");
                }
                catch (err) {
                    res.statusCode = 400;
                    res.end(JSON.stringify({ message: (err as Error).message }));   // safe: everything thrown above is an Error
                }
            });
        },
    };
}
