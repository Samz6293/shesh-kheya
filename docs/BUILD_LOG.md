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

---

## M2 — Save, transitions, scene order

**Built**
- **`game/save.ts`:** one versioned JSON object in `localStorage` under `shesh-kheya-save` (`SaveData`: version, chapter, checkpoint, flags, settings). Every `localStorage` call is in `try/catch`. Loading checks every field: a flag with the wrong type gets its default, `lampOil` is clamped to 0–100, and anything unusable (missing, not JSON, not an object, no checkpoint, a newer version) gives `null`, so the game starts fresh. `MIGRATIONS` is where version upgrades go once the shape changes (empty now).
- **`game/Progress.ts`:** the game's flags and checkpoint. `reach(scene)` saves as each scene starts; `setFlags({...})` merges and saves at once. `game.flags` is gone: scenes read `game.progress.flags` (read-only) and write through `setFlags()`. S5 and `ClipPlayer` updated.
- **Start screen:** Continue (চালিয়ে যাও) shows only when the save's checkpoint is a scene in `SCENES`. Begin starts a new game and keeps the settings. After the last scene the checkpoint becomes `end`, so Continue disappears.
- **`?scene=s5`:** Begin starts a new game at that scene with default flags. An unknown id logs a warning and starts at the beginning.
- **`Fade.to(toBlack, seconds?)`:** optional length for slow story fades (S6).
- **`game/Card.ts`:** title cards (`game.card.show("chapterTitle")`): text from `screens` in `dialogue.json`, fades in over 1.2 s, stays, fades out. It sits above the black curtain. First used in S1 (M3); not seen on screen yet.
- **Debug:** the `save` line shows the checkpoint and flags.

**Resuming:** Continue starts the checkpoint scene from its beginning, with the flags as last saved, including any set during that scene before the reload (e.g. `helpedKalam1` after choosing Help). Each scene must accept its own flags being set already: S5 overwrites `helpedKalam1` on the choice; S3 (M5) should put an already-found memory in the boat instead of in the water.

**New text for the writer to check:** `screens.continue` = "চালিয়ে যাও" / "Continue", taken from `01-game-design.md` (Start screen).

**Checked:** `npx tsc --noEmit`, `npm run build`, `npm run check-joins` (all three S5 joins ok, under 1/255). Browser test with Playwright (no page errors): no save → no Continue; Begin writes a fresh save at `s5`; choosing Help saves `helpedKalam1: true`; reload → Continue → `s5` with `helpedKalam1: true`; broken JSON, `null`, `42`, an array, version 99 and an unknown checkpoint → no Continue, Begin works; wrong field types → defaults for those fields; `?scene=nope` → warning, starts at `s5`. Not play-tested by hand.

**TODOs left:** the existing M8 one in `main.ts` (Chapter 2 card after the last scene).

**Files**
`src/game/save.ts` (new), `src/game/Progress.ts` (new), `src/game/Card.ts` (new), `src/game/main.ts`, `src/game/Fade.ts`, `src/game/ClipPlayer.ts`, `src/types.ts`, `src/scenes/ch1/s5-kalam/play.ts`, `src/content/ch1/dialogue.json`, `src/styles/main.css`, `index.html`, `docs/02-architecture.md`, `docs/LEARNING.md`, `docs/SCENE_STATUS.md`.

**Suggested commit message**
```
Add save, Continue and title cards

The game now saves its checkpoint scene and flags to localStorage as
each scene starts and whenever a flag changes. The start screen
offers Continue when there is a scene to resume. Broken or old save
data is checked field by field and falls back to a new game instead
of crashing.

Also adds ?scene= for testing, an optional length for fades, and a
title card helper for the opening and chapter cards.
```

---

## M3 — S1 Opening

**Built**
- **`scenes/ch1/s1-opening/play.ts`:** black canvas and water alone (`amb_water` 0.6) for 3.5 s, then the narration `s1.opening` centred on black for 9 s, then the game title card (larger, 125 px at 1080p) and the chapter card, with 1.2 s of black between each. About 25 s in all (target 0:25). No video, plate or layout: the folder has only `play.ts`.
- **`SCENES`** in `main.ts` is now `s1`, `s5`. Begin plays S1, then S5 fades in.
- **`Dialogue.setPlace("sky" | "centre")`:** narration over black sits in the middle of the stage; S1 puts it back to `sky` once the line has faded.
- **`Card.show(id, hold, isTitle)`:** `isTitle` sets the game title larger than a chapter card.
- The narration is a **timed** line (no click needed), so the opening plays through like a film. If you'd rather the player click on, change `timed` to `hold` in `play.ts`. Tuning: `CONFIG` in `play.ts`.

**Checked against the script** (`docs/source/chapter-1-script.md`, দৃশ্য ১): water alone 3–4 s, the text slowly appears, the narration line matches `dialogue.json`, the text fades, the game name fades in, then the chapter card. The English lines under the cards are ours (D10, subtitles rule).

**Checked:** `npx tsc --noEmit`, `npm run build`, `npm run check-joins` (S5 unchanged, all ok). Browser run with Playwright, no page errors: every typed prefix of the narration ends on a whole letter (32 samples, 0 broken); every overlay change (curtain, narration, cards, subtitle) fades over several frames, no jumps; timeline narration 3.6–12.6 s, title 14.1–18.3 s, chapter card 20.7–24.4 s, S5 fading in at 25.5 s. Looked at screenshots of each part. Not play-tested by hand (sound not heard).

**TODOs left:** none new.

**Files**
`src/scenes/ch1/s1-opening/play.ts` (new), `src/game/main.ts`, `src/game/Dialogue.ts`, `src/game/Card.ts`, `src/styles/main.css`, `docs/02-architecture.md`, `docs/LEARNING.md`, `docs/SCENE_STATUS.md`.

**Suggested commit message**
```
Add Scene 1: the opening

Black screen and water, then grown-up Mitu's narration, the game
title and the chapter card, each fading in and out. It is all
overlay text and sound, with no video. Begin now plays Scene 1
before Scene 5.
```

---

## M4 — S2 Home

**Built**
- **Plate** (`s2-home/paintPlate.ts`): home at dusk. A saffron wash, the sun on the horizon, a faint far shore, birds, banana trees on a mound, and the tin-roofed house on stilts with a long veranda, on the left (D18: home is on the left). The front layer has reeds in both corners (swaying) and hyacinth.
- **Figures** (`paint.ts`): Amma seated and pregnant, with a hand on her belly; Dadi seated and bent, in a pale sari with the bangle on her wrist; Mitu standing, with a walk. They stand on the veranda floor, not on the water: `FrameSprite.y` = floor line, so no bob and no depth scale. Their reflections are empty pictures.
- **Glints** (`Glint` in `types.ts`, `drawGlints` in `shared/lights.ts`): the kupi in the window and the bangle's glint. They are the same for every player, so they go into the clip. They flicker on waves that divide SYNC, so joins match. The kupi is drawn behind the figures and the bangle on top.
- **Clip `arrive`** (12 s): fades in from black; Mitu walks out of the door to Amma (8 steps) and stops at rest. Cues: the cow at 2.6 s, `s2.intro[0]` timed at 7 s, `s2.intro[1]` held at 10.2 s. The game waits for a sync point (on black) before starting it, so the reeds and kupi match at the join.
- **A1 `BabyKick`**: a soft glow on Amma's belly; hold the mouse there for 2.5 s. Letting go starts the wait again, quietly. The kick: a 3 px shake for 0.4 s, `sfx_kick` + `sfx_ripple`, and a ring of warm light.
- **A2 `PaanMaking`** (close-up): drag the leaf onto the plate, then the lime and the supari onto the leaf (either order), then click the leaf to fold it; the paan goes to Dadi's hand. A piece dropped anywhere else floats home. Whatever can be used next glows. Dadi's two `a2.paan.during` lines come at 2.5 s and are always heard in full, and the bangle's glint goes round as she turns it.
- **A3 `LanternOil`** (close-up): hold on the bottle and it tips over the filler cap and pours; the meter rises. Numbers: the lamp starts at 12 and the bottle holds 72, so it tops out at 84. It ends when the bottle is empty, 2.4 s after the last pour, or at 30 s. Saved as `lampOil`.
- **Oil meter** (`game/OilMeter.ts`, bottom-left, no text): appears at A3 and stays. `main.ts` shows it for every scene after S2, including on Continue.
- **Close-ups** fade in over the wide shot (0.8 s). Each close-up is drawn into a side canvas and blended in whole.
- **Pipeline:** `stills` (pictures with no reflection: close-up plates and pieces) in `SceneRender`, `R.stills()`, `render.ts` and `loadStills()`. A clip with no boat now gets a track with scale 0 = no lantern, and `ClipPlayer` and the join check skip the lantern for it. `render/front.ts` holds the foreground helpers (`frontPart`, `reed`, `packFront`); S5 still has its own copy and is unchanged.
- **Game tools:** `game/Pointer.ts` (the mouse in stage pixels, press and release once per click, cursor).
- **Placeholder sounds:** `amb_crickets`, `sfx_cow`, `sfx_kick`, `sfx_ripple`, `sfx_paan_place`, `sfx_paan_fold`, `sfx_pour` (held).

**Checked:** `npx tsc --noEmit`, `npm run build`, `npm run render -- s2`, `npm run check-joins` (s2/arrive end 0.87/255; the three S5 joins unchanged). Full play-through in a headless browser (Playwright, `?scene=s2`), no page errors:
- Kick: an early release resets it; it kicks after 2.5 s.
- Paan: the leaf dropped off the plate floats back, the lime dropped in the wrong place floats back, and both toppings, the fold and the hand-over work.
- Lantern: pouring and stopping saved `lampOil: 48`; S5 then started with the meter on.
- Screenshots of the walk, the kick ring, both close-ups and the hand-over looked right after two fixes: the kupi glow was over Mitu's head, and the paan jumped back to the plate once given.

Not played by hand; the sounds haven't been heard.

**Notes for dh1**
- **No new text.** A1 and A3 have no key hint, only a glow and the hand cursor. If players miss that they must *hold*, a hint line would need wording from the writer (`screens` in `dialogue.json`).
- **S5's intro doesn't wait for a sync point** (`s5-kalam/play.ts`), so in the chapter its end join can be off by the bob and reed phase. `check-joins` can't see this, because it tests at t = 0. Fix belongs to M7 (S5 in the chapter): `await game.loop.waitSync()` before the intro, like S2.
- **Sizes:** `arrive.mp4` 4.9 MB (limit 5 MB). The S2 PNGs total 14 MB (the four full-screen pictures are about 3.5 MB each, paper grain), the same as S5's. For the M9 performance pass.
- `PaanMaking.ts` is 194 lines, over the ~150 guide; the steps read in order, so I left it whole.

**TODOs left:** none new.

**Files**
New: `src/scenes/ch1/s2-home/{layout,paint,paintPlate,paintCloseups,clips,cues,play}.ts`, `src/game/activities/{BabyKick,PaanMaking,LanternOil}.ts`, `src/game/{Pointer,OilMeter}.ts`, `src/render/front.ts`, `public/assets/s2/*`, `public/video/s2/*`.
Changed: `src/types.ts`, `src/shared/{compose,lights,assets}.ts`, `src/render/{main,scenes,joins}.ts`, `scripts/render.ts`, `src/game/{main,ClipPlayer,placeholders}.ts`, `src/scenes/ch1/s5-kalam/layout.ts` (new frame fields only), `index.html`, `src/styles/main.css`, `docs/02-architecture.md`, `docs/LEARNING.md`, `docs/SCENE_STATUS.md`.

**Suggested commit message**
```
Add Scene 2: home, baby kick, paan and lantern

Home at dusk: the house on stilts, Amma and Dadi on the veranda, and
an arrive clip where Mitu walks out to them. Three live activities
follow, none of which can be failed: hold on Amma's belly for the
baby's kick, make paan for Dadi on a close-up, and pour oil into the
lantern. The oil is saved as lampOil and a meter shows it from here
on.

The pipeline gains figures that stand on a floor, glints (kupi and
bangle) drawn into clips and live frames alike, still pictures for
close-ups, and tracks for clips without a boat.
```

---

## M4 — S2 reworked after dh1's play-test

dh1 found the first version robotic: some lines moved on by themselves and others waited with no sign, it wasn't clear who was speaking, the activities started out of nowhere, the belly had no prompt, holding was too long and Mitu didn't move, the paan had no guidance, Dadi's arm looked cut off, and the lantern just appeared. His answers are recorded as D19 and D20 in `07-decisions.md`.

**Changed**
- **Dialogue (all scenes, D19):** every line waits. A lamp-coloured mark pulses at the bottom-right of the box once the line has typed. A click on the box, Space or Enter moves on; a click elsewhere on the stage no longer does. S1's narration now waits too. `Dialogue.speaker` tells scenes who is talking. `timed()` stays only for S5 until M7.
- **Speaker light** (`game/SpeakerLight.ts`, `drawSpeakerLight`): a warm orb over the speaker's head in the wide shot. It fades out, moves, and fades in when the speaker changes. It is painted over the picture, because a screen glow barely shows on pale paper.
- **S2 as clips between live states.** `layout.ts` `STATES` (arrived, kicked, touching, byDadi, afterPaan, holding, ready); seven clips, each running from one state to the next: `arrive` 12 s, `kick` 3.2 s, `touch` 6 s, `paanbox` 6 s, `handout` 3.2 s, `take` 4 s, `leave` 14 s. 12 joins, all checked.
- **No waiting for sync points in S2.** The reeds are drawn live over its clips (`isFrontLive`, `PlayOptions.overlay`, `drawFront` exported), and the kupi and bangle glints no longer flicker. Nothing in the clips loops, so a clip starts as soon as the line is dismissed. `check-joins` draws the live reeds on the clip side too.
- **Poses** (`s2-home/poses.ts`, shared): Mitu as joints blending stand, kneel and sit, with walking, leaning, reaching and carrying; Amma's hand from lap to belly, and her gasp; Dadi's chuckle, lean and reach. Painters draw from the joints; the game uses them to put the lantern in a hand and the speaker light over a head.
- **Props:** paan box, lantern and small kerosene bottle as sprites that move between hands (`PropPlace`).
- **A1** (`BabyKick.ts`): now an ink hand pulsing over the belly, and one click on it. The kick is in the `touch` clip, and the first kick in `kick`. Light rings can go into clips (`FrameState.ring`).
- **A2** (`PaanMaking.ts`): Dadi is repainted across the plate (one rounded seated shape, the sari end across her, forearms forward, an open hand, the bangle on her other wrist; each part a separate layer on a solid paper silhouette, so the floor lines no longer show through). The box is open in front with leaves, lime and supari. The leaf goes first, then the pieces pause for both bangle lines, then the rest. The picture checklist runs down the right.
- **Plate:** a bamboo walkway from the veranda to the right edge (`floorY()`); Mitu walks off down it in `leave`.

**Checked:** `npx tsc --noEmit`, `npm run build`, `npm run render -- s2`, `npm run check-joins` (all 12 S2 joins ok, worst 1.28/255; S5's three unchanged). Looked at frames from inside every clip; the lantern was too big (as tall as seated Dadi), so I cut it to 60 % and re-rendered. Full play-through in a headless browser, no page errors:
- every line waited for its mark, and Enter, Space and clicks on the box all moved it on;
- a click away from the belly did nothing, and one on it played `touch`;
- in the paan: lime before the leaf couldn't be picked up, the leaf dropped in the wrong place floated back, both bangle lines played, then lime, supari and the fold;
- the lantern: a partial pour saved `lampOil: 38`;
- `leave` faded out and S5 began with the meter on.

Not played by hand; the sounds haven't been heard.

**Notes for dh1**
- **Clip sizes:** `arrive.mp4` is 5.0 MB and `leave.mp4` 5.5 MB, both over the 5 MB per-clip target; S2 totals 20 MB of video. For M9: a higher CRF (one setting in `scripts/render.ts`, shared with S5), or shorter clips.
- S5 still has timed lines inside its clips and starts its intro without a sync point; both go in M7.
- `PaanMaking.ts` (~230 lines) and `clips.ts` (~250) are over the ~150-line guide; each reads in order (the steps, the seven clips), so I kept them whole.

**TODOs left:** none new.

**Files**
New: `src/scenes/ch1/s2-home/poses.ts`, `src/game/SpeakerLight.ts`.
Changed: `src/game/{Dialogue,main,ClipPlayer}.ts`, `src/game/activities/{BabyKick,PaanMaking}.ts`, `src/shared/{compose,lights}.ts`, `src/render/{main,joins,scenes}.ts`, `src/types.ts`, `src/scenes/ch1/s1-opening/play.ts`, `src/scenes/ch1/s2-home/{layout,paint,paintPlate,paintCloseups,clips,cues,play}.ts`, `src/scenes/ch1/s5-kalam/layout.ts` (the new `ring` field only), `index.html`, `src/styles/main.css`, `public/assets/s2/*`, `public/video/s2/*`, `docs/01-game-design.md`, `docs/02-architecture.md`, `docs/07-decisions.md`, `docs/LEARNING.md`.

**Suggested commit message** (for the whole of M4, if committed together)
```
Add Scene 2: home, baby kick, paan and lantern

Home at dusk, told in short clips with live moments between them:
Mitu walks out to Amma, the baby kicks, Amma calls her over and the
player touches the belly; Dadi pulls out her paan box and the player
makes her a paan on a close-up while she talks about her bangle; she
hands Mitu the lantern and the player fills it; Mitu walks off to the
ghat. The oil is saved as lampOil and a meter shows it from here on.

Every line now waits for a click, Space or Enter, with a mark that
shows it is waiting, and a light over the speaker's head shows who
is talking.
```

---

## M4 — S2 after dh1's second play-test

**Changed**
- **A click anywhere moves a line on** (D19 updated), in every scene: the stage listener in `main.ts` (buttons excluded), not the box's own. Space and Enter as before. `PaanMaking` forgets the click that ended Dadi's last line, so it can't pick up a piece.
- **First line sooner:** `arrive` is 5.6 s (was 12): Mitu walks out from 0.8 s to 5.2 s and Amma speaks about 6 s after Begin (was about 15).
- **Veranda no longer floats:** a deck with thickness (16 px), a beam under it, thicker stilts and cross-braces between them.
- **Sun behind the far shore:** painted on its own layer, with the shore's solid outline and everything below the horizon cut out of it. The same in the lantern close-up. (The cut-out first used the sun's own gradient as fill, which only half-erased; now solid.)
- **Banana trees sway:** they are now foreground pieces like the reeds (live over the clips), with `FrontPiece.root` keeping each trunk's foot still. Their reflection stays in the plate.
- **Deleted unused files:** `public/assets/s2/amma.png`, `amma_refl.png`, `dadi.png`, `dadi_refl.png` (sprites from the first S2 build). Every other file in `public/assets` and `public/video` is loaded by the game.

**Checked:** `npx tsc --noEmit`, `npm run build`, `npm run render -- s2`, `npm run check-joins` (all 15 joins ok). Headless play-through of S2, no page errors; a click on the water moves a line on; the crop of both suns shows them behind the shore; two frames 1 s apart show the banana crowns moving. Not played by hand.

**Files**
`src/game/{main,Dialogue}.ts`, `src/game/activities/PaanMaking.ts`, `src/styles/main.css`, `src/types.ts`, `src/shared/compose.ts`, `src/render/front.ts`, `src/scenes/ch1/s2-home/{layout,clips,cues,paintPlate,paintCloseups}.ts`, `public/assets/s2/*`, `public/video/s2/*`, `docs/02-architecture.md`, `docs/07-decisions.md`.

---

## S5 dialogue brought in line with S2 (D19)

dh1: the dialogue box in S5 didn't behave like S2's. S5 still had lines inside its clips that left by themselves (Kalam's four lines of thanks, Mitu's apology), with no go-on mark and no light over the speaker.

**Changed**
- **S5:** every line is said live and waits for the player.
  - Kalam's request comes after the intro clip, no longer inside it.
  - `helped` is split: `helped` (4 s, his boat slides free and comes to rest), then the four lines live (he stands still, `kalam_0`), then the new `farewell` (4 s, his nod and the fade to black).
  - Mitu's apology waits like any line, then `declined` starts on the next sync point.
  - The speaker light sits over Kalam and Mitu and follows the boats' bob (`speakerPoint()` in `s5-kalam/layout.ts`).
- **S5 intro now waits for a sync point** (on black) before it starts, so its end joins the live frame without a jump in the bob or the reeds (the issue noted in M4).
- **Timed lines are gone from the code:** `Dialogue` has only `hold()`; `Cue` has no `line`, `hold` or `dur`; `ClipPlayer` fires only sounds. No scene can fall back to the old behaviour.
- **`SpeakerLight`** follows small moves (a bobbing head) and only fades out to jump to a new speaker. Before this, the bob kept it from ever appearing in S5.
- **`lineCount()`** in `content/text.ts`: a scene says every line of a beat without counting them in code.
- **The rule is written down:** `CLAUDE.md` (hard rules), the `start` skill's checklist, D19, and `02-architecture.md` (Dialogue).

**Checked:** `npx tsc --noEmit`, `npm run build`, `npm run render -- s5 helped` and `farewell`, `npm run check-joins` (all 17 joins ok; new: `s5/helped end` 1.01, `s5/farewell start` 0.79). Headless play-through of both S5 paths and of S2, no page errors:
- every line waited for its mark and moved on with a click on the water;
- Help: steer, push, the four lines, then `farewell`;
- Go home: the apology, then `declined`.

Screenshots show the light over Kalam and over Mitu. Not played by hand.

**Files**
`src/game/{Dialogue,ClipPlayer,SpeakerLight}.ts`, `src/content/text.ts`, `src/types.ts`, `src/scenes/ch1/s5-kalam/{layout,clips,cues,play}.ts`, `public/video/s5/{helped,farewell}.*`, `CLAUDE.md`, `.claude/skills/start/SKILL.md`, `docs/02-architecture.md`, `docs/07-decisions.md`.

---

## Tooling: frame review page (detour before S3)

dh1: video reviews were taking too many rounds (render, watch, describe in words, guess the frame, render again). VideoHub (a Windows-only review studio for code-made films) was looked at and not used: it only runs on Windows and expects one continuous film with a mixed sound file, while this game has short silent clips joined by live play. This page borrows its one idea that fits: review frames straight from the code and pin notes on them, render once at the end.

**Added**
- `preview.html` + `src/preview/{main,Notes}.ts` + `src/styles/preview.css`: pick a scene and clip, scrub, step, play at real speed. Scene, clip and frame are kept in the URL, so a code change reloads onto the same frame.
- `src/preview/BoxTool.ts`: a note points at a box: drag to draw, drag to move, corners to resize, click for a default box, Esc to cancel (dh1's request after the first try: a click point didn't say enough).
- `src/preview/FrameCache.ts`: playback lagged (dh1) because frames are painted from code, up to 500 ms each in S5 intro. The open clip's frames are now stored at half size in the background ("buffering %"), then played from memory. Paused frames are painted full size.
- `R.draw(clip, index)` in `src/render/main.ts`: paints a frame without PNG encoding (about 18 ms a frame in S2); `R.frame()` now calls it. The render output is unchanged.
- `scripts/notesPlugin.ts`: the dev server's `/__notes` route writes `render/notes/<scene>.json` and a picture of each pinned frame. `render/notes/` is git-ignored and not watched, so saving a note doesn't reload the page.
- `ReviewNote` in `src/types.ts`; "Frame review" in `docs/02-architecture.md`; the `start` skill reads the notes when dh1 asks for changes.

**Checked:** `npx tsc --noEmit`, `npm run build` (`dist/` has only the game). Headless runs: `/preview.html#s2/arrive/40` opens on that frame (plate painted in about 6 s); a box drawn by dragging, resized by its corner, moved by dragging (−50, +30 px as expected), saved as JSON + PNG, shown in the list and on the frame, form closed after saving; S5 intro buffered in about 15 s, then played 49 distinct frames in 2.0 s (24 fps; about 5 fps before); no page errors. Not used by hand.

**Not changed:** the full render is as slow as before (about 0.4 s a frame, mostly PNG encoding and transfer, not drawing). Speeding that up would be its own step if it's wanted.

**Suggested commit message**
```
Add a frame review page for clips

Video reviews took many rounds: render a clip, watch it, describe
the problem in words, render again. preview.html draws any clip
frame straight from the renderer code, so a clip can be scrubbed
and checked before it is rendered. A box drawn on a frame holds a
note; the dev server saves it with a picture of that frame to
render/notes/, where the agent reads it and marks it fixed.
Frames are stored at half size once painted, so slow clips still
play at full speed. From now on clips are reviewed there before
they are rendered (CLAUDE.md, start skill, SCENE_STATUS.md).
```

---

## M5 — S3 Rowing and memories

**Built**
- `src/scenes/ch1/s3-rowing/`: the plate (rose dusk, the sky mirrored in the water, afterglow, far trees, hyacinth; the ghat's jetty and reeds as the live foreground), `board` (Mitu walks out along the jetty with the lantern, steps into the stern, sets the lantern on the bow where it lights, walks back and takes up the oar; `board.ts`), `leave` (she rows out of the right edge), cues, and `play.ts`: live rowing, the memories, and the glide to the start of `leave` on a sync point. Outward, left to right (D18).
- `src/game/activities/MemoryPickup.ts`: three things of Abba's float with a faint light; rowing alongside shows "Press E", E lifts the thing into the boat and sets its flag; the scene then says Mitu's lines (D19), the flute's tune first. The memories are drawn live over clips and live frames, and they stay in the boat (D12) wherever there's a track.
- `src/shared/memories.ts` (which three, their flags and lines, where each lies in the boat), `src/render/paintMemories.ts` (their pictures, for any scene that shows them), `src/render/rowing.ts` (S5's clip rowing maths for any scene; S5 keeps its own copy until it is re-rendered).
- Placeholder sounds: `sfx_pickup`, `sfx_flute_memory` (a short tune, `TUNES` in `placeholders.ts`), `sfx_azan_far` (silent until a real recording exists).

**Shared changes**
- `paintMitu(pose, parts)`: the boat can be painted in parts (empty, lantern only, an oar placed by hand). A hidden part is painted onto a spare canvas, so every part keeps its pixels. S5's sprites repaint pixel-identical (checked), so S5 isn't re-rendered.
- `oarAt(angle, grip)` in `mituBoat.ts`; `MITU_BOAT.GIRL` (where she stands, used by `paintMitu`).
- Clip tracks carry `lit` (how brightly the lantern burns); old tracks read as 1. `overlay(ctx, boat)` gets the clip's boat position, so things can ride in it.
- `drawFigures()` in `compose.ts` draws sprites solid on top of a finished frame; a floor sprite can have its own `scale`.
- `MituFloorPose.reachB` (S2's figure can put her back hand on something; S2 unchanged). `Hint.hide(id)` hides only that hint.
- `R.draw()` (the review page) now shows the live foreground (S2's reeds, S3's jetty); the encoded video still leaves it out.
- `main.ts`: S3 plays between S2 and S5.

**Checked:** `npx tsc --noEmit`; frame review by dh1 (no notes); `npm run render -- s3` (`board` 4.9 MB, `leave` 2.1 MB); `npm run check-joins` (all 19 ok; `s3/board end` 1.15, `s3/leave start` 0.85); `npm run build`. Headless play-through with `?scene=s3`: board, steer, the flute picked up (hint, lift, tune, line with the speaker light, `foundFlute` saved, flute in the boat during `leave`), rowing out, glide, `leave`, then S5. No page errors. Not played by hand.

**Known**
- The faint light on each floating memory is weak on the pale paper (it uses the "screen" glow); check it in the play-test.
- Continue into S3 puts the memories back in the water (their flags are cleared as the scene starts), because `board` replays.

**TODOs left:** `placeholders.ts`, a real recording of a far azan (no placeholder is made for it).

**Suggested commit message**
```
Add Scene 3: rowing and Abba's memories

Mitu boards at the ghat, lights the lantern on the bow and takes up
the oar (clip `board`); then the player rows out across the haor.
Abba's gamchha, flute and tiffin box float there with a faint light;
rowing alongside and pressing E lifts one into the boat, where it
stays, and Mitu remembers. Rowing on to the right glides the boat
to where `leave` starts, and she rows out of the picture.

The memories differ per player, so they are drawn live over clips
and live frames; clip tracks now say how brightly the lantern burns,
and the clip overlay knows where the boat is. The boat painter can
paint parts of the boat without changing any existing sprite.
```

---

## M6 — S4 Rahim

**Built**
- `src/scenes/ch1/s4-rahim/`: the plate (grey-violet dusk, clouds building, a far village ghat, the hijol forest on the far right; reeds as the live foreground), Rahim in his fishing boat (`paint.ts`, joints in `layout.ts`), the net at any height and the aair (`paintCatch.ts`), and five clips: `meet` (she rows in, outward), `grab` (she lays the oar down, steps to the stern's edge, turns and takes the net's line), `fish` (they heave it out with the fish thrashing in it; Rahim laughs), `look` (the empty net back in the water, Rahim looks at the sky, she takes up her oar), `leave` (her boat turns for home and she rows out left, D18).
- `src/game/activities/NetPull.ts`: a mark slides along a bar; Space in the warm zone raises the net a step, a miss slips it back a third of a step (always less than a pull gains, so it can't stall). Rahim's three lines after the 1st, 3rd and 5th good pull, each waiting for the player (D9, D19).
- `src/game/activities/FishLift.ts`: drag the fish from the net onto her boat; let go elsewhere and it slides back.
- `src/game/Cargo.ts`: what lies in Mitu's boat (her memories, the fish), drawn live over clips and live frames; `MemoryPickup` uses it now. `src/shared/fish.ts`: the fish's size, flap and where it lies in the boat.
- D21 (dh1): the turn for home is on screen; the net pull stays in the wide shot.

**After dh1's frame review (8 notes, all fixed)**
- For the net Mitu is on her feet (S2's figure, as in S3), hauling like Rahim: knees bent, leaning back, arms a natural length. Both lines go taut as they heave (`Rope.sag`, `ROPE.TAUT`).
- The fish is painted inside the net, under the mesh (`net_fish_0..3`); the net comes up only just clear of the water, below their hands.
- The turn: mid-turn the hull is drawn end-on (bow to the camera, `paintBoatEndOn`); Mitu and the lantern keep their size and ride their spots on the turning boat; oar rings in the water.

**Shared changes:** `FrameState.ropes` (drawn behind the figures), `BoatParts.hands` and `isOarHidden`, `OAR_LYING` / `oarBetween()` and `MITU_BOAT.ON_FOOT_SCALE` moved to `mituBoat.ts` (S3's board uses them; its frames are unchanged, `s3/board end` still 1.15), `GirlOnFoot` (was `S3Girl`), `drawTimingBar()` in `lights.ts`, placeholder sounds `sfx_net_pull`, `sfx_net_slip`, `sfx_fish_jump`. `main.ts`: S4 plays between S3 and S5.

**Checked:** `npx tsc --noEmit`; frame review by dh1 (8 notes fixed, then greenlight); `npm run render -- s4`; `npm run check-joins` (all 27 ok; S4's 8 joins 0.86 to 1.15); `npm run build`. Headless play-through with `?scene=s4`: lines, net pull timed like a player (6 good pulls, finished in about 23 s with Rahim's lines), the fish dragged into the boat (it lies there through `look` and `leave`), `leave`, then on into S5. No page errors. Not played by hand.

**Known**
- `leave.mp4` is 5.3 MB, a little over the 5 MB per clip target (13 s with a lot of motion). It could be shortened or encoded at a higher CRF if that matters for hosting.
- S5 doesn't draw the fish or the memories in her boat yet: that is M7.

**TODOs left:** none new.

**Suggested commit message**
```
Add Scene 4: Rahim, the net and the fish

Mitu rows up to Rahim, who is struggling with his net. She lays her
oar down, takes the line and the player pulls in time (Space); a
miss only lets the net slip back a little. Rahim tells what he saw
of Abba as it comes up, with a big aair in it, which the player
drags into her boat, where it stays. He looks at the sky and sends
her home; her boat turns round on screen and she rows away (D21).

What lies in her boat (memories, the fish) is now drawn by one
Cargo helper over clips and live frames. Frames can draw ropes that
tighten as they are pulled, and the boat painter can show her hands
off the oar.
```

