// Tells TypeScript that render.html puts the renderer's functions on window.R,
// so both the page and the Node scripts can use it with types.
import type { RenderApi } from "../types";

declare global {
    interface Window {
        R: RenderApi
    }
}
