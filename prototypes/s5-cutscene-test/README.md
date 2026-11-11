# Scene 5 test — cutscene + gameplay handoff

A throwaway prototype that answers one question: **can most of the game be pre-rendered video, with live gameplay only where interaction is needed, without the player seeing the joins?**

It is Scene 5 of Chapter 1 (কালাম মাঝি), because that scene has everything: a cutscene, a choice, free rowing, a hold-to-push activity that changes the sky, and a different cutscene for each choice.

## Run it

Double-click `index.html` (Chrome or Edge). No server or build needed.

| Key | Does |
|---|---|
| Click / Enter | Next line |
| 1 / 2 | Pick a choice |
| A / D | Row (alternate to go straight, repeat one side to turn) |
| Space (hold) | Push Kalam's boat |
| Esc | Skip a cutscene |
| ` (backtick) | Debug read-out: mode, clock, boat, rhythm, push, flags |

## What happens

```
intro.mp4 (8 s) ──► Kalam's line ──► choice
                                        ├─ Help ──► row to Kalam's stern (live) ──► hold Space 8 s, sky darkens (live) ──► helped.mp4 (14 s)
                                        └─ Go home ──► Mitu's line ──► declined.mp4 (11 s)
```

## How the joins stay invisible

1. **One drawing function for both.** `shared.js` has `composeFrame()`. The renderer used it to draw every video frame; the game uses it to draw every live frame, with the same background plate, the same sprites and the same numbers.
2. **Clips start and end in a known pose.** Boats at rest, oar at rest, at fixed positions (`S5.MITU_START`, `S5.CONTACT`).
3. **Sync points.** Looping motions (boat bob, Kalam's push) repeat every 4 s. Clips start and end on a multiple of 4 s, and the game waits for the next one before starting a clip, so every loop is at phase 0 on both sides.
4. **Short crossfade (300 ms)** hides the last bit of video compression difference. Measured: the game frame and the video frame differ by less than 1/255 on average.
5. **Videos are silent.** All sound (water, wind, oars, thunder) comes from the game, timed to the video clock by the cue lists in `game.js`. The ambience never restarts at a join.
6. **Text is never burned into the video.** Dialogue is HTML on top, read from `src/content/ch1/dialogue.json`, so fixing a Sylheti line never means re-rendering.

## Files

| File | What it is |
|---|---|
| `index.html`, `style.css` | Page: canvas, three `<video>`s, text layer |
| `shared.js` | Positions, timing, and `composeFrame()` — shared with the renderer |
| `game.js` | Scene flow, video cues, rowing, push, sync points |
| `ui.js` | Dialogue (Bengali-safe typewriter), choice, hint, debug |
| `audio.js` | Placeholder sounds made live with Web Audio |
| `content.js` | Generated copy of the dialogue JSON (the page can't `fetch` local JSON from `file://`) |
| `assets/` | `plate.png` (everything that never moves), 9 Mitu sprites, 8 Kalam sprites, each with a reflection |
| `video/` | `intro.mp4`, `helped.mp4`, `declined.mp4` (H.264, 1080p, 24 fps) |
| `render/` | Offline renderer: ink brush engine, the scene, and `render.py` that paints frames in a headless browser and encodes them with ffmpeg |

## Re-rendering

```
cd render
python make_content.py           # after editing dialogue.json
python render.py ..              # plate, sprites and all three videos (~5 min)
python render.py .. helped       # just one clip
```

If you change anything in `shared.js` (positions, sync timing), re-render the videos, or the joins will stop matching.

## What this test showed

- **The joins work** when the rules above are followed. The cost is discipline: every clip must start and end in a pose the game can reproduce.
- **Rowing feels different from the cutscenes.** The video oar moves smoothly; the game uses 4 sprite frames per stroke. Compare them and decide if that's acceptable or if gameplay needs more frames.
- **Branching multiplies video.** One choice made 2 end clips. Choices that stack (helped Kalam × found the flute × lamp oil level) multiply fast; those differences are better drawn live on top of a shared video, like the lantern glow here.
- **File size is small** for this style (about 4.4 MB for 33 s), because ink on paper compresses well.
