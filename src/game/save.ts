// Reading and writing the save in localStorage. One versioned JSON object
// under one key. Anything wrong with what is stored (missing, not JSON, wrong
// shape, from a newer game) gives null, and the game simply starts fresh.
// The alternative, trusting the stored JSON, would crash on the first bad field.
import { defaultFlags } from "../shared/flags";
import type { ChapterOneFlags, SaveData, Settings } from "../types";

export const SAVE = {
    KEY: "shesh-kheya-save",
    VERSION: 1,                   // raise this when SaveData changes, and add a step to MIGRATIONS
    CHAPTER_END: "end",           // checkpoint after the last scene: nothing left to continue
    OIL_MAX: 100,
};

// New here: versioned saves. MIGRATIONS[n] turns a version n save into
// version n + 1, so a player's old save is upgraded one step at a time
// instead of being thrown away. Empty until the shape first changes.
const MIGRATIONS: Record<number, (old: Record<string, unknown>) => Record<string, unknown>> = {};

export function defaultSettings(): Settings {
    return { volume: 1, textSpeed: 1 };
}

// a fresh save at the first scene; settings carry over from the old one
export function newSave(checkpoint: string, settings = defaultSettings()): SaveData {
    return { version: SAVE.VERSION, chapter: 1, checkpoint, flags: defaultFlags(), settings };
}

export function loadSave(): SaveData | null {
    // New here: localStorage keeps strings in the browser between visits.
    // It can throw (private windows, storage turned off), so every call is wrapped.
    // Docs: MDN, Window.localStorage
    try {
        const text = localStorage.getItem(SAVE.KEY);
        if (text === null) return null;
        return migrate(JSON.parse(text));
    }
    catch {
        return null;
    }
}

export function writeSave(data: SaveData): void {
    try {
        localStorage.setItem(SAVE.KEY, JSON.stringify(data));
    }
    catch {
        // storage full or blocked: the game goes on, it just won't resume later
    }
}

// raw JSON -> a SaveData we can trust, or null
function migrate(raw: unknown): SaveData | null {
    if (!isObject(raw)) return null;
    let data = raw;
    let version = data.version;
    if (typeof version !== "number" || version > SAVE.VERSION) return null;

    while (version < SAVE.VERSION) {
        const step = MIGRATIONS[version];
        if (!step) return null;
        data = step(data);
        version++;
    }

    if (typeof data.checkpoint !== "string") return null;
    if (typeof data.chapter !== "number") return null;
    return {
        version: SAVE.VERSION,
        chapter: data.chapter,
        checkpoint: data.checkpoint,
        flags: readFlags(data.flags),
        settings: readSettings(data.settings),
    };
}

// each flag is kept only if it has the right type; anything else gets its default
function readFlags(raw: unknown): ChapterOneFlags {
    const flags = defaultFlags();
    if (!isObject(raw)) return flags;
    if (typeof raw.lampOil === "number") flags.lampOil = Math.min(SAVE.OIL_MAX, Math.max(0, raw.lampOil));
    if (typeof raw.foundGamchha === "boolean") flags.foundGamchha = raw.foundGamchha;
    if (typeof raw.foundFlute === "boolean") flags.foundFlute = raw.foundFlute;
    if (typeof raw.foundTiffin === "boolean") flags.foundTiffin = raw.foundTiffin;
    if (typeof raw.helpedKalam1 === "boolean") flags.helpedKalam1 = raw.helpedKalam1;
    if (typeof raw.fishGiven === "boolean") flags.fishGiven = raw.fishGiven;
    return flags;
}

function readSettings(raw: unknown): Settings {
    const settings = defaultSettings();
    if (!isObject(raw)) return settings;
    if (typeof raw.volume === "number") settings.volume = Math.min(1, Math.max(0, raw.volume));
    if (typeof raw.textSpeed === "number" && raw.textSpeed > 0) settings.textSpeed = raw.textSpeed;
    return settings;
}

// New here: a type guard. Returning `value is X` tells TypeScript that after
// `if (isObject(v))`, v can be read as an object. Docs: TypeScript handbook, "Narrowing"
function isObject(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}
