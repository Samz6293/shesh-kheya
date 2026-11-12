// Starts the Vite dev server and a headless browser on render.html, for the
// render and check-joins scripts. The renderer is ordinary browser code
// (Canvas 2D), so the simplest way to run it from Node is to open the page.
import { createServer, type ViteDevServer } from "vite";
import { chromium, type Browser, type Page } from "playwright";

export interface RenderPage {
    page: Page
    close(): Promise<void>
}

export async function openRenderPage(): Promise<RenderPage> {
    // New here: Vite's JavaScript API. createServer() is what `npm run dev` runs.
    // Docs: Vite, "JavaScript API"
    const server: ViteDevServer = await createServer({
        logLevel: "error",
        // no hot reload: a file saved during a render must not reload the page halfway
        server: { port: 5199, hmr: false, watch: null },
    });
    await server.listen();
    const url = server.resolvedUrls?.local[0];
    if (!url) throw new Error("The dev server did not start");

    // New here: Playwright drives a real browser without a window ("headless").
    // Docs: playwright.dev, "Library"
    const browser: Browser = await chromium.launch();
    const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
    page.on("pageerror", (err) => console.error("page error:", err.message));
    await page.goto(`${url}render.html`);
    await page.waitForFunction(() => window.R !== undefined);

    return {
        page,
        async close() {
            await browser.close();
            await server.close();
        },
    };
}

// "data:image/png;base64,AAAA" -> the bytes
export function dataUrlToBuffer(dataUrl: string): Buffer {
    return Buffer.from(dataUrl.slice(dataUrl.indexOf(",") + 1), "base64");
}
