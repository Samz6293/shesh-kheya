# Working on Shesh Kheya

| Who | Does | When |
|---|---|---|
| **Sameer** (repo owner) | builds Chapter 1; reviews and merges every pull request | Chapter 1, then merging only |
| **Tibbian** | writes the story; builds Chapters 2 to 4 with Claude | from Chapter 2 on |

**New here, or forgot how it goes? Open the project in Claude Code and type `info`.** Claude walks you through everything: setting up your computer and git, how a scene is made, and how your work gets to Sameer. It asks which computer you use (Windows, Mac or Linux) and gives the steps for that.

**What's next? Type `start`.** Claude tells you where the game stands and builds the next scene with you.

---

## The way of working, in short

1. **Access:** send Sameer your GitHub username; accept the invite he sends.
2. **One branch per chapter:** `chapter-2`, `chapter-3`, … You keep pushing to it; it stays one pull request. You never wait for Sameer to merge.
3. **Each time you start:** get up to date (`git pull`, then bring in `main`); Claude gives you the lines.
4. **A scene:** Claude builds it in code → you review a **preview** of each clip in the browser (quick, drawn from the code; some things, like lights and dialogue, are drawn live by the game and only show when you play) → "render it" → you **play-test** → "approved".
5. **Saving:** only after "approved" Claude gives you the git commands to copy, and the first time a link to open the pull request.
6. **Telling Sameer:** Claude writes a short message (what's new, what was checked, what to look at before merging). Copy it and send it to Sameer. Carry on with the next scene.

## Rules that keep us from breaking each other's work

- **Nobody pushes to `main`.** It is protected: everything arrives as a pull request, and Sameer merges.
- **Never force-push, never merge yourself.**
- **Chapter 1 is finished and Sameer's.** From Chapter 2 on, its scenes aren't changed; if shared code changes could affect them, it says so in the message to Sameer.
- **Stuck on a git error or a CONFLICT?** Stop and paste it to Claude.

## Where things are

| Path | What |
|---|---|
| `docs/source/` | Chapter scripts (PDF) |
| `src/content/chN/dialogue.json` | Each chapter's dialogue as the game reads it |
| `story/bible.md` | Characters, flags and echoes across chapters (kept up to date by Claude) |
| `docs/SCENE_STATUS.md` | Where every scene stands |
| `docs/` | How the game is built |
