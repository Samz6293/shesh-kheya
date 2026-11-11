# CLAUDE.md — rules for AI agents in this repo

This is **শেষ খেয়া (Shesh Kheya)**, a short narrative browser game in an ink-wash style. Most of it is pre-rendered video; live code runs only where the player acts. Read these before writing code, in this order:

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
- **Per-player differences are live.** Never render a flag-dependent detail into a clip; draw it on top, using the clip's track if it moves.
- **Change `layout.ts`, re-render the scene,** and run `npm run check-joins`.
- **No raw numbers or colours in game code.** Positions in `layout.ts`, tuning in a `CONFIG` object, colours in `shared/` or CSS variables.
- **Nothing can be failed.** Wrong input slows things down; it never ends or resets an activity.
- **No hard cuts.** Every change fades.
- **No game engine.** Canvas 2D, HTML video, HTML overlay, Web Audio.
- **Explain in the repo.** File header comment on every file, a labelled comment on each new concept, entries in `docs/LEARNING.md`.
- **Git:** never commit, push, merge or switch branches. Read-only git commands only. Leave `TODO:` comments for postponed work and list them in `docs/BUILD_LOG.md` with a suggested commit message per milestone.
- **Stay in scope.** Chapter 1 only. No extra features, no refactors outside the current milestone.
