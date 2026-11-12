// Builds every asset path from a scene id and a name, and loads scene art.
// One helper instead of typing paths at each use: rename a folder here and
// the renderer, the game and the join check all follow.
import type { FrontPiece, Plate, SpriteArt, Track } from "../types";

export function platePath(scene: string): string {
    return `/assets/${scene}/plate.png`;
}

export function backingPath(scene: string): string {
    return `/assets/${scene}/backing.png`;
}

// the foreground atlas and where its pieces go
export function frontPath(scene: string, ext: "png" | "json"): string {
    return `/assets/${scene}/front.${ext}`;
}

export function spritePath(scene: string, name: string): string {
    return `/assets/${scene}/${name}.png`;
}

export function clipPath(scene: string, clip: string): string {
    return `/video/${scene}/${clip}.mp4`;
}

export function trackPath(scene: string, clip: string): string {
    return `/video/${scene}/${clip}.track.json`;
}

export function loadImage(src: string): Promise<HTMLImageElement> {
    // New here: wrapping an event in a Promise. `new Promise` hands us resolve
    // and reject; we call them from the image's load/error events, and then
    // the caller can simply `await loadImage(...)`. Docs: MDN, "Promise() constructor"
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error(`Missing asset: ${src}`));
        img.src = src;
    });
}

// every sprite of a scene with its reflection, by name
export async function loadSprites(scene: string, names: string[]): Promise<Record<string, SpriteArt>> {
    const art: Record<string, SpriteArt> = {};
    await Promise.all(names.map(async (name) => {
        const [img, refl] = await Promise.all([
            loadImage(spritePath(scene, name)),
            loadImage(spritePath(scene, `${name}_refl`)),
        ]);
        art[name] = { img, refl };
    }));
    return art;
}

export async function loadTrack(scene: string, clip: string): Promise<Track> {
    const res = await fetch(trackPath(scene, clip));
    if (!res.ok) throw new Error(`Missing track: ${trackPath(scene, clip)}`);
    return await res.json();
}

// the plate, its backing (paper and sky only) and the foreground, loaded together
export async function loadPlate(scene: string): Promise<Plate> {
    const [img, backing, frontImg, pieces] = await Promise.all([
        loadImage(platePath(scene)),
        loadImage(backingPath(scene)),
        loadImage(frontPath(scene, "png")),
        fetch(frontPath(scene, "json")).then((res) => {
            if (!res.ok) throw new Error(`Missing asset: ${frontPath(scene, "json")}`);
            return res.json() as Promise<FrontPiece[]>;
        }),
    ]);
    return { img, backing, front: { img: frontImg, pieces } };
}
