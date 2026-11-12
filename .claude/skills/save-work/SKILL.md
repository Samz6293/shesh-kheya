---
name: save-work
description: Save the person's changes to GitHub as a pull request. Use when they say "save my work", "push", "upload", "send it to dh1", or finish a piece of work. Handles cloud sessions, local clones and ZIP downloads with no git folder.
---

# Save work to GitHub

The person may not know git. Do every step yourself, explain in one plain sentence what you are doing, and never ask them to type git commands unless a step can only happen on their side (signing in).

Repository: `https://github.com/Samz6293/shesh-kheya` (if `git remote get-url origin` says otherwise, use that).

## Never
- Push to `main`, force-push, or rewrite history.
- Commit files outside the person's area. The writer's area is `docs/source/`, `src/content/` and `story/`. If other files changed, ask before including them.
- Commit secrets, `node_modules/`, or large files that aren't game assets.

## 1. Find out where you are

```
git rev-parse --is-inside-work-tree
```

- **Works, and you're in a cloud session (claude.ai/code):** the session already has its own branch. Go to step 3.
- **Works, local clone:** go to step 2.
- **Fails ("not a git repository"):** the folder came from a ZIP. Go to step 2Z.

## 2. Local clone: start a branch

```
git status
git switch main
git pull
git switch -c <branch>
```

If there are uncommitted changes, `git switch` carries them over; if it refuses, `git stash`, switch, `git stash pop`.

Branch names: `story/chapter-2`, `story/fix-ch1-sylheti`, `feature/...` for code. Lowercase, hyphens.

## 2Z. ZIP folder: reconnect it to GitHub (one time)

1. Check git is installed: `git --version`. If not, tell the person to install Git for Windows from git-scm.com with default options, then continue.
2. Connect the folder to the repo **without touching their files**:

```
git init -b main
git remote add origin https://github.com/Samz6293/shesh-kheya.git
git fetch origin
git reset origin/main
```

`git reset origin/main` (no `--hard`) makes git treat the GitHub version as the starting point and keeps every file on disk as it is, so their edits show up as changes.

3. `git status` and show the person the list of changed files in plain words. If files they didn't touch show as changed, the ZIP was older than GitHub's `main`: ask before including those.
4. Continue with `git switch -c <branch>`.

## 3. Commit

- Stage only the relevant files: `git add docs/source/ src/content/ story/` (or the specific files).
- Commit message: subject in the imperative, capitalised, no period, under 50 characters; blank line; a short body (what and why), wrapped at 72.

```
Add chapter 2 script and dialogue

Add the chapter 2 script PDF and its dialogue in
src/content/ch2/dialogue.json, and record its new flags in the
story bible.
```

## 4. Push and open the pull request

```
git push -u origin <branch>
```

- First push on a new computer opens a browser window to sign in to GitHub (Git Credential Manager). Tell the person to approve it.
- If `gh` is installed and signed in: `gh pr create --fill --base main`.
- Otherwise give them this link to click, then **Create pull request**:
  `https://github.com/Samz6293/shesh-kheya/compare/main...<branch>?expand=1`
- In a cloud session: tell them to click **Create PR** in the Changes panel.

## 5. Tell them it's done
One or two sentences: what was saved, the PR link, and that dh1 will review and merge it.

## If pushing is impossible
(no git, sign-in fails, no network): list the changed files with their full paths and tell them to upload exactly those on GitHub: open the folder, **Add file → Upload files**, choose **Create a new branch**, **Propose changes**, **Create pull request**.
