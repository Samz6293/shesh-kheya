# 08 — Prompt for the FABLE build

Use this once every **Open** item in `07-decisions.md` has an answer and the Sylheti lines in `src/content/ch1/dialogue.json` have been reviewed.

**Before running:**
- Install Node and ffmpeg (ffmpeg must be on PATH; check with `ffmpeg -version`).
- Create the branch yourself:

```
git init                      # only the first time: makes this folder a git repo
git switch -c feature/chapter-1
```

`git switch -c` creates a new branch and moves onto it, so the whole build stays off `main` until it works.

Then open Claude Code in this folder, select the Fable model, and paste everything in the box below.

---

```
You are building Chapter 1 of "শেষ খেয়া" (Shesh Kheya), a short narrative
browser game, in this folder.

Read CLAUDE.md first and follow it exactly. Then read every file in docs/
in numeric order, the script PDF in docs/source/, and the working
prototype in prototypes/s5-cutscene-test/ (start with its README). If the
dh1-code-style skill is available, use it for everything it covers;
docs/05-code-style.md says how it adapts to this game and wins where they
differ.

The game is mostly pre-rendered video with live play only where the player
acts. The prototype proves the method: a renderer and the game draw with
the same composeFrame(), clips start and end in rest poses on 4-second
sync points, videos are silent, and text is an HTML overlay. Port that
method into the TypeScript structure in docs/02-architecture.md; don't
copy prototype files as they are.

Build milestones M0 to M10 from docs/06-build-plan.md, in order. For each
milestone:
1. Build it to the "Done when" list.
2. Run `npx tsc --noEmit`, `npm run build`, and `npm run check-joins` for
   every finished scene; fix every failure.
3. Append to docs/BUILD_LOG.md: what you built, files touched, any
   TODO: comments left (file:line), and a commit message that follows the
   seven rules in docs/05-code-style.md.
4. Append 2–4 lines to docs/LEARNING.md under the milestone name: each new
   concept and the file it lives in.

STOP after M1 and tell me how to play S5 and what to compare against the
prototype (joins, rowing feel, which CONFIG values to tweak). Wait for my
go-ahead before M2. After that, continue through M10 without stopping
unless the docs contradict each other or an Open decision blocks you; then
ask one short question.

Constraints:
- No game engine. Canvas 2D, HTML video, HTML overlay, Web Audio.
- All text from src/content/ch1/dialogue.json. Do not change any Sylheti
  or English wording. If a string you need is missing, add it under
  "screens" and list it in BUILD_LOG.md.
- Every scene follows the handoff rules in docs/02-architecture.md.
  Anything that differs between players is drawn live, never rendered
  into a clip.
- Art follows docs/03-art-direction.md and the answer to D3.
- Sound uses Web Audio placeholders by id, as in the prototype.
- Do not run git commands that change the repo. I commit each milestone
  myself after reviewing it.
- Do not add features, chapters or libraries that the docs don't ask for.

When everything is done, give me: how to run it, how to re-render a
scene, the playtest checklist from docs/06-build-plan.md with what you
verified yourself, and every remaining TODO.
```
