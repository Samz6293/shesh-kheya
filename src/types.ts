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
import type Pointer from "./game/Pointer";
import type OilMeter from "./game/OilMeter";

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
    y?: number                    // set for figures on a floor (S2): stands on this line, no bob, scale 1
}

// a small warm light that flickers or glints (the kupi, Dadi's bangle).
// Not player-dependent, so it is drawn into clips and live frames alike
export interface Glint {
    x: number
    y: number
    r: number                     // px
    light: "kupi" | "bangle"
    phase: number                 // radians, so two glints don't pulse together
    isBehind: boolean             // behind the figures (a lamp in the house), or on one (a bangle)
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
    root?: number                 // rows from the piece's top where it is fixed (a tree's foot); default: its bottom
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
    glints: Glint[]
    ring: LightRing | null        // a ring of warm light spreading out (the baby's kick)
}

// one ring of light; u 0..1 is how far through its life it is
export interface LightRing {
    x: number
    y: number
    radius: number
    u: number
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

// ---------- scene 2 ----------
// a figure drawn from a few joints, measured from the point on the floor under it
export interface Skeleton {
    hip: Point
    kneeF: Point                  // F = the leg nearer the way she faces
    footF: Point
    kneeB: Point
    footB: Point
    shoulder: Point
    head: Point
    handF: Point
    handB: Point
}

// Mitu on the veranda. low: 0 standing .. 1 kneeling; sit: .. 1 sitting.
// walk: 0..1 through a stride (two steps). lean: radians, + is forward
export interface MituFloorPose {
    walk: number
    low: number
    sit: number
    lean: number
    reach: Point | null           // where her front hand goes (from the anchor); null = resting
    carry: boolean                // holding the lantern at her side
}

// hand: 0 on her lap .. 1 on her belly; gasp: 0..1 (head lifts, at the first kick)
export interface AmmaPose {
    hand: number
    gasp: number
}

// chuckle: 0..1 (shoulders up); reach: where her hand goes; lean: radians, + is forward
export interface DadiPose {
    chuckle: number
    reach: Point | null
    lean: number
}

// where a prop (paan box, lantern, bottle) is: x and the y of its bottom on screen, z for drawing order
export interface PropPlace {
    x: number
    y: number
    z: number
}

// everything that changes in the S2 wide shot
export interface S2Look {
    t: number
    fade: number
    mituX: number
    mituY: number                 // the floor under Mitu (the walkway slopes down)
    box: PropPlace
    lantern: PropPlace
    bottle: PropPlace
    ring: LightRing | null
}

// a clip also says the exact poses to paint
export interface S2ClipLook extends S2Look {
    mitu: MituFloorPose
    amma: AmmaPose
    dadi: DadiPose
}

// a moment between clips: where everyone is and which sprite each shows
export interface S2State {
    mituX: number
    mitu: string                  // sprite names
    amma: string
    dadi: string
    box: PropPlace
    lantern: PropPlace
    bottle: PropPlace
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
}

export interface PlayOptions {
    keepLastFrame?: boolean       // the last frame stays up (clips that end a scene)
    fromBlack?: boolean           // the clip starts black, so no crossfade is needed
    overlay?(ctx: CanvasRenderingContext2D): void     // drawn live over each video frame (S2's swaying reeds)
}

// a moment where a clip and live play must look the same
export interface Join {
    clip: string
    at: "start" | "end"
    mitu: { x: number, z: number }
    kalamX?: number               // S5 only
    darkness: number
    state?: string                // S2: the live state (layout.ts STATES) at this join
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

// a picture that is not a figure on the water: close-up plates and the things
// on them (S2's paan and lantern). Saved as <name>.png, no reflection
export interface StillJob {
    name: string
    paint(): HTMLCanvasElement
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
    stills?(): StillJob[]
    // true: the foreground is left out of the clips and drawn live on top of
    // them, so its sway needs no sync point and a clip can start at any moment
    isFrontLive?: boolean
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
    stills(): string[][]                          // [name, PNG data URL]
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

// a thing the player drags in a close-up (S2's paan pieces)
export interface Draggable {
    name: string
    home: Point                   // where it rests, and floats back to
    x: number
    y: number
    radius: number                // px round its middle that picks it up
    isActive: boolean             // can be picked up now
    returning: { from: Point, start: number } | null
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
    pointer: Pointer
    oil: OilMeter
}

export type ScenePlay = (game: Game) => Promise<void>;

export type { BeatId, ScreenId, SoundId };
