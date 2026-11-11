# 05 — Code Style (dh1 style, adapted for this game)

This project follows the `dh1-code-style` skill. That skill is written for Next.js + Tailwind + shadcn; this game is Vite + TypeScript + Canvas 2D + HTML video + an HTML overlay, so the React/Tailwind/shadcn parts don't apply. Everything else does. When in doubt, the skill's principles win: **dh1 must be able to explain every line.**

## Priorities
1. dh1 understands everything that lands in the repo.
2. Code looks like his.
3. Readable beats clever.

## Explaining the code
The game is built by FABLE in one long session, so explanations live in the repo instead of the chat:

- **File header.** Every file starts with a 2–4 line comment: what it does, why it is built this way, what the alternative was.
  ```ts
  // Rowing controller. Each A/D press is a stroke; alternating strokes in time
  // push the boat forward, repeated strokes on one side turn it.
  // Plain velocity + drag instead of a physics library: the boat only needs
  // speed and heading, not collisions.
  ```
- **New concepts are labelled** where they first appear, with one line and the doc page:
  ```ts
  // New here: Intl.Segmenter. Splits text into what a reader sees as one letter
  // (grapheme), so Bengali conjuncts like "ন্ধ" never appear half-typed.
  // Docs: MDN, Intl.Segmenter
  ```
- **`docs/LEARNING.md`** gets 2–4 lines per milestone under "What you learned": the concept and the file it lives in.
- Anything outside the "already knows" list in the skill gets a one-line comment. If it can't be explained in one line, it is too clever for this codebase.

Expected new concepts (keep it to these):

| Concept | Where |
|---|---|
| Canvas 2D drawing and compositing (`multiply`, `screen`, `destination-in`) | `shared/compose.ts`, `render/brush.ts` |
| Game loop with `requestAnimationFrame` and delta time | `game/loop.ts`, `game/Boat.ts` |
| Turning events into Promises to `await` them | `game/loop.ts`, `ClipPlayer.ts`, activities |
| `HTMLVideoElement` events (`playing`, `ended`) and `currentTime` | `game/ClipPlayer.ts` |
| Seeded random numbers (same seed, same drawing) | `render/brush.ts` |
| `Intl.Segmenter` | `game/Dialogue.ts` |
| Web Audio API | `game/Sound.ts` |
| `localStorage` with versioning | `game/save.ts` |
| Playwright (headless browser) + ffmpeg from a Node script | `scripts/render.ts` |

## Formatting
- 4-space indent, double quotes, semicolons.
- `export default class Name` or `export default function name`, **one per file**.
- Class files are PascalCase (`Boat.ts`, `ClipPlayer.ts`); plain modules are camelCase (`save.ts`, `compose.ts`, `layout.ts`).
- Short lowercase comments label blocks: `// activity 2: paan`. Comment logic only where the reason isn't obvious.
- Guard clauses first:
  ```ts
  if (!line) throw new Error(`Unknown line: ${beatId}[${index}]`);
  if (this.isDone) return;
  ```

## TypeScript
- All data shapes are `interface`s in `src/types.ts`.
- No `any`. Use `as` only with a comment saying why it is safe.
- Functions that return data declare their return type (`load(): SaveData`, `run(): Promise<number>`).
- Booleans are `isX` / `hasX`; in-progress flags are `pouring`, `pushing`, `typing`.
- Compute derived values instead of storing them (e.g. glow size from `lampOil`).

## Nothing raw in the game code
- **Numbers** (positions, timings, speeds) → the scene's `layout.ts` (if the renderer needs them too) or a `CONFIG` object at the top of the file that uses them, grouped with a comment per group.
- **Colours** → `shared/ink.ts` and the light colours in `shared/compose.ts`; overlay colours as CSS variables in `styles/main.css`. One name per colour.
- **Text** → `src/content/**.json`. Not a single Bengali or English line in `.ts` files.
- **Asset and clip paths** → built from scene id + name in one helper, never typed out per use.

## Renderer code
- Every painter sets its seed first (`setSeed(n)`), so the same pose always paints the same pixels.
- Painters take a pose object and return a canvas; they never read the clock.
- Clips are pure functions: `state(t)` returns positions and poses for time `t`, nothing else.

## Overlay CSS (`src/styles/main.css`)
- Tokens at the top in `:root`, used below with `var(--name)`.
- Keep the debug line at the top, commented: `/* *{ outline: 1px solid red; } */`
- Sizes in `cqw` on the 16:9 stage, so text scales with the picture.
- Short lowercase class names: `.dialogue`, `.dialogue-line`, `.choice`, `.hint`, `.screen`.

## Keeping it maintainable
- Scenes tell the story, activities are mini-games, `game/` and `shared/` are shared tools. Don't mix them.
- No abstraction until the same code exists three times.
- Split a file when it passes about 150 lines.
- Repeated values become a constant array used in a loop.

## Git
Same as the skill, section 8:
- Work happens on a branch: `feature/<name>` or `fix/<name>`. Never on `main`.
- dh1 runs every git command that changes the repo. Agents may only run read-only ones (`git status`, `git branch --show-current`, `git grep`).
- Postponed work gets a `TODO:` comment at the exact spot and is listed in `docs/BUILD_LOG.md`.
- Before merging: `git status` clean and `git grep -n "TODO:"` empty.
- Commit messages follow the seven rules (subject ≤ 50 chars, imperative, capitalised, no period, blank line, body wrapped at 72 explaining what and why).
- Rendered PNG/MP4 files are committed with the code that made them, in the same commit.
