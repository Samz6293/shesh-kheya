# Handoff — where the project stands

Written at the end of the planning session (12 Nov 2026) so a new Claude session starts with the same context. Read this after `CLAUDE.md`. The numbered docs say *what* to build; this file says *how we got here* and *what's next*.

## History, in order
1. Read the Chapter 1 script (`docs/source/chapter-1-script.pdf`), wrote docs 01–08 and `src/content/ch1/dialogue.json` (all 34 lines, Sylheti + English).
2. Art direction changed from flat silhouettes to **ink wash**, inspired by `lemomo-ai/lemo-opuscar` (technique only; Bengali references instead of Chinese imagery). First test: `docs/art-tests/`.
3. dh1 proposed a **mostly cutscene-based** game. Built `prototypes/s5-cutscene-test/` (Scene 5) to prove videos and live play can join invisibly. It works: measured < 1/255 mean difference at every join. dh1 liked it; only complaint was the oar sound.
4. Docs rewritten for the new approach: Phaser dropped (D1), video + Canvas 2D + HTML overlay, renderer and game share `composeFrame()`.
5. Art made for the teammate: 8 paintings (`docs/art/`, `docs/shesh-kheya-art.pdf`, no text) and a portrait cover (`docs/art/cover.png`, `cover-clean.png`).
6. Repo set up: git, writer workflow (`CONTRIBUTING.md`, `story/bible.md`, skills `add-chapter` and `save-work`), moved to WSL at `~/Desktop/repos/shesh-kheya`, GitHub `Samz6293/shesh-kheya` (private).

## Decided (see `docs/07-decisions.md` for all)
- Stack: Vite + TypeScript + Canvas 2D + HTML `<video>` + HTML overlay + Web Audio. No engine.
- Mostly pre-rendered clips; live only where Mitu acts. Joins follow the 8 handoff rules in `02-architecture.md`.
- Rowing: side view with depth (x along, z toward/away from camera).
- Art: ink wash, **code-painted** (D3 = A).
- Renderer in TypeScript, driven by Playwright + ffmpeg.
- FABLE builds in one session, stopping after M1 (pipeline + S5) for dh1 to play it.

## Answered after the planning session
D8: oil stays fixed in Chapter 1. D10: "The Last Ferry", for now. D11: Vercel. D12: the memories lie in the boat.

## Known issues in the prototype (fix them in the real build, not the prototype)
- **Help path contact is too strict.** `game.js` line ~171 only starts the push in a small box behind Kalam's stern at his exact depth (z 0.35 ± 0.12), and line ~165 pushes the boat away elsewhere, so players row around Kalam and nothing happens. Real build: any touch with his hull snaps into the contact pose; make the target visible; show the Space hint when close. dh1 found this; not fixed yet (he wasn't asked to fix the prototype).
- **Oar sound** is a Web Audio noise placeholder and sounds wrong. Replace first with real recordings (`04-audio.md`).
- The prototype is plain JavaScript and Python by design (throwaway). Port the method, not the files.

## Team
- **dh1** (owner): code, art, video, sound. Runs every git command himself during code work.
- **Writer** (teammate): chapters 2–4. Sends chapter scripts as **PDFs in his own format**, like chapter 1. Do **not** tell him how to write or ask him to change his format. `add-chapter` converts his PDF to `src/content/chN/dialogue.json` + updates `story/bible.md`; anything for dh1 goes in the pull request. `save-work` handles git for him, even from a ZIP.
- Only dh1 merges into `main`.

## How dh1 likes to work
- Concise, direct answers. No padding, no improvement ideas beyond what he asked.
- Bugs: diagnose first (cause, line, why), write the fix only when he asks.
- He wants to understand every line: explain new concepts briefly, name the docs page. Follow `docs/05-code-style.md` and the `dh1-code-style` skill.
- Git: give him the commands; run them yourself only when he explicitly asks.

## Lessons learned
- Bengali text extracted from PDFs breaks conjuncts. Render PDF pages to images and read those.
- Headless Chrome renders frames at ~0.35–0.45 s each at 1080p; a plate (paper texture) takes ~2 s once.
- A tall canvas needs its vignette radii from `min/max(W, H)`, or the gradient inverts (seen on the cover).
- `.gitattributes` keeps line endings LF; `core.filemode` is false for this repo (files came from Windows).

## Next steps
1. Commit the art, cover and team files; push to GitHub (if not done).
2. Add the teammate as collaborator; install the Claude GitHub App on the repo; optionally protect `main`.
3. Teammate's first task: review the Chapter 1 Sylheti in `src/content/ch1/dialogue.json`.
4. ~~Answer D8, D10, D11, D12.~~ Done.
5. Install `ffmpeg` and Playwright's Chromium in WSL.
6. `git switch -c feature/chapter-1`, then run the FABLE build with `docs/08-fable-prompt.md`.
