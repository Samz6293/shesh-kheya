// Vite settings. The game (index.html) is the only page in the production
// build; render.html and preview.html are opened by the dev server only and
// are left out of dist/ because they aren't listed as build inputs.
import { defineConfig } from "vite";
import notesPlugin from "./scripts/notesPlugin";

export default defineConfig({
    // saves the frame-review notes from preview.html (dev server only)
    plugins: [notesPlugin()],
    server: {
        // a saved note must not reload the preview
        watch: { ignored: ["**/render/notes/**"] },
    },
    build: {
        // clips are loaded as files from public/, so the code bundle stays small
        target: "es2022",
    },
});
