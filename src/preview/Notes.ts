// The notes side of the frame review page: box an area of a frame, write what
// is wrong, save it (with a picture of the frame) through the dev server's
// /__notes route. The agent reads render/notes/<scene>.json and the pictures,
// fixes the code, and marks each note fixed with a short reply.
import { STAGE } from "../shared/depth";
import BoxTool, { boxStyle } from "./BoxTool";
import type { ReviewNote } from "../types";

const CONFIG = {
    BOX_WIDTH: 6,           // outline drawn on the saved picture, stage px
    SAVED_MS: 1500,         // "note saved" shows this long, then "ready"
};

// the spot the page is showing, and how to jump to another one
export interface Viewer {
    scene(): string
    clip(): string
    frame(): number
    jump(clip: string, frame: number): void
}

function byId<T extends HTMLElement>(id: string): T {
    // safe: preview.html has every id this page asks for
    return document.getElementById(id) as T;
}

export default class Notes {
    private notes: ReviewNote[] = [];
    private readonly form = byId<HTMLFormElement>("form");
    private readonly text = byId<HTMLTextAreaElement>("text");
    private readonly marks = byId<HTMLDivElement>("marks");
    private readonly list = byId<HTMLOListElement>("list");
    private readonly empty = byId<HTMLParagraphElement>("empty");
    private readonly status = byId<HTMLSpanElement>("status");
    private readonly tool: BoxTool;

    constructor(private readonly viewer: Viewer) {
        // the first box of a note opens the form; the box can still be moved while typing
        this.tool = new BoxTool(byId("stage"), byId("box"), () => {
            this.form.hidden = false;
            this.text.focus();
        });
        this.form.addEventListener("submit", (e) => {
            e.preventDefault();
            this.save();
        });
        byId("cancel").addEventListener("click", () => this.cancel());
    }

    get isWriting(): boolean {
        return !this.form.hidden;
    }

    setStatus(state: "painting" | "ready" | "saving" | "saved" | "error"): void {
        this.status.dataset.state = state;
    }

    async load(scene: string): Promise<void> {
        const res = await fetch(`/__notes?scene=${scene}`);
        this.notes = res.ok ? await res.json() : [];
        this.cancel();
        this.showList();
    }

    cancel(): void {
        this.tool.clear();
        this.form.hidden = true;
        this.text.value = "";
    }

    // the boxes of notes on the frame being shown
    showMarks(): void {
        this.marks.replaceChildren();
        for (const note of this.notes) {
            if (note.clip !== this.viewer.clip() || note.frame !== this.viewer.frame()) continue;
            const mark = document.createElement("div");
            mark.className = note.isFixed ? "mark is-fixed" : "mark";
            Object.assign(mark.style, boxStyle(note.box));
            this.marks.append(mark);
        }
    }

    private async save(): Promise<void> {
        const text = this.text.value.trim();
        const box = this.tool.box;
        if (!box || !text) return;

        // the id is also the picture's file name: clip-frame-time, plain characters only
        const clip = this.viewer.clip();
        const frame = this.viewer.frame();
        const id = `${clip}-f${frame}-${Date.now()}`.toLowerCase().replace(/[^a-z0-9-]/g, "-");
        const round = Math.round;
        const note: ReviewNote = { id, clip, frame, box: { x: round(box.x), y: round(box.y), w: round(box.w), h: round(box.h) }, text, isFixed: false };

        this.notes.push(note);
        const isSaved = await this.send({ picture: { id, png: this.picture(note) } });
        if (!isSaved) {
            this.notes.pop();
            return;
        }
        this.cancel();
        this.showList();
    }

    private async remove(note: ReviewNote): Promise<void> {
        this.notes = this.notes.filter((n) => n !== note);
        await this.send({ removed: note.id });
        this.showList();
    }

    // the frame as it is on screen, with the box drawn on it
    private picture(note: ReviewNote): string {
        const copy = document.createElement("canvas");
        copy.width = STAGE.W;
        copy.height = STAGE.H;
        const ctx = copy.getContext("2d");
        if (!ctx) return "";
        ctx.drawImage(byId<HTMLCanvasElement>("view"), 0, 0);
        ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue("--pin");
        ctx.lineWidth = CONFIG.BOX_WIDTH;
        ctx.strokeRect(note.box.x, note.box.y, note.box.w, note.box.h);
        return copy.toDataURL("image/png");
    }

    // the whole list goes every time; the file is small and stays simple
    private async send(extra: { picture?: { id: string, png: string }, removed?: string }): Promise<boolean> {
        this.setStatus("saving");
        try {
            const res = await fetch("/__notes", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ scene: this.viewer.scene(), notes: this.notes, ...extra }),
            });
            if (!res.ok) throw new Error(await res.text());
            this.setStatus("saved");
            setTimeout(() => this.setStatus("ready"), CONFIG.SAVED_MS);
            return true;
        }
        catch (err) {
            console.error(err);
            this.setStatus("error");
            return false;
        }
    }

    // newest first; open notes before fixed ones
    private showList(): void {
        const sorted = [...this.notes].sort((a, b) => Number(a.isFixed) - Number(b.isFixed) || b.id.localeCompare(a.id));
        this.list.replaceChildren(...sorted.map((note) => this.item(note)));
        this.empty.hidden = this.notes.length > 0;
        this.showMarks();
    }

    private item(note: ReviewNote): HTMLLIElement {
        const li = document.createElement("li");
        if (note.isFixed) li.className = "is-fixed";

        // clip · frame: click to go there
        const where = document.createElement("button");
        where.className = "where";
        where.textContent = `${note.clip} · ${note.frame}`;
        where.addEventListener("click", () => this.viewer.jump(note.clip, note.frame));

        const text = document.createElement("p");
        text.textContent = note.text;
        li.append(where, text);

        if (note.reply) {
            const reply = document.createElement("p");
            reply.className = "reply";
            reply.textContent = note.reply;
            li.append(reply);
        }

        const del = document.createElement("button");
        del.className = "delete";
        del.addEventListener("click", () => this.remove(note));
        li.append(del);
        return li;
    }
}
