// Boat controller. The player steers directly: D and A move the boat right
// and left along the water, W and S move it away from and toward the camera.
// The boat faces the scene's direction of travel (decision D18: right when
// leaving home, left when going back); Mitu's oar strokes play by themselves
// while it moves. Each stroke pushes the boat only while the oar pulls, so it
// surges and slows like a real rowing boat, lifts its bow a little and leaves
// a wake. Plain velocity + drag instead of a physics library: the boat only
// needs a speed in two directions. Nothing here can fail.
import { depthScale, depthY } from "../shared/depth";
import { oarGeometry, strokePitch, wakeRing, WAKE } from "../shared/mituBoat";
import type { Game, Ring, Side } from "../types";

const CONFIG = {
    // each stroke pushes with a half-sine of this strength (px/s²) for the
    // first POWER seconds (while the oar pulls), then the boat coasts. Speed
    // swings between about 115 and 210 px/s; it coasts to a stop in about 2 s.
    THRUST: 880,
    POWER: 0.36,                  // = STROKE_FRAMES × STROKE_FRAME: the pull the sprites show
    DRAG: 1.6,                    // water drag, proportional to speed
    DRAG_FAST: 0.002,             // extra drag that grows with speed², so fast is hard
    MAX_SPEED: 260,               // px/s, a safety limit only
    // the water
    DEPTH_PX: 420,                // px of travel to cross the whole water depth
    BOUNDS: { x0: 140, x1: 1780, z0: 0.12, z1: 1 },
    // oar strokes while moving: one every STROKE_GAP seconds, alternating sides
    STROKE_GAP: 0.65,
    STROKE_FRAME: 0.09,           // seconds per sprite frame
    STROKE_FRAMES: 4,
    STROKE_HOLD: 0.14,
    RING_LIFE: 2.5,
    KEYS: { RIGHT: "KeyD", LEFT: "KeyA", AWAY: "KeyW", TOWARD: "KeyS" },
};

interface StrokeAnim {
    side: Side
    start: number
}

export default class Boat {
    static readonly DEPTH_PX = CONFIG.DEPTH_PX;

    x: number;
    z: number;
    rowing = false;               // true while the player controls the boat
    rings: Ring[] = [];
    private vx = 0;               // px/s along the water
    private vz = 0;               // px/s toward the camera
    private held = new Set<string>();
    private anim: StrokeAnim | null = null;
    private nextStroke = 0;
    private nextWake = 0;

    // facing: the scene's HEADING (JOURNEY.OUTWARD or JOURNEY.HOMEWARD), used as the sprite's sx
    constructor(private game: Game, x: number, z: number, readonly facing: number) {
        this.x = x;
        this.z = z;
        document.addEventListener("keydown", this.onKeyDown);
        document.addEventListener("keyup", this.onKeyUp);
        window.addEventListener("blur", this.onBlur);
    }

    // stop listening for keys (when the scene ends)
    dispose(): void {
        document.removeEventListener("keydown", this.onKeyDown);
        document.removeEventListener("keyup", this.onKeyUp);
        window.removeEventListener("blur", this.onBlur);
    }

    // the bow's lift right now (radians), for the sprite's roll
    get roll(): number {
        return this.anim ? strokePitch(this.game.loop.t - this.anim.start, CONFIG.POWER, this.facing) : 0;
    }

    // the sprite to draw now: a stroke frame while a stroke plays, else rest
    spriteName(): string {
        if (!this.anim) return "mitu_rest";
        const elapsed = this.game.loop.t - this.anim.start;
        const i = Math.min(CONFIG.STROKE_FRAMES - 1, Math.floor(elapsed / CONFIG.STROKE_FRAME));
        return `mitu_${this.anim.side}_${i}`;
    }

    stop(): void {
        this.vx = 0;
        this.vz = 0;
    }

    // play one stroke's animation, ring and sound on the side after the last one
    strokeAnim(): void {
        const side: Side = this.anim?.side === "near" ? "far" : "near";
        const scale = depthScale(this.z);
        const entry = oarGeometry({ side, p: 0.05 }).entry;
        this.anim = { side, start: this.game.loop.t };
        this.rings.push({ x: this.x + entry[0] * scale * this.facing, y: depthY(this.z) + 2, born: this.game.loop.t, scale, a0: Math.random() * Math.PI * 2 });
        this.game.sound.oar();
    }

    update(dt: number): void {
        const t = this.game.loop.t, B = CONFIG.BOUNDS, K = CONFIG.KEYS;

        // which way the held keys point: -1, 0 or 1 on each axis
        let dx = 0, dz = 0;
        if (this.rowing) {
            dx = Number(this.held.has(K.RIGHT)) - Number(this.held.has(K.LEFT));
            dz = Number(this.held.has(K.TOWARD)) - Number(this.held.has(K.AWAY));
        }
        const isSteering = dx !== 0 || dz !== 0;
        if (isSteering && t >= this.nextStroke) {
            this.strokeAnim();
            this.nextStroke = t + CONFIG.STROKE_GAP;
        }
        // the push comes only while the oar pulls: a half-sine over POWER seconds
        const age = this.anim ? t - this.anim.start : CONFIG.POWER;
        if (isSteering && age < CONFIG.POWER) {
            // a diagonal is two keys at once; divide so it isn't faster than one
            const len = Math.hypot(dx, dz);
            const push = CONFIG.THRUST * Math.sin((Math.PI * age) / CONFIG.POWER) * dt;
            this.vx += (dx / len) * push;
            this.vz += (dz / len) * push;
        }

        // New here: frame-rate independent damping. Multiplying by exp(-k * dt)
        // slows things by the same amount per second at 30 fps and at 144 fps.
        // The speed² part makes high speeds cost more, as in real water.
        let speed = Math.hypot(this.vx, this.vz);
        const drag = Math.exp(-(CONFIG.DRAG + CONFIG.DRAG_FAST * speed) * dt);
        this.vx *= drag;
        this.vz *= drag;
        speed *= drag;
        if (speed > CONFIG.MAX_SPEED) {
            this.vx *= CONFIG.MAX_SPEED / speed;
            this.vz *= CONFIG.MAX_SPEED / speed;
        }
        this.x += this.vx * dt;
        this.z += (this.vz * dt) / CONFIG.DEPTH_PX;

        // soft edges: the boat stops at the edge of the water, never stuck
        if (this.x < B.x0 || this.x > B.x1) this.vx = 0;
        if (this.z < B.z0 || this.z > B.z1) this.vz = 0;
        this.x = Math.max(B.x0, Math.min(B.x1, this.x));
        this.z = Math.max(B.z0, Math.min(B.z1, this.z));

        // a small ring off the stern every so often while the boat is moving
        if (speed > WAKE.MIN_SPEED && t >= this.nextWake) {
            this.rings.push(wakeRing(this.x, depthY(this.z) + 2, depthScale(this.z), this.facing, t, Math.random() * Math.PI * 2));
            this.nextWake = t + WAKE.GAP;
        }

        // back to the rest sprite when the stroke animation is over
        if (this.anim && t - this.anim.start > CONFIG.STROKE_FRAMES * CONFIG.STROKE_FRAME + CONFIG.STROKE_HOLD) this.anim = null;
        // rings are added in time order, so only the oldest can be finished
        while (this.rings.length > 0 && t - this.rings[0].born > CONFIG.RING_LIFE) this.rings.shift();
    }

    debugLine(): string {
        return `boat      x ${this.x.toFixed(0)}  z ${this.z.toFixed(2)}  speed ${Math.hypot(this.vx, this.vz).toFixed(0)}  keys ${[...this.held].join(" ") || "-"}`;
    }

    private onKeyDown = (e: KeyboardEvent): void => {
        this.held.add(e.code);
    };

    private onKeyUp = (e: KeyboardEvent): void => {
        this.held.delete(e.code);
    };

    // a key released while the window is in the background would stay "held"
    private onBlur = (): void => {
        this.held.clear();
    };
}
