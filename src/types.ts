// Every data shape in the project, in one place, so a typo in a field name
// is caught by TypeScript instead of showing up as a bug in the browser.
// Interfaces only describe data; they produce no code in the build.
import type { BeatId, ScreenId } from "./content/text";
import type { OneShotId, SoundId } from "./game/placeholders";
import type Loop from "./game/Loop";
import type ClipPlayer from "./game/ClipPlayer";
import type Dialogue from "./game/Dialogue";
import type Choice from "./game/Choice";
import type Hint from "./game/Hint";
import type Sound from "./game/Sound";
import type Fade from "./game/Fade";
import type Debug from "./game/Debug";
import type Progress from "./game/Progress";
import type Card from "./game/Card";

// a point as [x, y]. A tuple (fixed-length array) instead of an interface,
// because the brush code does a lot of arithmetic on points
export type Point = [number, number];

// ---------- text ----------
export interface Line {
    speaker: string
    sy: string
    en: string
    direction?: string
}

export interface ScreenText {
    sy: string
    en: string
}

// ---------- drawing a frame ----------
// (ax, ay) is the waterline point under the boat's middle, inside the sprite image
export interface SpriteDef {
    w: number
    h: number
    ax: number
    ay: number
}

// one pose of a character: the picture and its reflection in the water
export interface SpriteArt {
    img: CanvasImageSource
    refl: CanvasImageSource
}

export interface FrameSprite {
    def: SpriteDef
    art: SpriteArt
    x: number
    z: number
    sx: number                    // 1 = facing right, -1 = facing left
    roll: number
}

export interface Ring {
    x: number
    y: number
    born: number
    scale: number
    a0: number
}

// where Mitu's boat is on screen; live things (lantern glow) are drawn from it
export interface BoatAnchor {
    x: number
    y: number
    scale: number
    sx: number
    roll: number                  // the boat's pitch, so the lantern rides with it
}

export interface Marker {
    x: number
    y: number
    scale: number
}

// A scene's still background. `img` is the painted plate; `backing` is the
// same paper and sky with no scenery. Each figure shows the backing inside its
// own outline before its ink goes on, so nothing behind it shows through.
export interface Plate {
    img: CanvasImageSource
    backing: CanvasImageSource
    front: Front
}

// The foreground (reeds, the near bank), drawn in front of every boat. Each
// piece is a rectangle of one atlas picture; pieces with sway bend in the wind.
export interface FrontPiece {
    sx: number                    // where the piece is in the atlas
    sy: number
    w: number
    h: number
    x: number                     // where its top-left goes on screen
    y: number
    sway: number                  // px the top moves at most; 0 = still
    phase: number                 // radians, so no two reeds move together
}

export interface Front {
    img: CanvasImageSource
    pieces: FrontPiece[]
}

// everything composeFrame() needs to draw one frame
export interface FrameState {
    t: number
    darkness: number
    flash: number
    fade: number
    sprites: FrameSprite[]
    rings: Ring[]
    boat: BoatAnchor | null
    oil: number
    marker: Marker | null
}

// ---------- Mitu's boat ----------
export type Side = "near" | "far";

// p: 0 = oar enters the water, 1 = stroke finished, 0.5 = rest
export interface MituPose {
    side: Side
    p: number
}

export interface OarShape {
    a: number
    hand: Point
    lower: Point
    top: Point
    tip: Point
    entry: Point
}

export interface BoatLook {
    x: number
    z: number
    sx: number
    roll: number
}

// ---------- scene 5 ----------
export interface S5Look {
    t: number
    darkness: number
    flash: number
    fade: number
    mitu: BoatLook
    kalamX: number
    rings: Ring[]
    oil: number
    marker: Marker | null
}

// what a clip adds to a look: the exact poses to paint
export interface S5ClipLook extends S5Look {
    pose: MituPose
    kalamPhase: number
    kalamNod: number
}

// ---------- clips ----------
export interface ClipDef<Look> {
    duration: number
    state(t: number): Look
}

// one entry per video frame: [x, y, scale, sx, darkness, fade, roll]
export interface Track {
    fps: number
    frames: number[][]
}

export interface Cue {
    t: number
    sfx?: OneShotId
    oar?: boolean               // an oar stroke (the sound varies each time)
    line?: [BeatId, number]
    hold?: boolean
    dur?: number
}

export interface PlayOptions {
    keepLastFrame?: boolean       // the last frame stays up (clips that end a scene)
    fromBlack?: boolean           // the clip starts black, so no crossfade is needed
}

// a moment where a clip and live play must look the same
export interface Join {
    clip: string
    at: "start" | "end"
    mitu: { x: number, z: number }
    kalamX: number
    darkness: number
}

// ---------- renderer ----------
export interface InkLayer {
    w: number
    h: number
    wetC: HTMLCanvasElement
    dryC: HTMLCanvasElement
    wet: CanvasRenderingContext2D
    dry: CanvasRenderingContext2D
}

export interface StrokeOptions {
    w?: number
    tone?: number
    dryness?: number
    profile?: "brush" | "tip" | "rise" | "even" | "nail"
    bristles?: number
    loaded?: number
    body?: number
    fade?: number
    gap?: number
}

export interface MassOptions {
    tone?: number
    tone2?: number | null
    jitter?: number
}

export interface SpriteJob {
    name: string
    paint(): SpriteArt
}

// what a scene's plate painter returns (the renderer saves each part as a file)
export interface PaintedPlate {
    img: HTMLCanvasElement
    backing: HTMLCanvasElement
    front: { img: HTMLCanvasElement, pieces: FrontPiece[] }
}

// what the renderer needs from a scene
export interface SceneRender {
    paintPlate(): PaintedPlate
    spriteJobs(): SpriteJob[]
    clips: Record<string, number>                 // clip name -> duration in seconds
    clipFrame(clip: string, t: number): FrameState
    spriteNames: string[]
    joins: Join[]
    joinFrame(join: Join, art: Record<string, SpriteArt>, oil: number): FrameState
}

export interface JoinResult {
    clip: string
    at: string
    diff: number
}

// the functions render.html offers to the Node scripts
export interface RenderApi {
    scenes(): string[]
    init(scene: string): void
    plate(): { plate: string, backing: string, front: string, pieces: FrontPiece[] }   // PNGs as data URLs
    sprites(): string[][]
    clips(): Record<string, number>
    frame(clip: string, index: number): string
    track(clip: string): Track
    checkJoin(index: number, clipFrame: string): Promise<JoinResult>
    joins(): Join[]
}

// ---------- game ----------
export interface ChapterOneFlags {
    lampOil: number
    foundGamchha: boolean
    foundFlute: boolean
    foundTiffin: boolean
    helpedKalam1: boolean
    fishGiven: boolean
}

// player settings, kept when a new game starts. Nothing reads them yet:
// the pause menu (M9) will offer volume and text speed
export interface Settings {
    volume: number                // 0..1
    textSpeed: number             // 1 = normal; higher types faster
}

// Everything kept in localStorage under one key. `version` lets an old save
// be upgraded when this shape changes; `checkpoint` is the scene to resume at.
export interface SaveData {
    version: number
    chapter: number
    checkpoint: string            // a scene id like "s4", or CHAPTER_END
    flags: ChapterOneFlags
    settings: Settings
}

// the live part of a scene: the loop calls these every frame
export interface LiveScene {
    update(dt: number): void
    draw(ctx: CanvasRenderingContext2D): void
}

export interface PushParams {
    contact: { x: number, z: number }
    target: { x: number, z: number }
    reach: number                 // how far apart the two boats' middles are when their ends touch
    distance: number              // how far along x the push moves both boats (negative = leftward)
    onProgress(p: number): void
}

// the shared tools every scene gets
export interface Game {
    loop: Loop
    clips: ClipPlayer
    dialogue: Dialogue
    choice: Choice
    hint: Hint
    sound: Sound
    fade: Fade
    debug: Debug
    card: Card
    progress: Progress
}

export type ScenePlay = (game: Game) => Promise<void>;

export type { BeatId, ScreenId, SoundId };
