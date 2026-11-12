// Vite settings. The game (index.html) is the only page in the production
// build; render.html is opened by the dev server for the renderer scripts
// and is left out of dist/ because it isn't listed as a build input.
import { defineConfig } from "vite";

export default defineConfig({
    build: {
        // clips are loaded as files from public/, so the code bundle stays small
        target: "es2022",
    },
});
