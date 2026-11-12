# Build log

One entry per milestone: what was built, files touched, `TODO:`s left, and a suggested commit message. dh1 reviews and commits each milestone himself.

---

## M0 — Project setup

**Built**
- Vite + TypeScript (strict) project in the repo root. Two pages: `index.html` (the game) and `render.html` (the renderer, dev only). `npm run build` puts only the game in `dist/`.
- Scripts: `dev`, `build` (`tsc --noEmit` then `vite build`), `preview`, `render`, `check-joins`.
- Dev dependencies: `vite`, `typescript`, `playwright`, `tsx`, `@types/node`. No runtime dependencies.
- Folders from `02-architecture.md`; Tiro Bangla copied to `public/fonts/`.

**Files**
`package.json`, `package-lock.json`, `tsconfig.json`, `vite.config.ts`, `index.html`, `render.html`, `public/fonts/tiro-bangla-bengali-400-normal.woff2`

**TODOs left:** none.

**Suggested commit message**
```
Set up Vite and TypeScript project

Add the build setup for the game: a Vite project with strict
TypeScript and two pages. index.html is the game and the only page
in the production build; render.html is the dev-only renderer page
driven by the render and check-joins scripts.
```

---

## M1 — Pipeline + Scene 5

**Built**
- **Shared drawing code** (`src/shared/`): the ink colour ramp, the water plane (depth, scale, bob), Mitu's boat geometry, asset paths and loaders, `composeFrame()`, and the live lights (lantern glow, row-to marker).
- **Renderer** (`src/render/`, `scripts/render.ts`): the ink brush engine ported from the prototype (seeded random, strokes, masses, wet/dry layers, paper), the Mitu painter, and a Node script that opens `render.html` in headless Chromium and pipes PNG frames into ffmpeg. It writes the plate, 17 sprites with reflections, 3 clips, a track per clip, and the first/last frame of each clip to `render/_check/`.
- **Join check** (`scripts/check-joins.ts`): for each join in a scene's `layout.ts`, compares the game's live frame with the clip's frame (decoded from the MP4, lights drawn on top). Fails above 2/255.
- **Game tools** (`src/game/`): `Loop` (clock, `waitFor`, `wait`, `waitSync`), `ClipPlayer`, `Dialogue`, `Choice`, `Hint`, `Sound` (placeholders by id), `Fade`, `Debug`, `Boat` (rowing), start screen in `main.ts`.
- **Scene 5** (`src/scenes/ch1/s5-kalam/`): `layout.ts`, `paint.ts` + `paintPlate.ts`, `clips.ts`, `cues.ts`, `play.ts`; activity `PushBoat`.

**Checked**
- `npx tsc --noEmit`: passes. `npm run build`: passes (37 kB of game code).
- `npm run check-joins`: intro end 0.82, helped start 0.79, declined start 0.99 (limit 2, out of 255).
- Played by script in headless Chromium, both choices: intro, Kalam's line, choice, rowing to Kalam, contact, push with release and resume, `helped` starting exactly on a sync point, `declined`, Esc skip, hold line still shown after skipping the intro, back to the start screen. No page errors.
- **Not checked by me:** sound (no speakers here), rowing feel by hand, and the real MP4s in a browser. Playwright's Chromium cannot decode H.264, so the scripted test used WebM copies of the clips. dh1's play-through covers these.

**Different from the docs, and why**
- **Clips are drawn onto the canvas**, not shown as `<video>` elements on top. Handoff rule 7 needs the lantern glow drawn live on top of clips (it depends on `lampOil`), and Canvas blend modes only work inside one canvas. The 300 ms crossfades happen in the canvas.
- **Clips contain no lantern glow.** The prototype baked it in. Each clip now has a track (`<clip>.track.json`: boat x, y, scale, flip, darkness, fade per frame) and `ClipPlayer` draws the glow from it.
- **`Loop.ts`, not `loop.ts`**: it is a class file, and `05-code-style.md` names class files in PascalCase.
- **Extra files** beyond the folder list in `02-architecture.md`, to keep files near 150 lines: `shared/math.ts`, `shared/mituBoat.ts`, `shared/assets.ts`, `shared/lights.ts`, `shared/flags.ts`, `render/seed.ts`, `render/mass.ts`, `render/layers.ts`, `render/paintMitu.ts`, `render/scenes.ts`, `render/joins.ts`, `scripts/server.ts`, `content/text.ts`, `game/placeholders.ts`, `game/Fade.ts`, `game/Debug.ts`, `s5-kalam/paintPlate.ts`.
- **Four files are over 150 lines**: `ClipPlayer.ts` (201), `paintPlate.ts` (173), `Boat.ts` (165), `Sound.ts` (164). Each is one class or one painting; splitting them would scatter one idea over two files.
- **Frames go to ffmpeg as PNG, with exact bt709 colour conversion.** JPEG frames and ffmpeg's default conversion gave a colour shift of about 2/255, right at the limit.
- **Debug read-out labels are in code.** It is a developer tool, not game text.

**Fixes to the prototype's known issues** (`HANDOFF.md`)
- Help path contact: any touch with Kalam's hull now eases Mitu into the contact pose (longer slides take longer). The target has a pulsing light and a spreading ink ring. The Space hint shows when she is close.
- Oar sound: still a placeholder, but rebuilt as a short "chuk" plus a soft pull, with 3 good and 2 bad variations, never the same twice in a row, ±4 % pitch and ±10 % volume. Real recordings are still needed.

**Text added to `dialogue.json`**
- `screens.begin`: "শুরু করো" / "Begin" (the start button; wording from `01-game-design.md`).

**TODOs left**
- `src/game/Sound.ts:36` — load `public/audio/<id>.ogg|.m4a` when a recording exists and use it instead of the placeholder.
- `src/game/main.ts:106` — after the last scene, show the Chapter 2 card instead of going back to the start screen (M8).

**Files**
`src/types.ts`, `src/content/text.ts`, `src/content/ch1/dialogue.json`, `src/shared/*`, `src/render/*`, `src/game/*`, `src/game/activities/PushBoat.ts`, `src/scenes/ch1/s5-kalam/*`, `src/styles/main.css`, `scripts/*`, `public/assets/s5/*` (plate + 34 sprite PNGs), `public/video/s5/*` (3 MP4s, 3 tracks), `docs/BUILD_LOG.md`, `docs/LEARNING.md`

**Suggested commit message**
```
Add render pipeline and playable Scene 5

Port the Scene 5 prototype into the TypeScript structure. The
renderer paints the plate, sprites and clips from code and the game
draws live frames with the same composeFrame(), so clips and live
play join without a visible seam (check-joins: under 1/255).

The lantern glow is no longer part of the clips. The game draws it
on top of each clip from a per-frame track, because its size will
depend on the player's lamp oil.

Steering up to Kalam now snaps into the contact pose on any touch
with his hull, and the target is marked on the water.
```

---

## M1 — changes after dh1's first play-test

**Changed**
- **Controls (D17).** `Boat.ts` is now direct steering: D forward, A back, W away, S toward the camera. The boat always faces right. Strokes, rings and the oar sound play by themselves every 0.65 s while the boat is steered. Rhythm, turning and rocking are gone. Tuning: `ACCEL`, `MAX_SPEED`, `DRAG` in `CONFIG`.
- **Oar sound.** Rebuilt to sound like water: a deep push, a rising swoosh, and a few drops (short tones sliding upward) as the blade lifts. Three variations. The "bad stroke" sounds were removed with the rhythm. Still a placeholder made with Web Audio; I could not listen to it here.
- **Docs** brought in line: `01-game-design.md` (A4, echo table), `02-architecture.md` (boat controller), `05-code-style.md` (header example), `07-decisions.md` (D2, new D17), `story/bible.md` (controls).

**Checked:** `npx tsc --noEmit`, `npm run build`, `npm run check-joins` (unchanged: no layout change, no re-render). Scripted play in headless Chromium: D, A, S, W+D, glide to a stop, contact, push, `helped` on the sync point.

**Text added to `dialogue.json`**
- `screens.steerHint`: "W A S D চাপিয়া নাও চালাও।" / "Use W A S D to steer the boat." **The Sylheti is my draft and needs dh1's or the writer's review.** `screens.rowingHint` is now unused and left in place.

**Files**
`src/game/Boat.ts`, `src/game/activities/PushBoat.ts`, `src/game/Sound.ts`, `src/game/placeholders.ts`, `src/game/ClipPlayer.ts`, `src/scenes/ch1/s5-kalam/play.ts`, `src/shared/math.ts`, `src/types.ts`, `src/content/ch1/dialogue.json`, the docs above.

**Suggested commit message** (if committed separately from M1)
```
Steer the boat with W A S D

Replace rhythm rowing with direct steering: D and A move the boat
forward and back, W and S away from and toward the camera. The
rhythm controls felt too strange in the first play-test of Scene 5.

Rebuild the placeholder oar sound as a push of water with a rising
swoosh and a few drops, so it reads as an oar in water.
```

---

## M1 — changes after dh1's second play-test

**Changed**
- **Hold Space hint.** It no longer appears when Mitu is merely close to Kalam. The steer hint hides when the boats touch, and the Space hint (with its bar) appears once the docking slide has finished. File: `src/game/activities/PushBoat.ts`.
- **Go home: shorter wait before Mitu rows away.** Two causes, both fixed:
  - The game sat idle after Mitu's apology, waiting for the next sync point (up to 4.6 s). Her line now fills that wait: it shows without needing a click, stays until the clip has started, and the clip starts on the first sync point at least 1.8 s away. Files: `play.ts` (`DECLINE_READ`, `DECLINE_LINGER`), `src/game/Loop.ts` (`waitSync(lead)`, `untilSync`).
  - Inside the `declined` clip she turned at 1.6 s and rowed from 2.5 s. Now she turns at 0.5 s and rows from 1.4 s, while Kalam nods. Files: `layout.ts` (`DECLINED_ROW.T0`), `clips.ts`. Re-rendered: `public/video/s5/declined.mp4` and its track.

**Checked:** `npx tsc --noEmit`, `npm run build`, `npm run check-joins` (declined start 0.99/255). Scripted Go home path in headless Chromium.

**Suggested commit message** (if committed separately)
```
Tighten Scene 5 hint and Go home timing

Show the Hold Space hint only after the boats have lined up, and
let Mitu turn away sooner when the player chooses to go home: her
line now covers the wait for the sync point, and the declined clip
starts her turn half a second in.
```

---

## M1 — direction of travel (D18)

**Changed**
- **New rule (D18):** home is on the left; leaving home Mitu travels left to right, going back right to left. `JOURNEY.OUTWARD` / `JOURNEY.HOMEWARD` in `src/shared/mituBoat.ts`; each scene sets `HEADING` in its `layout.ts`.
- **S5 mirrored (homeward).** Kalam at x 620, Mitu starts at 1360, contact at 884; hyacinth moved round Kalam, hijol trees to the right. Both boats face left. The push moves left (`PUSH_DX`). `helped`: Kalam's freed boat glides left, towards home. `declined`: no turn any more; Mitu rows on past Kalam in the foreground (13 strokes, was 11).
- **`Boat.ts`:** takes a `facing`; D / A are now right / left on screen (`KEYS.RIGHT` / `KEYS.LEFT`); rings use the facing.
- **Docs:** `01-game-design.md` (A4), `02-architecture.md` (boat controller), `03-art-direction.md` (composition), `07-decisions.md` (D18), `story/bible.md`, `LEARNING.md`.

**Checked:** `npx tsc --noEmit`, `npm run render -- s5`, `npm run check-joins` (all three joins ok, under 1/255). Looked at frames of every clip. Not play-tested by hand.

**TODOs left:** none.

**Files**
`src/shared/mituBoat.ts`, `src/game/Boat.ts`, `src/types.ts`, `src/scenes/ch1/s5-kalam/{layout,clips,play,paintPlate}.ts`, `public/assets/s5/*`, `public/video/s5/*`, the docs above.

**Suggested commit message**
```
Mirror Scene 5: homeward journeys run right to left

Home is always on the left: leaving home Mitu travels left to right,
going back right to left (D18). Scene 5 is on the way home, so Mitu
now rows in from the right, Kalam is stuck between her and home, and
on "Go home" she rows on past him instead of turning round.
```

---

## M1 — S5 fixes after review: solid figures, Mitu leaves on "Go home"

**Changed**
- **Figures no longer see-through.** The hyacinth showed through Kalam's hull, and Kalam showed through Mitu's dress, because ink is drawn with `multiply`. `composeFrame` now clears each sprite's outline to a new **backing** image (the plate's paper and sky, no scenery) before drawing its ink, far to near. The outline is the sprite's own alpha, blurred 1.5 px and made solid; it is built once per sprite and cached. Tuning: `SOLID` in `compose.ts`.
- **Backing image.** `paintPlate()` now returns `{ img, backing }`; the renderer writes `public/assets/s5/backing.png`; `loadPlate()` in `shared/assets.ts` loads both. `composeFrame` takes a `Plate` instead of an image.
- **`declined` clip:** Mitu speeds up from rest and rows steadily off the left edge (x −380 by 9.8 s, before the fade ends). Before, she stopped at x 300 and stayed on screen.

**Checked:** `npx tsc --noEmit`, `npm run render -- s5`, `npm run check-joins` (all ok, under 1/255). Looked at the overlap frames (Mitu passing Kalam, Kalam over the hyacinth) and the end of `declined`. Not play-tested by hand.

**TODOs left:** none.

**Files**
`src/shared/compose.ts`, `src/shared/assets.ts`, `src/types.ts`, `src/render/main.ts`, `src/render/joins.ts`, `scripts/render.ts`, `src/scenes/ch1/s5-kalam/{paintPlate,clips,play}.ts`, `public/assets/s5/*`, `public/video/s5/*`, `docs/02-architecture.md`, `docs/03-art-direction.md`, `docs/LEARNING.md`.

**Suggested commit message**
```
Make figures solid and let Mitu row off screen in Scene 5

Ink is drawn with multiply, so pale washes showed whatever was
behind them: hyacinth through Kalam's hull, Kalam through Mitu's
dress. Each sprite now clears its outline to the plate's bare paper
and sky before its ink goes on.

On "Go home" Mitu now rows out past the left edge instead of
stopping mid-screen.
```

---

## M1 — S5: reeds in front, swaying

**Changed**
- **Reeds were behind the boat.** They were painted into the plate, so Mitu's boat was drawn over them in the bottom corners. The near bank and the 28 reeds are now a separate **front** layer, drawn after every boat (before the darkness wash).
- **Reeds sway,** in the clips and in live play. Each reed is its own piece in an atlas (`front.png`, places and sway in `front.json`); `drawFront()` in `compose.ts` bends it row by row. The wind is two waves of 4 s and 2 s (both divide SYNC), so the reeds are in the same place at every join. Each reed has its own phase; the tip moves up to 5 % of the reed's height. Tuning: `SWAY` in `compose.ts`, `FRONT` in `paintPlate.ts`.
- `Plate` now carries `front`; `loadPlate()` loads it; `R.plate()` returns an object.

**Checked:** `npx tsc --noEmit`, `npm run render -- s5`, `npm run check-joins` (all ok, under 1/255). Looked at intro frames (Mitu's boat passing behind the right reeds) and two frames 1 s apart (the reeds move). Not play-tested by hand; the bending costs about 1,800 small `drawImage` calls a frame, which should be fine, but watch the frame rate in `?debug`.

**TODOs left:** none.

**Files**
`src/shared/compose.ts`, `src/shared/assets.ts`, `src/types.ts`, `src/render/main.ts`, `scripts/render.ts`, `src/scenes/ch1/s5-kalam/paintPlate.ts`, `public/assets/s5/*` (new: `front.png`, `front.json`), `public/video/s5/*`, `docs/02-architecture.md`, `docs/03-art-direction.md`, `docs/LEARNING.md`.

**Suggested commit message**
```
Draw Scene 5 reeds in front of the boats and let them sway

The reeds were part of the background plate, so Mitu's boat was
drawn over them. They are now a foreground layer drawn after every
boat, and each reed bends in the wind, in the clips and live, on a
4 s cycle so clips and live play still join without a jump.
```

---

## M1 — S5: rowing feels like rowing, not gliding

**Changed**
- **Live boat (`Boat.ts`).** Before, a held key gave a steady push, so the boat slid at an even speed with the strokes only as decoration. Now each stroke pushes only while the oar pulls (half-sine, 0.36 s, `THRUST` 880), and drag grows with speed (`DRAG` 1.6 + `DRAG_FAST` 0.002 × speed). The boat surges on each pull and eases between (about 115–210 px/s, average ~157) and coasts to a stop in about 2 s. Tuned in a small simulation first.
- **Bow lift.** On each pull the bow rises up to 0.022 rad and settles (`strokePitch` in `shared/mituBoat.ts`); the sprite's `roll` carries it. The lantern glow rides with it: `BoatAnchor` has `roll`, `localToScreen` rotates, and clip tracks now have a 7th entry, roll (older tracks read as 0).
- **Wake.** Small rings off the stern every 0.3 s while moving faster than 40 px/s (`WAKE`, `wakeRing`).
- **Clips match.** `intro` and `declined` use `surged()` (the path runs faster and slower in step with the strokes, ±30 %, ending where it did), `rowPitch()` and `wakeRings()`. `helped` is unchanged (Mitu only drifts there).

**Checked:** `npx tsc --noEmit`, `npm run build`, `npm run render -- s5`, `npm run check-joins` (all ok, under 1/255). From the tracks: clip speed now rises and falls with every stroke; roll is 0 at every join. **Not play-tested by hand**, so the feel of the live numbers needs dh1's play-test. Tuning: `THRUST`, `DRAG`, `DRAG_FAST` in `Boat.ts`; `SURGE` in `clips.ts`; `WAKE` in `mituBoat.ts`.

**TODOs left:** none.

**Files**
`src/game/Boat.ts`, `src/game/ClipPlayer.ts`, `src/shared/mituBoat.ts`, `src/shared/depth.ts`, `src/shared/lights.ts`, `src/types.ts`, `src/render/main.ts`, `src/render/joins.ts`, `src/scenes/ch1/s5-kalam/{clips,layout,play}.ts`, `public/video/s5/*`, `docs/01-game-design.md`, `docs/02-architecture.md`, `docs/LEARNING.md`.

**Suggested commit message**
```
Make rowing surge with each stroke instead of gliding

Each oar stroke now pushes the boat only while the oar pulls, and
drag grows with speed, so the boat surges and eases like a real
rowing boat. The bow lifts slightly on each pull and a small wake
trails behind. The Scene 5 clips follow the same rhythm.
```

---

## M1 — S5: Mitu's apology no longer lingers

**Changed:** `s5.declined` stayed up until the `declined` clip started plus 1 s. The clip waits for a sync point, so that was anything from 2.8 to 6.8 s. It is now up for a fixed `DECLINE_SHOW` = 3.2 s (`play.ts`); the clip still starts on the first sync point at least 1.8 s after the choice.

**Checked:** `npx tsc --noEmit`, `npm run build`. No render needed (live only). Not play-tested by hand.

**Suggested commit message**
```
Show Mitu's apology in Scene 5 for a fixed time

It stayed up until the Go home clip started, which could take up to
seven seconds. It now shows for 3.2 s.
```
