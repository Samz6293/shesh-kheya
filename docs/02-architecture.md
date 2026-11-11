# 02 — Technical Architecture

Goal: runs smoothly in a desktop browser, stays easy to read and extend to 4 chapters, looks like an ink painting.

**The approach:** most of the game is **pre-rendered video** (cutscenes). Live code takes over only where the player acts. The two are drawn by the same code, so the player can't see where one ends and the other begins.

Reference implementation: `prototypes/s5-cutscene-test/` (Scene 5, both choices, playable). When this doc and the prototype disagree, this doc wins; when this doc is silent, do what the prototype does.

## Stack

| Piece | Choice | Why |
|---|---|---|
| Build tool | **Vite** (vanilla TypeScript) | Dev server, static build, two entry pages (game + renderer). |
| Language | **TypeScript**, strict | Catches typos in flag names, clip names and dialogue ids. |
| Drawing | **Canvas 2D** | Everything live is a background image, a few sprites, ripples and washes. The prototype does it in ~600 lines; an engine would add more than it saves. |
| Cutscenes | **HTML `<video>`**, H.264 MP4, 1920×1080, 24 fps, no audio track | Plays everywhere, hardware decoded, small files for this style (~0.13 MB/s). |
| Text / UI | **HTML overlay** on top of canvas and video | Bengali shaping, crisp text, never burned into video. |
| Sound | **Web Audio API** | One continuous sound layer across videos and gameplay. |
| Renderer | Same TypeScript code, run in a headless browser by **Playwright**, encoded by **ffmpeg** | The videos are made from code (no video models), so every frame is reproducible. |
| Fonts | Tiro Bangla (self-hosted woff2) | No network font loading during play. |
| Save | `localStorage`, one versioned JSON object | No server. |

No game engine. If a later chapter needs physics or a tilemap, revisit this (see D1 in `07-decisions.md`).

## Two programs, one codebase

```
             ┌──────────── src/shared (positions, timing, composeFrame) ───────────┐
             │                                                                      │
   RENDERER (offline, dev machine)                                    GAME (browser, player)
   render.html + scripts/render.ts                                    index.html + src/game
   paints plates, sprites, every clip frame                           plays clips, runs live parts,
   → public/assets/**.png, public/video/**.mp4  ───────────────────►  loads those files
```

- **Renderer**: an ink brush engine plus one folder per scene that paints the scene's still background (**plate**), the moving characters (**sprites**, one image per pose), and describes each **clip** as a function of time. A Node script opens `render.html` in headless Chromium, asks for every frame, and pipes them to ffmpeg.
- **Game**: loads the plate, sprites and clips; plays clips; runs live activities by drawing the plate and sprites with the same `composeFrame()` the renderer used.
- Rendered files are committed to git, so deploying never needs the renderer.

## Folder structure

```
shesh-kheya/
    index.html                    the game
    render.html                   the renderer page (dev only, not deployed)
    scripts/
        render.ts                 Playwright + ffmpeg driver: npm run render -- s5
        check-joins.ts            compares game frames with clip frames at every join
    public/
        assets/<scene>/           plate.png, <sprite>_<pose>.png, <sprite>_<pose>_refl.png
        video/<scene>/            <clip>.mp4, <clip>.track.json
        audio/                    real recordings, <id>.ogg + <id>.m4a (later)
        fonts/
    src/
        types.ts                  all interfaces
        content/ch1/dialogue.json ALL chapter 1 text
        shared/
            compose.ts            composeFrame(): plate → reflections → rings → sprites → darkness → light
            depth.ts              water plane: depthY(z), depthScale(z), bob(t)
            ink.ts                inkRGBA(): the one ink colour ramp
        render/
            main.ts               render.html entry: exposes paint and frame functions to the script
            brush.ts              strokes, masses, wet/dry layers, bleed (from prototype engine.js)
            paper.ts              paper texture, grain, vignette
        scenes/ch1/
            s5-kalam/             one folder per scene, same files in each:
                layout.ts         SHARED: positions, rest poses, sprite sizes, sync period
                paint.ts          RENDER: plate + sprite painters for this scene
                clips.ts          RENDER: each clip as state(t), duration, start/end poses
                cues.ts           GAME: sound + text cues per clip, by clip time
                play.ts           GAME: the scene's flow (async), live parts
            s1-opening/ … s6-return/
        game/
            main.ts               boot, start screen, scene order
            loop.ts               requestAnimationFrame loop, clock, waitFor(), waitSync()
            ClipPlayer.ts         plays a clip, fires cues, crossfades at both ends
            Dialogue.ts           overlay text, typewriter (Intl.Segmenter), hold / timed lines
            Choice.ts             choice buttons, returns the picked id
            Hint.ts               key hints + progress bar
            Sound.ts              ambience layers, one-shots, fades
            save.ts               load/save/migrate
            Boat.ts               rowing controller (used in most scenes)
            activities/           BabyKick, PaanMaking, LanternOil, MemoryPickup, NetPull, FishLift, PushBoat
        styles/main.css
```

Per-scene rule: **`layout.ts` is the only scene file both programs import.** `paint.ts` and `clips.ts` are never imported by the game, so they stay out of the game bundle.

## The handoff rules (how joins stay invisible)

These are what made the prototype seamless. Every scene must follow them.

1. **Same drawing code.** Clip frames and live frames are both drawn by `composeFrame()` from the same plate and sprites. Measured in the prototype: under 1/255 average difference, which is only video compression.
2. **Rest poses at every join.** A clip that hands over to gameplay ends in a pose the game has a sprite for, at a position in `layout.ts`. A clip that starts after gameplay starts from such a pose; the game eases the player into it first (like the prototype's contact snap before the push).
3. **Sync points.** Every looping motion (bob, idle loops, Kalam's push) has a period that divides `SYNC` (4 s). Clips start and end at phase 0. Before playing a clip, the game waits for the next multiple of `SYNC` on its clock (at most 4 s, usually while a line is being read).
4. **Crossfade 300 ms** at both ends hides compression.
5. **Videos are silent.** All sound comes from `Sound.ts`, timed by `cues.ts` against `video.currentTime`. Ambience never restarts.
6. **Text is never in the video.** Dialogue comes from `dialogue.json` and is timed by `cues.ts`. Editing a line never needs a re-render.
7. **Anything that differs between players is drawn live**, never rendered into a clip: lantern glow (from `lampOil`), memories lying in the boat, the darkening from helping Kalam. A clip only branches when the story itself branches (Help / Go home). To draw live things on top of a moving clip, the renderer exports a **track** (`<clip>.track.json`: the boat's x, z, scale and flip per frame) and the game draws the overlay at that position.
8. **Changing `layout.ts` means re-rendering that scene.** `npm run render -- <scene>`.

## What is video and what is live (Chapter 1)

| Scene | Video clips | Live parts |
|---|---|---|
| S1 Opening | none | black screen, narration and title cards as overlay text, water sound |
| S2 Home | `arrive` (house, Amma, Dadi, dusk) | A1 baby kick (on the plate), A2 paan and A3 lantern (close-up plates) |
| S3 Rowing | `board` (Mitu gets into the boat) | rowing + 3 memories, lantern glow |
| S4 Rahim | `meet`, `fish` (net comes up, fish jumps) | A5 net pull, fish drag into the boat |
| S5 Kalam | `intro`, `helped`, `declined` | choice, rowing to Kalam, hold-to-push |
| S6 Return | `return` (dock, pot, lightning, rain) | lantern glow and memories in the boat via the track |

Activities that need the hands close up (paan, lantern, net) use their own **close-up plate**, painted in the same style and faded in over the scene.

## Scene flow

A scene's `play.ts` reads like the script, using `await`:

```ts
export default async function playKalam(game: Game) {
    await game.clips.play("s5", "intro");
    await game.dialogue.hold("s5.intro", 0);

    const pick = await game.choice.ask(["choiceHelp", "choiceGoHome"]);

    if (pick === "choiceHelp") {
        saveFlags({ helpedKalam1: true });
        await rowTo(game, layout.CONTACT);
        await new PushBoat(game).run();
        await game.loop.waitSync();
        await game.clips.play("s5", "helped", { keepLastFrame: true });
    }
    else {
        saveFlags({ helpedKalam1: false });
        await game.dialogue.hold("s5.declined", 0);
        await game.loop.waitSync();
        await game.clips.play("s5", "declined", { keepLastFrame: true });
    }
}
```

## Clip player

- Preloads the current scene's clips (`preload="auto"`) and the next scene's first clip.
- `play(scene, clip)`: rewinds, plays, fades in on `playing`, fires cues by `currentTime`, and on `ended` sets the game clock to the clip's end time, lets the canvas draw the matching frame, then fades out.
- Esc skips to the last frame. Hold lines that were skipped still appear afterwards; timed lines are dropped.
- Pausing (Esc menu, hidden tab) pauses the video and the sound.

## Rowing controller (`Boat.ts`)

Side view with depth (decision D2): x moves along the water, z moves toward (1) or away from (0) the camera; sprites scale with z. Starting values come from the prototype (`game.js`, `CFG`):

- A stroke is in rhythm when it alternates side and comes 0.3–1.0 s after the previous one.
- In rhythm: strong forward push, tiny turn (alternating strokes cancel out). Same side repeated: weaker push, clear turn. Too fast: weak push and the boat rolls. After a pause: a normal "start" stroke.
- Drag slows the boat smoothly; edges clamp softly; nothing can get stuck.
- A is the boat's left (port). Facing right that is the far side, facing left the near side. The oar sprite follows.

## Save (`game/save.ts`)

```ts
export interface SaveData {
    version: number
    chapter: number
    checkpoint: string            // scene id to resume from, e.g. "s4"
    flags: ChapterOneFlags
    settings: Settings
}

export interface ChapterOneFlags {
    lampOil: number
    foundGamchha: boolean
    foundFlute: boolean
    foundTiffin: boolean
    helpedKalam1: boolean
    fishGiven: boolean
}
```

One key, `shesh-kheya-save`. Save at the start of each scene and after any flag change. Old versions migrate; broken data falls back to defaults. `localStorage` calls are wrapped in `try/catch`.

## Performance budget

- Live frames: one plate + up to ~6 sprites + rings + 2 gradient washes. 60 fps at 1920×1080 in the prototype.
- Video: 1080p24 H.264, CRF 20. Chapter 1 target under 60 MB total, each clip under 5 MB.
- Start screen in under 3 s: preload only S1 and S2's first clip, then load each next scene while the current one plays.
- No per-frame allocation in hot paths (`update`, `composeFrame`).

## Renderer workflow

```
npm run render -- s5              # plate, sprites, clips for one scene
npm run render -- s5 helped       # one clip
npm run render -- all
```

- Needs Node, Playwright's Chromium (`npx playwright install chromium`) and ffmpeg on PATH.
- About 0.4 s per frame; a 10 s clip renders in about 2 minutes.
- Writes the first and last frame of each clip to `render/_check/` so joins can be compared by eye.
- Deterministic: every stroke is seeded, so re-rendering unchanged code gives identical frames.

## Testing

- `npm run dev` to play; `npm run build && npm run preview` before every merge; `tsc --noEmit` must pass.
- `?debug` (or the backtick key): mode, clock, next sync, clip time, boat x/z/heading/speed, last stroke gap and quality, flags.
- `?scene=s4`: start at a scene with default flags.
- `scripts/check-joins.ts`: for each join, draws the game's frame at the handoff and compares it with the clip's first/last frame. Fails above 2/255 mean difference.
- Manual playtest checklist: `06-build-plan.md`.
