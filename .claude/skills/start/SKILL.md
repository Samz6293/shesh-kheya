---
name: start
description: Pick up the game's work where it stands. Use whenever someone types "start" (or "start working", "what's next"). For dh1 it builds the next scene of the current chapter in order; for the writer it only reports status.
---

# Start

One word for both of us: "start" works out where the game stands and what happens next. `docs/SCENE_STATUS.md` is the record; this skill reads it and keeps it current.

## 1. Who is this?
Follow `CLAUDE.md`, "Who are you working with?". `git config user.name` = "Sabbir Al Sameer" is dh1. If you still can't tell, ask once.

## 2. Find the current chapter
1. Chapters that exist = the scripts in `docs/source/chapter-N-script.pdf`.
2. Read `docs/SCENE_STATUS.md`. The **current chapter** is the lowest-numbered chapter that has a script and is not done (some row isn't `approved`).
3. A chapter with a script but no section in `SCENE_STATUS.md` hasn't been planned yet. If it has no `src/content/chN/dialogue.json`, run `add-chapter` first (writer's area; for dh1, ask before running it).
4. Check the file against the disk, and trust the disk if they disagree: a scene marked `approved` or `ready for play-test` should have `src/scenes/chN/<scene>/`, its plate, backing and front in `public/assets/<scene>/`, and every clip in its `layout.ts` `CLIP` list as `public/video/<scene>/<clip>.mp4` + `.track.json`. If something is missing, say so and treat the scene as `in progress`.

## 3a. Everything is done
If every chapter that has a script is done, send exactly this, and nothing else needs to happen:

> All provided chapters are rendered and live. Tibbian needs to add more story.

## 3b. The writer typed "start": status only
Don't build, render or change code (`CLAUDE.md`: no code for the writer). In plain words, without code terms:
- which chapter is being worked on, and which of its scenes are done;
- what is next, and who it waits on ("dh1 is building Scene 2", or "Scene 3 is waiting for dh1 to play it");
- if every chapter is done, the message in 3a.

Nothing to commit; don't touch `SCENE_STATUS.md`.

## 3c. dh1 typed "start": build, one scene at a time
Rows are worked strictly in table order. Look at the first row that isn't `approved`:

- **`ready for play-test`**: don't start anything new. Remind dh1 which scene is waiting, how to run it (`npm run dev`, `?debug`), and what to check. Wait for his verdict.
- **`not started` or `in progress`**: build it, following the normal workflow:
  1. Set the row to `in progress`.
  2. Read the docs in the order `CLAUDE.md` gives, and that milestone in `docs/06-build-plan.md`. Story wording comes from the script and `dialogue.json`, never from you.
  3. Build it to the hard rules in `CLAUDE.md` and the standing rules in the docs, including: direction of travel (D18: outward left to right, homeward right to left), solid figures (`backing.png`), a foreground `front` layer that sways, rowing that surges with strokes, characters who leave actually leaving the screen.
  4. Render it (`npm run render -- <scene>`), run `npm run check-joins`, `npx tsc --noEmit` and `npm run build`. Look at frames of every clip yourself: overlaps, exits, direction.
  5. Write the `docs/BUILD_LOG.md` entry with a suggested commit message, and the `docs/LEARNING.md` lines.
  6. Set the row to `ready for play-test` and tell dh1 what to play and check. **Stop there.** Don't start the next row.
- **dh1 asks for changes after playing**: fix them, re-render, re-check; the row stays `ready for play-test`.
- **dh1 confirms** ("good", "approved", "push"): set the row to `approved` with the date. Then git as dh1 tells you that time. By default, give him the commands. `CLAUDE.md` still says you don't commit, push or merge unless he asks you to in that conversation, and never push to `main` yourself.

A milestone that isn't a scene (save system, polish) is worked the same way, with the same play-test stop.

When the last row of a chapter becomes `approved`, check the next chapter (step 2). If there is none, send the message in 3a.

## Starting a new chapter (dh1)
Before building its first scene, plan it: add a section to `SCENE_STATUS.md` listing its scenes in script order, with the direction of each journey. The design doc for Chapter 1 is the model. Two things to settle with dh1 first, not by yourself:
- scene ids for chapter 2 onwards (`s1` … would clash with Chapter 1's asset folders);
- any open question the script raises (add it to `docs/07-decisions.md`).
