# What you learned

Two to four lines per milestone: each new concept and the file it lives in. Every concept also has a "New here:" comment at the place it first appears.

## M0 — Project setup
- **Vite with two pages.** `index.html` and `render.html` both work in `npm run dev`, but only `index.html` is built, because a page has to be listed as a build input to be included. File: `vite.config.ts`. Docs: Vite, "Multi-Page App".
- **`tsc --noEmit`.** TypeScript only checks the code; Vite does the actual building. File: `package.json` (`build` script).

## M1 — Pipeline + Scene 5
- **Canvas 2D compositing.** `multiply` darkens like ink on paper, `screen` brightens like light, `destination-in` / `destination-out` cut shapes out of what is already drawn. Files: `src/shared/compose.ts`, `src/shared/lights.ts`, `src/render/layers.ts`. Docs: MDN, `globalCompositeOperation`.
- **Game loop with delta time.** `requestAnimationFrame` calls the loop about 60 times a second; everything moves by "speed × seconds since last frame", so the game runs the same on any screen. Files: `src/game/Loop.ts`, `src/game/Boat.ts`. Docs: MDN, `requestAnimationFrame`.
- **Turning events into Promises.** `new Promise((resolve) => ...)` and calling `resolve` from an event or from the loop lets a scene be written as a list of `await`s. Files: `src/shared/assets.ts` (`loadImage`), `src/game/Loop.ts` (`waitFor`), `src/game/ClipPlayer.ts` (`play`). Docs: MDN, "Promise() constructor".
- **Video as a picture source.** A `<video>` can be drawn onto a canvas with `drawImage`, and `requestVideoFrameCallback` says exactly which frame is showing. File: `src/game/ClipPlayer.ts`. Docs: MDN, `HTMLVideoElement.requestVideoFrameCallback`.
- **Seeded random numbers.** The same seed gives the same "random" numbers, so a painting comes out identical every time. File: `src/render/seed.ts`.
- **`Intl.Segmenter`.** Splits Bengali text into whole letters, so the typewriter never shows half a conjunct. File: `src/game/Dialogue.ts`. Docs: MDN, `Intl.Segmenter`.
- **Web Audio API.** Sound is built from nodes wired together: source → filter → volume → speakers. File: `src/game/Sound.ts`. Docs: MDN, "Web Audio API".
- **Playwright + ffmpeg from Node.** A script opens a page in a browser with no window, asks it for frames, and pipes them into ffmpeg with `spawn`. Files: `scripts/server.ts`, `scripts/render.ts`. Docs: playwright.dev, "Library"; Node.js, `child_process.spawn`.
- **TypeScript: `keyof typeof` and `satisfies`.** Dialogue ids and sound ids are types made from the data itself, so a mistyped id fails `tsc`. Files: `src/content/text.ts`, `src/game/placeholders.ts`. Docs: TypeScript handbook, "Keyof Type Operator" and "The satisfies Operator".
- **Mirroring with a negative scale.** `ctx.scale(-1, 1)` draws a sprite flipped left-to-right, so one painted pose serves both directions. A scene's `HEADING` (1 or -1) is used as the sprite's `sx` and multiplies every offset that depends on facing (oar rings, the push, Kalam's pole). Files: `src/shared/compose.ts`, `src/scenes/ch1/s5-kalam/layout.ts`. Docs: MDN, `CanvasRenderingContext2D.scale()`.
- **Solid figures on see-through ink (`destination-out` + `destination-over`).** Erase a sprite's outline from the canvas, then draw the paper backing "behind" so it only fills the hole, then multiply the ink on top. Pale washes stop showing what is behind them, and the paper grain stays continuous. File: `src/shared/compose.ts` (`clearBehind`). Docs: MDN, `globalCompositeOperation`.
- **Bending a picture in rows.** A reed is drawn as thin horizontal rows, each shifted sideways by sway × (height above the root)², so the root stays still and the tip moves most. No mesh or library needed. File: `src/shared/compose.ts` (`drawFront`). Docs: MDN, `drawImage()` with a source rectangle.
- **Impulse rowing instead of constant acceleration.** The boat is pushed only during each stroke's pull (a half-sine), and drag grows with speed (`k1·v + k2·v²`, applied as `exp(-k·dt)`), so speed rises and falls with every stroke. File: `src/game/Boat.ts`.
- **Surge in a clip by bending time.** Feed a path `t + A/ω·sin(ω·…)` instead of `t`: its speed is multiplied by `1 + A·cos(ω·…)`, and over whole strokes the extra time sums to zero, so the clip still ends exactly where it did. File: `src/scenes/ch1/s5-kalam/clips.ts` (`surged`).
