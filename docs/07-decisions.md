# 07 — Decisions

Each decision has a recommendation. **Open** ones need dh1's answer before the FABLE build. Write the answer in the "Answer" line and change the status to Decided.

---

### D1 — Stack
**Status:** Decided (changed after the Scene 5 test)
**Choice:** Vite + TypeScript + Canvas 2D + HTML video + HTML overlay. No game engine.
**Why:** Most of the game is video; the live parts are a background image, a few sprites and some washes. The prototype did all of it in about 600 lines. Phaser would add a big API to learn without doing much here.
**Revisit if:** a later chapter needs physics, tilemaps or many moving objects.

### D2 — How the world is laid out for rowing
**Status:** Decided
**Choice:** Side view with depth. The boat moves along the water and toward/away from the camera, scaling with distance. Pressing one side repeatedly turns it. Tested in the prototype.

### D3 — Who paints the art
**Status:** Open
**Options:**
- **A. Code-painted (recommended to start).** The renderer paints everything, as in the tests. Consistent, re-renderable, fast to change.
- **B. Hand-painted.** dh1 paints plates and sprite poses (ink on paper scanned, or a digital ink brush) at the same sizes and anchor points. More personal, more work per change.
- **C. Mix.** Code-painted first; replace key pieces (Mitu, Amma, the house) with hand-painted ones later. The file names and sizes stay the same, so code doesn't change.
**Answer:**

### D4 — Sound
**Status:** Decided
**Choice:** Web Audio placeholders first (as in the prototype), replaced by real recordings by id. The oar sound is replaced first. Record your own where possible.

### D5 — Platform
**Status:** Decided
**Choice:** Desktop browsers with keyboard + mouse. Phones and tablets are out of scope.

### D6 — Start screen
**Status:** Decided
**Choice:** A quiet start screen with Begin / Continue. Browsers block audio until a click.

### D7 — "In one go" vs checkpoints
**Status:** Decided
**Choice:** One FABLE session that stops after M1 (pipeline + S5) for dh1 to play and approve, then continues through M10.

### D8 — Lantern oil during Chapter 1
**Status:** Open (small)
**Question:** Does oil burn down in Chapter 1, or only from Chapter 2?
**Recommendation:** Fixed in Chapter 1; the meter is visible so the player knows it matters.
**Answer:**

### D9 — Rahim's lines on net hits
**Status:** Decided (tune later)
**Choice:** 5 hits to finish; lines on hits 1, 3 and 5.

### D10 — English title
**Status:** Open (small)
**Question:** Is the English subtitle of "শেষ খেয়া" **The Last Ferry**?
**Answer:**

### D11 — Hosting
**Status:** Open (small)
**Recommendation:** Vercel as a static site. Clips are under 5 MB each, which any static host handles. Check the host's file size limits once all clips exist.
**Answer:**

### D12 — Where the memories go after pickup
**Status:** Open (small)
**Recommendation:** They lie in Mitu's boat next to the fish, drawn live on top of clips using the boat's track. It sets up Ending 1 (the flute in the empty boat).
**Answer:**

### D13 — Cutscene-based presentation
**Status:** Decided
**Choice:** Pre-rendered clips for everything the player watches; live play only where the player acts. Follow the handoff rules in `02-architecture.md`. The video/live split per scene is the table there.

### D14 — Art direction
**Status:** Decided
**Choice:** Ink wash on warm paper, with Bengali references (Bengal School wash, Zainul Abedin) and none of the Chinese imagery. Details in `03-art-direction.md`.

### D15 — What gets its own video when choices differ
**Status:** Decided
**Choice:** Only a story branch gets its own clip (Help / Go home). Per-player differences (lamp oil, memories, darkness) are drawn live on top of a shared clip.

### D16 — Renderer language
**Status:** Decided
**Choice:** TypeScript in the same Vite project, driven by a Node script with Playwright. The prototype used Python for the driver; one language is easier to maintain.
