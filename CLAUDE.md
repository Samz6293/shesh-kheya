# CLAUDE.md — rules for AI agents in this repo

This is **শেষ খেয়া (Shesh Kheya)**, a short narrative browser game in an ink-wash style. Most of it is pre-rendered video; live code runs only where the player acts.

## Who are you working with?
Two people work here (see `CONTRIBUTING.md`):
- **The writer** (chapters 2–4) sends chapter scripts as PDFs in his own format and may fix dialogue. His area: `docs/source/`, `src/content/`, `story/`. He may not know git. When a chapter PDF appears (uploaded to `docs/source/` or given to you), use the `add-chapter` skill; use `save-work` to get changes to GitHub, even from a ZIP download. Don't touch code for him, and don't ask him to change how he writes; list code needs in the pull request for dh1.
- **The developer** (dh1, repo owner) works on everything else, following the rules below.
If you can't tell which one you're talking to, ask once.

**"start"**: when either of them types "start", use the `start` skill. It checks `docs/SCENE_STATUS.md` and the current chapter. For dh1 it builds the next scene in order, one at a time, and stops for his play-test. For the writer it only reports status. When every chapter with a script is done, it says: "All provided chapters are rendered and live. Tibbian needs to add more story."

Only dh1 merges into `main`. Never push to `main` yourself; the writer's changes always arrive as a pull request.

## For code work
Read these before writing code, in this order:

0. `docs/HANDOFF.md` — where the project stands, known prototype issues, next steps.
1. `docs/01-game-design.md` — what to build (Chapter 1). The script PDF in `docs/source/` is the final word on story.
2. `docs/07-decisions.md` — answered decisions are binding; don't build on open ones without asking.
3. `docs/02-architecture.md` — stack, the two programs (renderer + game), the handoff rules, folders.
4. `prototypes/s5-cutscene-test/` — a working example of the whole method. Read its README.
5. `docs/05-code-style.md` — how the code must look and be explained. Also use the `dh1-code-style` skill where it applies.
6. `docs/03-art-direction.md`, `docs/04-audio.md` — look and sound.
7. `docs/06-build-plan.md` — milestones and their "done when" checks.

## Hard rules
- **No text in code or video.** Every on-screen string comes from `src/content/**.json`. Don't edit Sylheti wording; dh1 and the writer own it.
- **Handoff rules.** Same `composeFrame()` for clips and live frames; rest poses at every join; clips start and end on sync points; 300 ms crossfades; silent videos with sound from cues.
- **Dialogue is the same in every scene (D19; S2 is the template).** One box, `game/Dialogue.ts`, and only `hold()`: a line types out, then waits with the pulsing mark; a click anywhere, Space or Enter moves on. Nothing leaves by itself. Lines are said live between clips, never inside a clip (split the clip instead). In wide shots the speaker gets the light over their head (`game/SpeakerLight.ts` + the scene's `speakerPoint()`); close-ups show the name only.
- **Per-player differences are live.** Never render a flag-dependent detail into a clip; draw it on top, using the clip's track if it moves.
- **Change `layout.ts`, re-render the scene,** and run `npm run check-joins`.
- **No raw numbers or colours in game code.** Positions in `layout.ts`, tuning in a `CONFIG` object, colours in `shared/` or CSS variables.
- **Nothing can be failed.** Wrong input slows things down; it never ends or resets an activity.
- **No hard cuts.** Every change fades.
- **No game engine.** Canvas 2D, HTML video, HTML overlay, Web Audio.
- **Explain in the repo.** File header comment on every file, a labelled comment on each new concept, entries in `docs/LEARNING.md`.
- **Git (developer's code work):** never commit, push, merge or switch branches; dh1 does that. Read-only git commands only. Leave `TODO:` comments for postponed work and list them in `docs/BUILD_LOG.md` with a suggested commit message per milestone. (The writer is the exception: for them, `save-work` handles git.)
- **Stay in scope.** Chapter 1 only. No extra features, no refactors outside the current milestone.
