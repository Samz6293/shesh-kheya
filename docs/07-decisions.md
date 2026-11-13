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
**Choice:** Side view with depth. The boat moves along the water and toward/away from the camera, scaling with distance. Tested in the prototype. How the player moves it changed in D17.

### D3 — Who paints the art
**Status:** Decided
**Options:**
- **A. Code-painted (recommended to start).** The renderer paints everything, as in the tests. Consistent, re-renderable, fast to change.
- **B. Hand-painted.** dh1 paints plates and sprite poses (ink on paper scanned, or a digital ink brush) at the same sizes and anchor points. More personal, more work per change.
- **C. Mix.** Code-painted first; replace key pieces (Mitu, Amma, the house) with hand-painted ones later. The file names and sizes stay the same, so code doesn't change.
**Answer:** A, code-painted (the recommendation).

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
**Status:** Decided
**Question:** Does oil burn down in Chapter 1, or only from Chapter 2?
**Recommendation:** Fixed in Chapter 1; the meter is visible so the player knows it matters.
**Answer:** Oil stays fixed in Chapter 1 (the recommendation).

### D9 — Rahim's lines on net hits
**Status:** Decided (tune later)
**Choice:** 5 hits to finish; lines on hits 1, 3 and 5.

### D10 — English title
**Status:** Decided (for now)
**Question:** Is the English subtitle of "শেষ খেয়া" **The Last Ferry**?
**Answer:** Yes, "The Last Ferry" for now.

### D11 — Hosting
**Status:** Decided
**Recommendation:** Vercel as a static site. Clips are under 5 MB each, which any static host handles. Check the host's file size limits once all clips exist.
**Answer:** Vercel (the recommendation).

### D12 — Where the memories go after pickup
**Status:** Decided
**Recommendation:** They lie in Mitu's boat next to the fish, drawn live on top of clips using the boat's track. It sets up Ending 1 (the flute in the empty boat).
**Answer:** The memories lie in the boat (the recommendation).

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

### D17 — Boat controls
**Status:** Decided (after the M1 play-test)
**Choice:** Direct steering with W A S D: D forward, A back, W away from the camera, S toward it. The boat always faces the same way, and Mitu's strokes play by themselves while it moves.
**Why:** The script's rhythm rowing (alternate A/D in time, repeat one side to turn) felt too strange to control.
**Affects:** the script calls A4 "rowing in rhythm"; the writer should know the rhythm part is gone. The old hint line `rowingHint` is unused; the new one is `steerHint`.

### D18 — Direction of travel (the journey rule)
**Status:** Decided (dh1, after the S5 review)
**Choice:** Home is always on the left. When a journey goes from home to somewhere, Mitu travels and faces **left to right**. When she is going back home, **right to left**. Every scene and every incident follows it, in clips and in live play. Others met on the way (Kalam) face the way they are going too.
**In code:** `JOURNEY.OUTWARD` (1) / `JOURNEY.HOMEWARD` (-1) in `src/shared/mituBoat.ts`. Each water scene sets `HEADING` in its `layout.ts`; it is the boat's `sx`, the direction clips move in, and the sign of any push. D and A still mean right and left on screen.
**Ch. 1:** S3 and S4 are outward (left to right). S5 and S6 are homeward (right to left). S5 was mirrored for this: Mitu rows in from the right, Kalam is stuck between her and home, and on "Go home" she rows on past him instead of turning round.

### D19 — Dialogue: every line waits
**Status:** Decided (dh1, after the S2 play-test)
**Choice:** Every spoken line types out and then waits for the player. A small pulsing mark at the bottom-right of the box shows it is waiting. A click anywhere on the screen, Space or Enter shows the next line (changed from "click on the box" after the second S2 play-test). The first line of a scene appears by itself. This applies to every scene (S1's narration and S5 too). Lines are never said inside a clip: a scene that needs lines mid-action splits the clip (S5's `helped` + `farewell`). Timed lines no longer exist in the code.
**Also:** the speaker's name always shows above the line, and in wide shots a soft warm light sits over the speaker's head while they talk (`game/SpeakerLight.ts`). Close-ups show the name only.

### D20 — S2 staging (after the S2 play-test)
**Status:** Decided (dh1)
- **Baby kick:** a first kick (thud, ripple), Amma gasps and lays her hand on her belly, then her line; an ink hand pulses on her belly; **one click** (not a hold); Mitu steps over, kneels, touches; the kick she feels (thud, ring of light, she startles); then the two lines.
- **To Dadi:** Dadi chuckles, pulls her paan box round and pats it; Mitu sits by her; Dadi's line; the close-up.
- **Paan close-up:** Dadi sits across the plate (lap, both hands, bangle on her wrist, face above the picture); the box is open in front. The leaf must go first; then the pieces pause while Dadi turns her bangle and says both lines; then lime and supari in either order, then fold. A picture checklist (no words) shows progress.
- **Lantern:** Dadi reaches behind her for the lantern and holds it out (her first line before, "Take this..." while she holds it); Mitu takes it and sets it down by the bottle; the close-up.
- **Ending:** Mitu picks up the lantern and walks off along a walkway to the ghat (right edge); slow fade to black.
- **No new text:** prompts and the checklist are pictures. **No music** until a real recording exists.

### D21 — S4 staging
**Status:** Decided (dh1, 2026-11-13)
- **Turning for home:** Mitu arrives outward (left to right), and after Rahim sends her home she turns round on screen: the boat swings end-on to the camera and back, now facing left, and she rows out past the left edge (homeward, D18).
- **The net pull stays in the wide shot:** the net rises out of the water between the two boats with each hit; the timing bar sits at the bottom. No close-up plate.
