---
name: start
description: Pick up the game's work where it stands. Use whenever someone types "start" (or "start working", "what's next"). Chapter 1 is built by Sameer (dh1); from Chapter 2 on, Tibbian builds and Sameer only merges. Builds the next scene of the current chapter in order, one at a time, for whoever builds it; for the other person it reports status.
---

# Start

One word for everyone: "start" works out where the game stands and what happens next. `docs/SCENE_STATUS.md` is the record; this skill reads it and keeps it current.

## 1. Who is this, and who builds what
`git config user.name` = "Sabbir Al Sameer" is **Sameer** (dh1). Anyone else is **Tibbian**. If you still can't tell, ask once.

- **Chapter 1** is Sameer's: he builds it, play-tests it and finishes it (S6, polish, deploy).
- **Chapter 2 onwards** is Tibbian's: he builds with you, greenlights the frame reviews and play-tests himself, and sends his work to Sameer, who only merges (`info`, `save-work`).

The **builder** of the current chapter gets section 3c; the other person gets 3b.

For Tibbian: if `git branch --show-current` isn't his chapter's branch (`chapter-N`), tell him first which commands to run (`info` section 3 and 4), before building anything. If he hasn't set up yet, run `info`.

## 2. Find the current chapter
1. Chapters that exist = the scripts in `docs/source/chapter-N-script.pdf`.
2. Read `docs/SCENE_STATUS.md`. The **current chapter** is the lowest-numbered chapter that has a script and is not done (some row isn't `approved`).
3. A chapter with a script but no section in `SCENE_STATUS.md` hasn't been planned yet. If it has no `src/content/chN/dialogue.json`, run `add-chapter` first. Then plan it (see "Starting a new chapter").
4. Check the file against the disk, and trust the disk if they disagree: a scene marked `approved` or `ready for play-test` should have `src/scenes/chN/<scene>/`, its plate, backing and front in `public/assets/<scene>/`, and every clip in its `layout.ts` `CLIP` list as `public/video/<scene>/<clip>.mp4` + `.track.json`. If something is missing, say so and treat the scene as `in progress`.

## 3a. Everything is done
If every chapter that has a script is done, send exactly this, and nothing else needs to happen:

> All provided chapters are rendered and live. Tibbian needs to add more story.

## 3b. Not the builder: status only
Don't build, render or change code. In plain words:
- which chapter is being worked on, and which of its scenes are done;
- what is next, and who it waits on ("Sameer is finishing Chapter 1; your work starts with Chapter 2", or "Tibbian is building Scene 9");
- for Sameer, from Chapter 2 on: what has been approved since the last merge (the pull request from `chapter-N` waits for him);
- if every chapter is done, the message in 3a.

Nothing to commit; don't touch `SCENE_STATUS.md`.

## 3c. The builder typed "start": build, one scene at a time
Rows are worked strictly in table order. Look at the first row that isn't `approved`:

- **`ready for frame review`**: don't render and don't start anything new. Remind the builder which clips wait in the preview page (links below) and wait. Notes left there: read `render/notes/<scene>.json` and the pictures beside it, fix the code, mark each note fixed with a one-line reply; the row stays `ready for frame review`. Their greenlight ("good", "render it"): go to step 7.
- **`ready for play-test`**: don't start anything new. Remind them which scene is waiting, how to run it (`npm run dev`, `?scene=<id>`, `?debug`), and what to check. Wait for the verdict.
- **`not started` or `in progress`**: build it, following the normal workflow:
  1. Set the row to `in progress`.
  2. Read the docs in the order `CLAUDE.md` gives, and that milestone in `docs/06-build-plan.md` (or the chapter's plan). Story wording comes from the script and `dialogue.json`, never from you.
  3. Build it to the hard rules in `CLAUDE.md` and the standing rules in the docs, including: direction of travel (D18: outward left to right, homeward right to left), solid figures (`backing.png`), a foreground `front` layer that sways, rowing that surges with strokes, characters who leave actually leaving the screen, dialogue as in S2 (D19: every line waits for a click, Space or Enter; lines live between clips, never in a clip; the speaker light over whoever talks), and what lies in Mitu's boat drawn live (`Cargo`).
  4. **Don't render yet.** Run `npx tsc --noEmit` and look at frames of every clip yourself in the preview page (`preview.html`, headless is fine): overlaps, exits, direction.
  5. Set the row to `ready for frame review` and send one link per clip, `http://localhost:5173/preview.html#<scene>/<clip>/0`, with what to look at in each. For Tibbian, say plainly: this is a preview drawn from the code to save time (rendering is slow); some things are drawn live on top of the video in the game (lights, dialogue, what lies in the boat, hints, sometimes reeds), so they aren't in the preview; he'll see them in the play-test. **Stop there** until the clips are greenlit.
  6. (Notes: fix in code, they check again in the page. Still no render.)
  7. After the greenlight: render it (`npm run render -- <scene>`), run `npm run check-joins` and `npm run build`.
  8. Write the `docs/BUILD_LOG.md` entry with a suggested commit message, and the `docs/LEARNING.md` lines.
  9. Set the row to `ready for play-test` and say what to play and check. **Stop there.** Don't start the next row.
- **Changes asked for after playing**: fix them in code. If a fix changes what a clip shows, send that clip's preview link and re-render only after the greenlight; then re-check. The row stays `ready for play-test`. Notes left in the page: read them and mark each fixed with a reply (`docs/02-architecture.md`, "Frame review").
- **Confirmed** ("good", "approved"): set the row to `approved` with the date, **before** any git commands, so the status is in the same commit. Then:
  - **Tibbian:** use `save-work`: the commands to copy, the pull request the first time, and the message for Sameer.
  - **Sameer:** give him the commands; you don't commit, push or merge unless he asks you to in that conversation, and never push to `main` yourself.

A milestone that isn't a scene (save system, polish) is worked the same way, with the same play-test stop.

When the last row of a chapter becomes `approved`, check the next chapter (step 2). If there is none, send the message in 3a.

## Starting a new chapter
Before building its first scene, plan it with the builder: add a section to `SCENE_STATUS.md` listing its scenes in script order, with the direction of each journey. `docs/01-game-design.md` (Chapter 1) is the model. Settle with them, not by yourself:
- scene ids (Chapter 1 uses `s1`…`s6`, which are also its asset folders; from Chapter 2 on use `c2s1`, `c2s2`, … unless they choose otherwise, and record it in `docs/07-decisions.md`);
- any open question the script raises (add it to `docs/07-decisions.md`).

For Tibbian, also give him the commands to start the chapter's branch (`info` section 3) before the first scene.
