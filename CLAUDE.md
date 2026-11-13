# CLAUDE.md — rules for AI agents in this repo

This is **শেষ খেয়া (Shesh Kheya)**, a short narrative browser game in an ink-wash style. Most of it is pre-rendered video; live code runs only where the player acts.

## Who are you working with?
Two people work here (see `CONTRIBUTING.md`):
- **Sameer** (dh1, repo owner, `git config user.name` = "Sabbir Al Sameer") builds **Chapter 1** and finishes it (S6, polish, deploy). After that he only reviews and merges.
- **Tibbian** writes the story and builds **Chapter 2 onwards** with you. He reviews the previews and play-tests his own scenes, then sends his work to Sameer. He may not know git: you give him every git command to copy-paste, and he runs them. His chapter scripts arrive as PDFs in his own format; never ask him to change it (`add-chapter`).
If you can't tell which one you're talking to, ask once.

**"info"**: when either of them types "info", use the `info` skill: the whole way of working, from setting up git to pushing and messaging Sameer. For Tibbian it starts by asking his operating system and guides him for that.

**"start"**: when either of them types "start", use the `start` skill. It checks `docs/SCENE_STATUS.md` and the current chapter, builds the next scene in order for whoever builds that chapter (one at a time, stopping for their review and play-test), and reports status to the other. When every chapter with a script is done, it says: "All provided chapters are rendered and live. Tibbian needs to add more story."

Only Sameer merges into `main`, and `main` is protected (changes arrive only by pull request). Tibbian works on one branch per chapter (`chapter-2`, …) and never waits for a merge (`save-work`).

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
- **No text in code or video.** Every on-screen string comes from `src/content/**.json`. Don't edit Sylheti wording yourself; Tibbian (and Sameer for Chapter 1) own it.
- **Handoff rules.** Same `composeFrame()` for clips and live frames; rest poses at every join; clips start and end on sync points; 300 ms crossfades; silent videos with sound from cues.
- **Dialogue is the same in every scene (D19; S2 is the template).** One box, `game/Dialogue.ts`, and only `hold()`: a line types out, then waits with the pulsing mark; a click anywhere, Space or Enter moves on. Nothing leaves by itself. Lines are said live between clips, never inside a clip (split the clip instead). In wide shots the speaker gets the light over their head (`game/SpeakerLight.ts` + the scene's `speakerPoint()`); close-ups show the name only.
- **Per-player differences are live.** Never render a flag-dependent detail into a clip; draw it on top, using the clip's track if it moves.
- **Review before render.** Any work that makes or changes a clip: build it in code, send the chapter's builder (Sameer for Chapter 1, Tibbian after) a frame review link per clip (`preview.html#<scene>/<clip>/0`), and stop. Render (`npm run render`) only after their greenlight; notes are in `render/notes/<scene>.json` (see `docs/02-architecture.md`, "Frame review").
- **Change `layout.ts`, re-render the scene** (after the frame review greenlight), and run `npm run check-joins`.
- **No raw numbers or colours in game code.** Positions in `layout.ts`, tuning in a `CONFIG` object, colours in `shared/` or CSS variables.
- **Nothing can be failed.** Wrong input slows things down; it never ends or resets an activity.
- **No hard cuts.** Every change fades.
- **No game engine.** Canvas 2D, HTML video, HTML overlay, Web Audio.
- **Explain in the repo.** File header comment on every file, a labelled comment on each new concept, entries in `docs/LEARNING.md`.
- **Git:** never commit, push, merge or switch branches yourself; Sameer and Tibbian run every such command, from what you give them (`save-work` for Tibbian). Read-only git commands only. Leave `TODO:` comments for postponed work and list them in `docs/BUILD_LOG.md` with a suggested commit message per milestone.
- **Stay in scope.** The current chapter only. No extra features, no refactors outside the current milestone. From Chapter 2 on, don't change Chapter 1's scenes; if shared code changes in a way that could affect them, say so (it goes in the message for Sameer).
