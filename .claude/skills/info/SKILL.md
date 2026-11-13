---
name: info
description: Explain to Tibbian how this project is built and how his work reaches Sameer, from setting up git to pushing and messaging Sameer. Use when someone types "info" (or asks "how do I work on this", "how does the workflow go").
---

# Info: how we build শেষ খেয়া, from setup to Sameer's merge

From Chapter 2 on, **Tibbian** builds the game with you (Claude); **Sameer** (dh1, the repo owner) only merges. This skill is Tibbian's guide. Speak to him directly, in plain words, no jargon he doesn't need. He may not know git: every command he runs is one you give him to copy-paste, one line at a time, in its own code block.

If it is Sameer who typed "info" (`git config user.name` = "Sabbir Al Sameer"), give him the short version: the flow below in five lines, and remind him what his part is (add Tibbian as a collaborator when he sends his username; merge the pull requests).

## Step 0: ask first
Before anything else ask him: **"Which computer are you on: Windows, Mac or Linux?"** and **"Is the project already on your computer, and do you have a GitHub account?"** Then send the guide below, with the setup commands for his system only. If he has already done a step, skip it.

## What to send him

Send this (adapted to his answers), section by section. Keep the headings.

### Who does what
- **You (Tibbian)** write the story and build Chapters 2 to 4 with me. I write the code and paint the pictures; you review, test and say when something is right.
- **Sameer** owns the project. He reads your message, takes a last look if he wants, and merges your work into `main`. You never merge, and you never push to `main`.
- **You never have to wait for Sameer.** You keep working on your chapter's branch; he merges whenever he can.

### 1. Get access (once)
1. If you don't have a GitHub account, make one: https://github.com/signup
2. Send Sameer this message (copy it, put in your username):
   > Hi Sameer, my GitHub username is ___. Please add me as a collaborator on shesh-kheya so I can push my chapter branches.
3. GitHub emails you an invite. Click **Accept**. Until then you can do all the setup below, but you can't push.

(Your username is in the top-right menu on github.com, under your picture.)

### 2. Set up your computer (once)

**Windows** (use **PowerShell**: Start menu, type PowerShell):
1. Install Git: https://git-scm.com/download/win (keep every default option).
2. Install Node.js (the **LTS** version): https://nodejs.org
3. Install ffmpeg (the video encoder):
   `winget install Gyan.FFmpeg`
4. **Close PowerShell and open it again**, so it finds the new programs. Check all three:
   `git --version`
   `node --version`
   `ffmpeg -version`

**Mac** (use **Terminal**):
1. Install Homebrew from https://brew.sh (one line to paste, shown on that page).
2. `brew install git node ffmpeg`

**Linux** (Ubuntu/Debian):
1. `sudo apt update`
2. `sudo apt install git ffmpeg`
3. Node.js LTS from https://nodejs.org (or with `nvm`).

**Everyone, then:**
1. Tell git who you are (put in your name and the email of your GitHub account):
   `git config --global user.name "Your Name"`
   `git config --global user.email "you@example.com"`
2. Go to the folder where you keep projects (for example `cd Documents`), then download the game:
   `git clone https://github.com/Samz6293/shesh-kheya.git`
   `cd shesh-kheya`
3. Install its tools (this takes a few minutes):
   `npm install`
   `npx playwright install chromium`
4. Check the game runs:
   `npm run dev`
   Open http://localhost:5173 in your browser: you should see the start screen. To stop it, press **Ctrl + C** in the terminal.
5. Open the `shesh-kheya` folder in Claude Code (the Claude desktop app's Code tab, or the terminal) and talk to me from there.

The first time you push, a browser window opens asking you to sign in to GitHub. Approve it; it's remembered after that.

### 3. One branch per chapter
- All your work on a chapter lives on one branch, named after it: `chapter-2`, `chapter-3`, …
- Make it once, when the chapter starts (I'll remind you):
  `git switch main`
  `git pull`
  `git switch -c chapter-2`
  `git push -u origin chapter-2`
- Every save goes onto that branch and into the **same pull request**. Sameer merges whenever he can; you carry on.
- Starting Chapter 3 before Sameer has merged Chapter 2? Make it from Chapter 2, so your unmerged work comes with you:
  `git switch chapter-2`
  `git switch -c chapter-3`
  `git push -u origin chapter-3`

### 4. Every time you sit down to work
1. Open the project in Claude Code.
2. Get up to date (one line at a time):
   `git switch chapter-2` (your current chapter)
   `git pull`
   `git fetch origin`
   `git merge origin/main`
   The last one brings in whatever Sameer has merged. "Already up to date" is fine. If it says **CONFLICT**, stop and paste me what it says; don't try to fix it yourself.
3. Type **start**. I'll tell you where the chapter stands and what's next.

### 5. A new chapter's script
Give me your chapter PDF (or put it in `docs/source/` as `chapter-2-script.pdf`) and say "add this as chapter 2". I turn it into the dialogue file the game reads and update the story bible. Then we plan the chapter's scenes together before building the first one.

### 6. How a scene gets made (one scene at a time)
1. **I build the scene in code.** Nothing is turned into video yet.
2. **Preview first, video later.** Making the real videos ("rendering") is slow: minutes per clip. So first I give you a **preview link** for each clip, for example `http://localhost:5173/preview.html#s7/meet/0` (run `npm run dev` first). It draws the clip straight from the code in your browser: scrub it, step frame by frame, play it.
3. **The preview is not everything the player sees.** Some things are drawn live, on top of the video, by the game: the lantern's glow, the dialogue and its speaker light, what lies in Mitu's boat, hints and timing bars, sometimes the reeds. You'll see those when you play the scene.
4. **Leave notes:** drag a box on anything wrong in the preview and write what you want. I fix the notes; you check again. Repeat until the frames are right.
5. Say **"render it"**. I make the videos and check that every clip joins live play invisibly.
6. **Play-test.** I tell you what to play (for example `http://localhost:5173/?scene=s7`, add `&debug` to see what the game is doing) and what to look at. Tell me anything that feels wrong; I fix it.
7. When both the videos and the game are right, say **"approved"**. Only then do I give you the git commands.

### 7. Saving and sending your work
After "approved" I give you, ready to copy:
1. `git add -A`
2. `git commit -m "…"` (I write the message)
3. `git push`
4. **First push of a chapter only:** a link to open the pull request, with its title and description to paste. After that, every push lands in the same pull request by itself.
5. **The message for Sameer.** Copy it and send it to him (WhatsApp, Messenger, wherever you talk). That's all; go on with the next scene.

The message always looks like this:

> Hi Sameer, I pushed new work to chapter-2.
> Pull request: https://github.com/Samz6293/shesh-kheya/pull/…
> What's new: …
> Already checked: preview reviewed, rendered, all joins pass, build passes, play-tested and approved by me.
> Please check before merging: …
> Changes to shared code that could affect Chapter 1: … (or "none")
> Open items: … (or "none")

### Rules that keep it safe
- Never work on `main`, never merge, never force-push (`--force`).
- Chapter 1 is Sameer's and finished. I won't change its scenes. If a change to shared code could affect it, I'll tell you, and it goes in Sameer's message.
- If git shows something scary (CONFLICT, rejected, an error), stop and paste it to me. Don't guess.
- Say **start** whenever you're unsure what's next, and **info** to see this again.
