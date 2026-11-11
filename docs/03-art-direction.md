# 03 — Art Direction: ink wash

Reference images: `docs/art-tests/ink-wash-test-01.png` (S3 at dusk) and the frames of `prototypes/s5-cutscene-test/` (S5, storm coming).

## The rule

**Ink on warm paper.** Everything is painted in ink of different strengths; most of the picture (60–80%) is untouched paper. Shapes are silhouettes made of brush strokes, never outlines. **Colour comes only from light**: the sky's last warm wash, the lantern, the kupi lamp, the glint of Dadi's bangle, lightning. Nothing changes suddenly; every scene fades.

## Roots: Bengali, not Chinese

We use the **technique** of ink wash, not its imagery. No mountains, pines, red seals or vertical calligraphy.

Look at:
- **Bengal School wash technique** (Abanindranath Tagore and his students): soft colour washes over ink.
- **Zainul Abedin's** black-ink brush drawings of rivers, boats and people.
- The haor itself: flat water to the horizon, a thin tree line, hijol trees standing in water, tin-roofed houses on stilts, boats, reeds, kochuripana.

Technical reference (how the strokes are made): `lemomo-ai/lemo-opuscar`, style `ink-wash` (MIT).

## Paper

- Warm base `#F2ECDE`, soft cloud-like mottling, fine fibres in three directions, a few dark flecks.
- Grain and vignette are baked into each scene's plate. Ink drawn on top is composited with **multiply**, so it picks up the grain automatically.

## Ink

- One colour ramp (`src/shared/ink.ts`): cool grey when thin, warm near-black when dense.
- Strength by distance: far tree line 0.15–0.25, mid objects 0.3–0.5, boats and figures 0.7–1.0.
- **Strokes** have bristles that break up when dry ("flying white") and a soft wet body. A "loaded" stroke is darker on one side, which gives shape without an outline.
- **Masses** (roofs, hulls, tree crowns, clouds) are jittered shapes with a gradient, then bled (wet layer blur + darker pigment at the edges).
- **Water is blank paper** with a few dry horizontal streaks. Reflections are broken, faint and wobbly.
- Things fade into **mist** with horizontal masks, never a sloped edge.

## Light and time of day

Chapter 1 moves from dusk to night. In ink, that means:

| Moment | Paper wash | Sky | Light |
|---|---|---|---|
| S2 Home | none, pale saffron near horizon | open, pale sun disk | kupi in window, bangle glint |
| S3 Rowing | warm wash fading to rose | a few clouds | lantern |
| S4 Rahim | grey-violet wash begins | clouds building | lantern stronger |
| S5 Kalam | grey-violet wash, dull rose band at horizon | heavy bled clouds | lantern, far kupi at home |
| S6 Return | dark wash; the darkness overlay near 1 | storm | lantern and kupi only, lightning as bare white paper |

- The **darkness overlay** (`composeFrame`, value 0–1) is drawn on top of plate and sprites, so one plate can serve a whole scene while the night deepens. Helping Kalam drives it in S5.
- Lights are drawn after the darkness: a warm multiply wash plus a soft screen glow, stronger the darker it is. Lantern size follows `lampOil`.

| Light | Colour |
|---|---|
| Lantern | `#F0963C` wash, `#FFBE6E` glow |
| Kupi | `#FF9D4D` |
| Bangle glint | `#FFD36E` |
| Last sun | `#D6683E` at low opacity |
| Lightning | screen white `#F4F2FF` |

## Composition

- Wide, still camera; the scene is a painting the characters move across. No camera movement in live parts; slow pans allowed in clips.
- Keep the sky empty enough for text: **dialogue and choices sit in the sky** at the top; key hints sit at the bottom.
- Figures are small (100–130 px tall near the camera). Faces are never shown in detail.
- Foreground reeds or hyacinth in a corner frame the shot.

## Motion

- Live sprites have a small set of poses (Mitu rowing: rest + 4 frames per side). Clips may move smoothly. Live motion that must match a clip uses the same poses at the join.
- Everything idle breathes: boats bob (4 s), water rings spread (`r ∝ age^0.6`, fade over 2.4 s), flames flicker.
- Screen shake is rare and small (baby kick, lightning), under 4 px.
- Lightning: two quick white pulses, then a slow fade.

## Assets per scene

| Asset | What | Made by |
|---|---|---|
| Plate | everything that never moves, with paper, grain and vignette | `paint.ts` → `plate.png` |
| Close-up plates | for paan, lantern, net activities | `paint.ts` |
| Sprites | each character/boat per pose, plus its reflection | `paint.ts` → PNGs |
| Clips | cutscenes | `clips.ts` → MP4 |

Hand-painted art can replace any of these files later, as long as the size, anchor point and pose names stay the same (see D3).

## Typography (overlay)

| Role | Font | Size at 1080p |
|---|---|---|
| Sylheti line | Tiro Bangla | 40 px |
| English subtitle | serif italic | 25 px |
| Speaker name | Tiro Bangla, lamp colour | 22 px |
| Title "শেষ খেয়া" | Tiro Bangla | 125 px |
| Hints, menus | Tiro Bangla | 27 px |

Text sits on a soft dark panel at about 50% opacity. Fonts load before the first line is shown.
