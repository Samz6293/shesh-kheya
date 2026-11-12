# Working on Shesh Kheya

| Who | Works on | Folders |
|---|---|---|
| **Writer** (chapters 2–4) | chapter scripts, dialogue | `docs/source/`, `src/content/`, `story/` |
| **Developer** (dh1) | code, art, video, sound | everything else |

If you are the writer, you never need to touch code or learn git commands.

---

## Adding a chapter

Your chapter script (PDF) goes in `docs/source/`, named `chapter-2-script.pdf`, `chapter-3-script.pdf`, and so on. A revised script simply replaces the old file. Use whichever of these is easiest:

### On the GitHub website (fastest, nothing to install)
1. Open the repository on GitHub and go into the `docs/source` folder.
2. Click **Add file** → **Upload files** and drop in your PDF.
3. At the bottom, choose **Create a new branch**, then click **Propose changes**, then **Create pull request**.

That's all. Claude turns the PDF into the game's dialogue files in the same pull request, and dh1 merges it.

### With Claude Code
Open the project in Claude Code (see below), give it the PDF and say **"add this as chapter 2"**. Claude puts the script in place, creates the dialogue file, and saves it as a pull request.

## Where is the game at? Type "start"

Open Claude Code on the project and type **start**. Claude tells you which chapter is being made, which scenes are finished, and what's next. When all your chapters are finished it says so, and that's your cue to add the next chapter.

## Changing something (a line, a name, a fix)

Use Claude Code and say what you want in your own words, for example: "Change Rahim Chacha's second line in chapter 1 to …". When you're happy, say **"save my work"**.

### Claude Code in the browser (nothing to install)
1. Go to **claude.ai/code** and sign in with your Claude account.
2. When it asks, **connect GitHub** and approve.
3. Pick the **shesh-kheya** repository and start.
4. After "save my work", click **Create PR**.

### Claude Code on your computer (works with a ZIP download too)
1. Install **Git for Windows** (git-scm.com) once, default options.
2. Get the project: green **Code** button → **Download ZIP** and unzip it, or **Open with GitHub Desktop**.
3. Open the folder in Claude Code (desktop app or terminal).
4. After "save my work", Claude reconnects a ZIP folder to GitHub by itself (one time). The first push opens a browser window to sign in to GitHub; approve it. Claude then gives you a link to open the pull request.

---

## Rules that keep us from breaking each other's work

- **Nobody pushes to `main` directly.** Everything arrives as a pull request; dh1 merges.
- **Writer: only `docs/source/`, `src/content/` and `story/`.**
- **Developer: never edits the story or dialogue wording.** Code reads text from `src/content/`; it never contains text.
- **One topic per pull request** ("Chapter 2", "Fix Sylheti in chapter 1").
- **Start from the latest version.** In the browser this is automatic. On your computer, say "get the latest version" first, or download a fresh ZIP.

## Where things are

| Path | What |
|---|---|
| `docs/source/` | Chapter scripts (PDF) |
| `src/content/chN/dialogue.json` | Each chapter's dialogue as the game reads it |
| `story/bible.md` | Characters, flags and echoes across chapters (kept up to date by Claude) |
| `docs/` | How the game is built (for the developer) |
