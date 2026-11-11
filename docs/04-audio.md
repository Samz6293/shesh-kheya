# 04 — Audio

Sound carries the opening (a black screen with only water) and the ending (rain in the dark). Treat it as half the game.

## The rule: videos are silent

All sound plays from the game (`src/game/Sound.ts`), not from video files. Clips fire sounds through **cues** (`scenes/<scene>/cues.ts`) at a time in the clip:

```ts
export const cues: Record<string, Cue[]> = {
    intro: [
        { t: 0.3, sfx: "oar" },
        { t: 3.75, sfx: "thunder" },
        { t: 5.6, line: ["s5.intro", 0], hold: true },
    ],
};
```

So ambience and music never restart at a join, and changing a sound never needs a re-render.

## Layers

| Layer | Behaviour |
|---|---|
| Ambience | looping layers (water, crickets, wind, rain) with crossfaded volumes: `sound.ambience({ water: 0.6, crickets: 0.4 })` |
| Music | one loop per chapter mood, fades in/out |
| Effects | one-shots from cues and activities |

Three volume settings (music, ambience, effects) in the save.

## Sound list (Chapter 1)

Ids are file names in `public/audio/` (`<id>.ogg` + `<id>.m4a`).

### Ambience loops

| id | Description | Where |
|---|---|---|
| `amb_water` | Gentle lapping | Everywhere; alone in S1 |
| `amb_crickets` | ঝিঁঝিঁ পোকা | S2 on, louder as it darkens |
| `amb_wind` | Evening wind | S2–S4 light, S5–S6 stronger |
| `amb_rain` | Rain, light to heavy | S6 end |

### One-shots

| id | Description | Where |
|---|---|---|
| `sfx_cow` | Distant cow | S2 |
| `sfx_azan_far` | Very faint, distant azan | S3, once |
| `sfx_kick` | Soft, muffled thud | A1 |
| `sfx_ripple` | Soft chime under the light ripple | A1 |
| `sfx_paan_place`, `sfx_paan_fold` | Leaf and pieces | A2 |
| `sfx_pour` | Kerosene pouring (loop while held) | A3 |
| `sfx_oar_good_1..3` | Clean stroke: a short "chuk" of the blade entering, then a soft pull of water | Rowing in rhythm |
| `sfx_oar_bad_1..2` | Splashy, uneven slap | Rowing off rhythm |
| `sfx_pickup` | Lifting a wet object | Memories |
| `sfx_flute_memory` | Short flute phrase, 4–5 s | `mem.flute` |
| `sfx_net_pull`, `sfx_net_slip` | Rope and water / small slip | A5 |
| `sfx_fish_jump` | Flapping, splash | Fish |
| `sfx_boat_bump` | Two wooden boats touching | S5 |
| `sfx_push_strain` | Pole creak (loop while held) | S5 push |
| `sfx_boat_free` | Hull sliding free of hyacinth | S5 helped |
| `sfx_thunder_far`, `sfx_thunder_near` | Rumble / crack | S5, S6 |

### Music

| id | Description | Where |
|---|---|---|
| `mus_dusk` | Sparse, warm, slow (flute, dotara or soft strings), loops | S2–S6, stops at the lightning |

The flute memory phrase and the music should feel related: it is Abba's tune, and it comes back in the endings.

## Rowing sound

It is the sound players hear most. Random oar sounds get tiring fast:
- 3 variations for good strokes, 2 for bad, chosen without repeating the last one.
- Slight random pitch (±4%) and volume (±10%).
- Good strokes in a steady rhythm should feel musical; the gap between strokes is the beat.

## Placeholders

The prototype makes placeholder sounds with Web Audio (filtered noise). They run every code path, but the oar placeholder sounds wrong; replace it first. Code calls sounds only by id, so real files drop in without code changes.

## Sources and licences

- **Record your own** where you can: a real boat on a haor in Sylhet will sound better than any library. A phone is fine; record a few minutes of each thing.
- Otherwise **CC0** (freesound.org with the CC0 filter, Sonniss GDC bundles, Kenney).
- Every file goes in `public/audio/CREDITS.md` when it is added: id, source, author, licence.
- The azan should be short, quiet and respectful, from a source that allows reuse.

## Technical

- `.ogg` + `.m4a` for every sound; the browser picks the one it supports. Loops trimmed to exact loop points.
- Mono one-shots, 96–128 kbps. Normalise loudness before import; balance in code.
- Audio starts on the Begin click (browsers block it before a click).
