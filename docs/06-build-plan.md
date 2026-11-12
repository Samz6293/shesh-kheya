# 06 — Build Plan

The first milestone rebuilds the prototype properly, because everything else sits on it: the renderer, the clip player, the handoff rules and rowing.

Each milestone ends with: `npm run dev` works, `tsc --noEmit` and `npm run build` pass, `scripts/check-joins.ts` passes for every finished scene, an entry in `docs/BUILD_LOG.md` (what was built, any `TODO:`s, a suggested commit message), and 2–4 lines in `docs/LEARNING.md`.

Branch for the first build: `feature/chapter-1`. dh1 reviews and commits per milestone.

---

## M0 — Project setup
- Vite vanilla-ts in this folder (don't overwrite `docs/`, `prototypes/`, `src/content/`, `CLAUDE.md`, `README.md`).
- Two entries: `index.html` (game) and `render.html` (renderer). `render.html` is not part of the production build.
- Dev dependencies: `playwright`, `tsx`. Scripts: `dev`, `build`, `preview`, `render`, `check-joins`.
- Folders from `02-architecture.md`, fonts copied to `public/fonts/`.

**Done when:** both pages open in dev, and the build output contains only the game.

## M1 — Pipeline + S5 (port the prototype)
- `shared/` (compose, depth, ink), `render/` (brush, paper), `scripts/render.ts` (Playwright + ffmpeg, tracks, first/last frames), `scripts/check-joins.ts`.
- `game/`: loop with clock + `waitFor` + `waitSync`, `ClipPlayer`, `Dialogue`, `Choice`, `Hint`, `Sound` (placeholders), `Boat`, start screen, debug panel.
- `scenes/ch1/s5-kalam/` with all five files, and `PushBoat`.

**Done when:**
- [x] `npm run render -- s5` produces the plate, sprites, 3 clips and tracks.
- [x] S5 plays like the prototype, both choices.
- [x] `check-joins` passes for all S5 joins.
- [x] Rowing feels as good as the prototype or better.

**Checkpoint: dh1 plays S5 and approves the feel before anything else is built.** Approved by dh1 on 2026-11-12.

## M2 — Save, transitions, scene order
- `save.ts` (checkpoints, flags, settings), Continue on the start screen, `?scene=` jump, fade helpers, title cards.

**Done when:**
- [ ] Reloading mid-chapter and pressing Continue resumes at the last scene with flags intact.
- [ ] Broken or missing save data starts a new game without errors.

## M3 — S1 Opening
- Black screen, water 3–4 s, narration, game title, chapter card. No video.

**Done when:** no hard cuts; the narration types cleanly.

## M4 — S2 Home
- Plate (house on stilts, veranda, banana trees), sprites (Amma, Dadi), clip `arrive`.
- `BabyKick` on the plate; `PaanMaking` and `LanternOil` on close-up plates; Dadi's ambient lines; oil meter appears and stays.

**Done when:**
- [ ] Each activity finishes within 30 s and can't be failed.
- [ ] `lampOil` is saved; the lantern glow uses it from here on.

## M5 — S3 Rowing and memories
- Clip `board`, then live rowing; gamchha, flute, tiffin floating with a faint glow; `MemoryPickup` (E); flute phrase; picked memories appear in the boat (live overlay).

**Done when:** memories are optional; each sets its flag and plays its line once.

## M6 — S4 Rahim
- Clip `meet`; `NetPull` (Space timing, Rahim's lines on hits 1/3/5); clip `fish`; `FishLift` (drag); the fish stays in the boat.

**Done when:** misses only slip the net back; all three Rahim lines are always heard.

## M7 — S5 in the chapter
- S5 from M1, now reached from S4 with real flags (lamp glow, memories, fish in the boat via tracks).

## M8 — S6 Return and ending
- Clip `return`: dock, fish to Amma, pot close-up, Dadi's line, lightning, music stops, rain builds, fade, Chapter 2 card. `fishGiven = true`.

## M9 — Polish
- Pause menu (Esc when not in a clip): resume, volumes, text speed. Hidden tab pauses everything.
- Preloading a scene ahead; loading indicator if a clip isn't ready.
- Page title, favicon, meta description. Performance pass against `02-architecture.md`.
- `README.md` "How to run" updated.

## M10 — Deploy
- `npm run build`, deploy `dist/` as a static site.

---

## Playtest checklist (before merging to `main`)
- [ ] Whole chapter in 5–7 minutes at a relaxed pace.
- [ ] No visible join anywhere; no hard cuts.
- [ ] Sound never restarts at a join.
- [ ] Every Sylheti line has its English subtitle; nothing is cut off.
- [ ] No activity can be failed; none takes over 30 s.
- [ ] Both Kalam choices tested; flags correct in the debug panel.
- [ ] Esc skip works in every clip and never loses a hold line.
- [ ] Continue works from every scene.
- [ ] Chrome, Firefox, Edge on Windows; Safari if available.
- [ ] Small window, large window, fullscreen.
- [ ] Tab hidden and back: video, sound and game pause and resume.
- [ ] `git grep -n "TODO:"` is empty.
