// Activity 2: making paan for Dadi, on the close-up. Dadi sits across the
// plate; the paan box is open in front of Mitu. The leaf goes onto the plate
// first; then Dadi turns her bangle and says her two lines (nothing can be
// picked up meanwhile); then the lime and the supari go onto the leaf, either
// order, and a click folds it and hands it to her. A picture checklist down
// the right shows what is done and what is next. A piece let go in the wrong
// place floats back home, so there are no wrong moves.
import { drawGlints, drawGlow } from "../../shared/lights";
import { inkRGBA } from "../../shared/ink";
import { lerp, smooth } from "../../shared/math";
import { PAAN, STILL } from "../../scenes/ch1/s2-home/layout";
import type { Draggable, Game, Glint, Point } from "../../types";

const CONFIG = {
    RETURN: 0.5,                  // seconds for a piece to float home (or onto the plate)
    FOLD: 0.6,
    GIVE: 1.0,                    // seconds for the folded paan to reach Dadi's hand
    END_PAUSE: 1.0,
    LINES_AFTER: 0.6,             // seconds after the leaf lands before Dadi speaks
    GLOW: { RADIUS: 100, STRENGTH: 0.7 },
    BANGLE: { TURN: 1.6, GLINT_R: 20, REST_ANGLE: Math.PI / 2 },   // the glint goes round while she turns it
    TOPPING_AT: { CHUN: [-20, -14] as Point, SUPARI: [22, 24] as Point },   // where they sit on the leaf
    CHECK: { DIM: 0.3, DONE: 0.55, TICK_INK: 0.9, TICK_W: 6 },
};

type Step = "leaf" | "listen" | "toppings" | "fold" | "folding" | "give" | "done";

export default class PaanMaking {
    private step: Step = "leaf";
    private leaf: Draggable;
    private chun: Draggable;
    private supari: Draggable;
    private hasChun = false;
    private hasSupari = false;
    private dragging: Draggable | null = null;
    private grab: Point = [0, 0];
    private stepAt = 0;           // clock time the current step began
    private turnAngle: number = CONFIG.BANGLE.REST_ANGLE;
    private isRunning = false;
    private glint: Glint = { x: 0, y: 0, r: CONFIG.BANGLE.GLINT_R, light: "bangle", phase: 0, isBehind: false };

    constructor(private game: Game, private stills: Record<string, HTMLImageElement>) {
        this.leaf = piece(STILL.LEAF, PAAN.LEAF_HOME, true);
        this.chun = piece(STILL.CHUN, PAAN.CHUN_HOME, false);
        this.supari = piece(STILL.SUPARI, PAAN.SUPARI_HOME, false);
    }

    // resolves when the paan is in Dadi's hand
    async run(): Promise<void> {
        const loop = this.game.loop;
        this.isRunning = true;
        this.game.pointer.reset();

        // the leaf first; then Dadi talks about her bangle while the player listens
        await loop.waitFor(() => this.step === "listen");
        await loop.wait(CONFIG.LINES_AFTER);
        await this.game.dialogue.hold("a2.paan.during", 0);
        await this.game.dialogue.hold("a2.paan.during", 1);
        this.game.pointer.reset();    // the click that moved the line on is not a pick-up
        this.chun.isActive = true;
        this.supari.isActive = true;
        this.setStep("toppings");

        await loop.waitFor(() => this.step === "done");
        this.isRunning = false;
        this.game.pointer.setCursor("default");
    }

    update(dt: number): void {
        if (!this.isRunning) return;
        const t = this.game.loop.t, pointer = this.game.pointer;
        for (const p of [this.leaf, this.chun, this.supari]) floatHome(p, t);
        if (this.step === "listen") this.turnAngle += CONFIG.BANGLE.TURN * dt;
        if (this.step === "folding" && t - this.stepAt >= CONFIG.FOLD) this.setStep("give");
        if (this.step === "give" && t - this.stepAt >= CONFIG.GIVE + CONFIG.END_PAUSE) this.setStep("done");

        if (this.dragging) {
            this.dragging.x = pointer.x - this.grab[0];
            this.dragging.y = pointer.y - this.grab[1];
            if (pointer.takeRelease()) this.drop(this.dragging);
            pointer.setCursor("grabbing");
            return;
        }
        const canFold = this.step === "fold" && pointer.isNear(this.leaf.x, this.leaf.y, PAAN.PICK_RADIUS);
        const hover = this.pieceUnder(pointer.x, pointer.y);
        pointer.setCursor(canFold ? "pointer" : hover ? "grab" : "default");
        if (!pointer.takePress()) return;
        if (canFold) {
            this.setStep("folding");
            this.game.sound.play("sfx_paan_fold");
            return;
        }
        if (!hover) return;
        this.dragging = hover;
        this.grab = [pointer.x - hover.x, pointer.y - hover.y];
        pointer.takeRelease();        // a release from before this press doesn't count
    }

    draw(ctx: CanvasRenderingContext2D): void {
        const t = this.game.loop.t;
        ctx.drawImage(this.stills[STILL.PAAN_PLATE], 0, 0);
        this.drawBangleGlint(ctx, t);
        this.drawLeaf(ctx, t);
        for (const p of [this.chun, this.supari]) if (p !== this.dragging) this.drawPiece(ctx, p.name, p.x, p.y);
        if (this.dragging && this.dragging !== this.leaf) this.drawPiece(ctx, this.dragging.name, this.dragging.x, this.dragging.y);
        this.drawChecklist(ctx);

        // a soft glow on whatever can be used next
        if (this.dragging) return;
        for (const p of [this.leaf, this.chun, this.supari]) {
            if (p.isActive && !p.returning) drawGlow(ctx, p.x, p.y, CONFIG.GLOW.RADIUS, CONFIG.GLOW.STRENGTH, t);
        }
        if (this.step === "fold") drawGlow(ctx, this.leaf.x, this.leaf.y, CONFIG.GLOW.RADIUS, CONFIG.GLOW.STRENGTH, t);
    }

    debugLine(): string {
        return `paan      ${this.step}  lime ${this.hasChun}  supari ${this.hasSupari}`;
    }

    // the glint travels round the slanted ring as she turns it; on the far side it is small
    private drawBangleGlint(ctx: CanvasRenderingContext2D, t: number): void {
        const B = PAAN.BANGLE, a = this.turnAngle;
        const x = B.RX * Math.cos(a), y = B.RY * Math.sin(a);
        this.glint.x = PAAN.WRIST[0] + x * Math.cos(B.TILT) - y * Math.sin(B.TILT);
        this.glint.y = PAAN.WRIST[1] + x * Math.sin(B.TILT) + y * Math.cos(B.TILT);
        this.glint.r = CONFIG.BANGLE.GLINT_R * (0.35 + 0.65 * Math.max(0, Math.sin(a)));
        drawGlints(ctx, [this.glint], t, false);
    }

    // four small pictures down the right: leaf, lime, supari, folded paan.
    // Dim = not yet possible; ticked = done
    private drawChecklist(ctx: CanvasRenderingContext2D): void {
        const L = PAAN.CHECKLIST, C = CONFIG.CHECK;
        const isPlaced = this.step !== "leaf";
        const isFolded = this.step === "folding" || this.step === "give" || this.step === "done";
        const items: [string, boolean, boolean][] = [        // [picture, can do now or done, done]
            [STILL.LEAF, true, isPlaced],
            [STILL.CHUN, this.step === "toppings" || this.hasChun, this.hasChun],
            [STILL.SUPARI, this.step === "toppings" || this.hasSupari, this.hasSupari],
            [STILL.PAAN_FOLDED, this.step === "fold" || isFolded, isFolded],
        ];
        items.forEach(([name, isOpen, isDone], i) => {
            const img = this.stills[name], y = L.Y0 + i * L.GAP;
            const w = img.width * L.SCALE, h = img.height * L.SCALE;
            ctx.save();
            ctx.globalAlpha = isDone ? C.DONE : isOpen ? 1 : C.DIM;
            ctx.drawImage(img, L.X - w / 2, y - h / 2, w, h);
            ctx.restore();
            if (!isDone) return;
            // a brush tick over the picture
            ctx.save();
            ctx.globalCompositeOperation = "multiply";
            ctx.strokeStyle = inkRGBA(C.TICK_INK);
            ctx.lineWidth = C.TICK_W;
            ctx.lineCap = "round";
            ctx.beginPath();
            ctx.moveTo(L.X - 26, y);
            ctx.lineTo(L.X - 6, y + 22);
            ctx.lineTo(L.X + 34, y - 26);
            ctx.stroke();
            ctx.restore();
        });
    }

    // the leaf, its toppings, the fold, then the folded paan on its way to Dadi
    private drawLeaf(ctx: CanvasRenderingContext2D, t: number): void {
        const u = (t - this.stepAt) / (this.step === "folding" ? CONFIG.FOLD : CONFIG.GIVE);
        if (this.step === "give" || this.step === "done") {
            // once done, it stays in her hand
            const k = this.step === "done" ? 1 : smooth(Math.min(1, u));
            this.drawPiece(ctx, STILL.PAAN_FOLDED, lerp(PAAN.PLATE[0], PAAN.HAND[0], k), lerp(PAAN.PLATE[1], PAAN.HAND[1], k));
            return;
        }
        const fold = this.step === "folding" ? smooth(Math.min(1, u)) : 0;
        ctx.save();
        ctx.globalAlpha = 1 - fold;
        ctx.translate(this.leaf.x, this.leaf.y);
        ctx.scale(1 - 0.6 * fold, 1);              // the leaf closes from the sides
        this.drawPiece(ctx, STILL.LEAF, 0, 0);
        if (this.hasChun) this.drawPiece(ctx, STILL.CHUN_DAB, ...CONFIG.TOPPING_AT.CHUN);
        if (this.hasSupari) this.drawPiece(ctx, STILL.SUPARI_BITS, ...CONFIG.TOPPING_AT.SUPARI);
        ctx.restore();
        if (fold === 0) return;
        ctx.globalAlpha = fold;
        this.drawPiece(ctx, STILL.PAAN_FOLDED, this.leaf.x, this.leaf.y);
        ctx.globalAlpha = 1;
    }

    private drawPiece(ctx: CanvasRenderingContext2D, name: string, x: number, y: number): void {
        const img = this.stills[name];
        ctx.drawImage(img, x - img.width / 2, y - img.height / 2);
    }

    private pieceUnder(x: number, y: number): Draggable | null {
        for (const p of [this.chun, this.supari, this.leaf]) {
            if (p.isActive && !p.returning && Math.hypot(x - p.x, y - p.y) <= p.radius) return p;
        }
        return null;
    }

    // let go of a piece: it lands where it belongs, or floats back home
    private drop(p: Draggable): void {
        const t = this.game.loop.t, pointer = this.game.pointer;
        this.dragging = null;
        if (p === this.leaf && Math.hypot(p.x - PAAN.PLATE[0], p.y - PAAN.PLATE[1]) <= PAAN.PLATE_RADIUS) {
            p.home = PAAN.PLATE;          // it floats onto the middle of the plate and stays
            p.isActive = false;
            this.game.sound.play("sfx_paan_place");
            this.setStep("listen");
        }
        const isOnLeaf = this.step === "toppings" && pointer.isNear(this.leaf.x, this.leaf.y, PAAN.LEAF_RADIUS);
        if (p !== this.leaf && isOnLeaf) {
            if (p === this.chun) this.hasChun = true;
            if (p === this.supari) this.hasSupari = true;
            p.isActive = false;
            this.game.sound.play("sfx_paan_place");
            if (this.hasChun && this.hasSupari) this.setStep("fold");
        }
        p.returning = { from: [p.x, p.y], start: t };
    }

    private setStep(step: Step): void {
        this.step = step;
        this.stepAt = this.game.loop.t;
    }
}

function piece(name: string, home: Point, isActive: boolean): Draggable {
    return { name, home, x: home[0], y: home[1], radius: PAAN.PICK_RADIUS, isActive, returning: null };
}

// a piece that was let go glides back to its home (smoothly, never a jump)
function floatHome(p: Draggable, t: number): void {
    if (!p.returning) return;
    const u = smooth(Math.min(1, (t - p.returning.start) / CONFIG.RETURN));
    p.x = lerp(p.returning.from[0], p.home[0], u);
    p.y = lerp(p.returning.from[1], p.home[1], u);
    if (u >= 1) p.returning = null;
}
