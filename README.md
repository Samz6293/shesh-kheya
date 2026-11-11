# শেষ খেয়া — Shesh Kheya

A short narrative browser game set on a Sylhet haor during the monsoon. You play Mitu, waiting for her father to come home. Painted in ink wash, told mostly through pre-rendered cutscenes, with live play wherever Mitu acts. Sylheti dialogue with English subtitles.

**Status:** planning, with a working prototype of Scene 5.

## What's here

| Path | What it is |
|---|---|
| `docs/source/chapter-1-script.pdf` | The Chapter 1 script (source of truth for story) |
| `docs/01-game-design.md` | Chapter 1 broken into scenes, activities, flags and echoes |
| `docs/02-architecture.md` | Video + live approach, renderer and game, handoff rules, folders |
| `docs/03-art-direction.md` | Ink wash: paper, ink, light, composition, assets |
| `docs/04-audio.md` | Sound ids, cues, rowing sound, sources |
| `docs/05-code-style.md` | dh1 code style adapted for this game |
| `docs/06-build-plan.md` | Milestones M0–M10 with "done when" checks + playtest checklist |
| `docs/07-decisions.md` | Decided and **open** questions |
| `docs/08-fable-prompt.md` | The prompt for the one-go FABLE build |
| `docs/art-tests/` | First ink-wash test painting and its code |
| `prototypes/s5-cutscene-test/` | Playable Scene 5: cutscene → choice → rowing → push → branch cutscene |
| `src/content/ch1/dialogue.json` | All Chapter 1 text, Sylheti + English, by beat id |
| `CLAUDE.md` | Rules any AI agent must follow in this repo |

## How we proceed

1. **Review the Sylheti** in `src/content/ch1/dialogue.json` with the writer. Then run `python prototypes/s5-cutscene-test/render/make_content.py` if you want the prototype to show the fixes.
2. **Answer the open decisions** in `docs/07-decisions.md`. The big one is D3 (who paints the art).
3. **Replace the oar sound** (optional before the build): record or find a few oar strokes; see `docs/04-audio.md`.
4. **Run FABLE** with `docs/08-fable-prompt.md` on branch `feature/chapter-1`. It stops after M1 (S5 rebuilt properly) so you can compare it with the prototype.
5. **Review and commit milestone by milestone**, using the messages FABLE leaves in `docs/BUILD_LOG.md`.
6. **Playtest** with the checklist in `docs/06-build-plan.md`, merge to `main`, deploy.

## How to run
_Filled in after the build (M9). For now: double-click `prototypes/s5-cutscene-test/index.html`._
