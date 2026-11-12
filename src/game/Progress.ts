// Where the player is in the chapter and what they did: the checkpoint scene
// and the flags. Scenes change flags only through setFlags(), so every change
// is saved at once, and main.ts calls reach() as each scene starts. Keeping
// it in one object means a scene never has to think about localStorage.
import { SAVE, loadSave, newSave, writeSave } from "./save";
import type { ChapterOneFlags, SaveData } from "../types";

export default class Progress {
    private data: SaveData;

    constructor() {
        // until the player picks Begin or Continue, a blank game with no scene
        this.data = newSave(SAVE.CHAPTER_END, loadSave()?.settings);
    }

    // read-only for scenes: changes go through setFlags()
    get flags(): Readonly<ChapterOneFlags> {
        return this.data.flags;
    }

    get checkpoint(): string {
        return this.data.checkpoint;
    }

    // Begin: a new game from this scene, keeping the player's settings
    startNew(sceneId: string): void {
        this.data = newSave(sceneId, this.data.settings);
        writeSave(this.data);
    }

    // Continue: the stored game, or false if there is nothing to continue
    resume(): boolean {
        const saved = loadSave();
        if (!saved) return false;
        this.data = saved;
        return true;
    }

    // a scene has started: resume from here next time
    reach(sceneId: string): void {
        this.data.checkpoint = sceneId;
        writeSave(this.data);
    }

    // New here: Partial<T>. The same fields as T, all optional, so a scene
    // passes only what changed: setFlags({ helpedKalam1: true }).
    // Docs: TypeScript handbook, "Utility Types"
    setFlags(changes: Partial<ChapterOneFlags>): void {
        Object.assign(this.data.flags, changes);
        writeSave(this.data);
    }

    debugLine(): string {
        return `save      ${this.data.checkpoint}   ${JSON.stringify(this.data.flags)}`;
    }
}
