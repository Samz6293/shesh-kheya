---
name: save-work
description: Get Tibbian's finished work to GitHub and to Sameer. Use when a scene or change is approved, or when he says "save my work", "push", "upload", "send it to Sameer". Gives him the git commands to copy-paste, the pull request text the first time, and the message to send Sameer.
---

# Save work: commands to copy, then a message for Sameer

From Chapter 2 on, Tibbian builds the game and Sameer (dh1) only merges (see `info`). Tibbian runs every git command himself: **give him the commands, one per code block, in order; never run commit, push or branch commands for him.** You may run read-only ones (`git status`, `git branch --show-current`, `git log`, `git diff`) to know what to tell him.

Repository: `https://github.com/Samz6293/shesh-kheya` (if `git remote get-url origin` says otherwise, use that).

## When
Only after Tibbian has said everything is right: the previews were reviewed, the clips rendered, the scene play-tested, and he said "approved" (`start` skill). For a small change (a dialogue fix, a script revision) his "looks good" is enough.

Before giving any commands:
- Mark the scene `approved` in `docs/SCENE_STATUS.md` (with the date), so the status goes into the same commit.
- Make sure the `docs/BUILD_LOG.md` entry, its suggested commit message, and the `docs/LEARNING.md` lines are written.
- `npx tsc --noEmit`, `npm run check-joins` and `npm run build` pass (run them yourself).

## Never
- Tell him to push to `main`, merge, force-push or rewrite history.
- Include secrets, `node_modules/` or `dist/`.
- Change Chapter 1's scenes. If shared code changed in a way that could affect Chapter 1, say so in the message for Sameer.

## 1. Which branch
One branch per chapter: `chapter-2`, `chapter-3`, … `git branch --show-current` tells you where he is.
- On the right chapter branch: go on.
- On `main`, or the chapter's branch doesn't exist yet: give him the commands to make it (from `main`, or from the previous chapter's branch if that isn't merged yet, so his unmerged work comes along), as in `info` section 3.
- Uncommitted changes and he must switch branch: `git switch` carries them along; if it refuses, give `git stash`, the switch, `git stash pop`.

## 2. The commands
```
git add -A
```
```
git commit -m "<subject>" -m "<body>" -m "<attribution line, if the session gives one>"
```
```
git push
```
(The first push of a new branch is `git push -u origin chapter-N`.)

Commit message: subject in the imperative, capitalised, no period, under 50 characters; the body says what and why, wrapped at 72. Take it from the build log entry.

The first push on a new computer opens a browser window to sign in to GitHub: tell him to approve it.

## 3. First push of a chapter: the pull request
Give him this link to click, then **Create pull request**:
`https://github.com/Samz6293/shesh-kheya/compare/main...chapter-N?expand=1`

With a title and description to paste: the chapter, the scenes so far, and the attribution line if the session gives one. Later pushes land in the same pull request by themselves: say so.

To give the pull request's address in Sameer's message later: it is shown on that page after creating it; ask him to paste it to you once, then reuse it.

## 4. The message for Sameer
Write it ready to copy, in a code block, exactly in this shape:

```
Hi Sameer, I pushed new work to chapter-N.
Pull request: <link>

What's new:
- <scene or change, in a few words each: clips, activities, story>

Already checked: preview reviewed, rendered, all joins pass, build passes, play-tested and approved by me.

Please check before merging:
1. Play http://localhost:5173/?scene=<id> (<what to look at, in a line>)
2. <anything else worth a last look>

Changes to shared code that could affect Chapter 1: <list, or "none">
Open items: <TODOs, missing sounds, open questions; or "none">
```

Keep it short and true: what you actually checked, nothing more.

## 5. Tell him it's done
One or two sentences: it's saved on `chapter-N`, the pull request has it, send Sameer the message, and carry on with the next scene (he never waits for the merge).

## If pushing fails
- "rejected" / "fetch first": someone (Sameer) changed the branch. Give `git pull`, then `git push` again. A CONFLICT: ask him to paste it, then resolve it together.
- Sign-in fails, no network: say what's wrong in plain words; nothing is lost, the commit is saved on his computer and can be pushed later.
