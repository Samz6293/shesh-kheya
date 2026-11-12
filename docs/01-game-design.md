# 01 — Game Design: শেষ খেয়া (The Last Ferry)

Source of truth for story and dialogue: `docs/source/chapter-1-script.pdf` (by @Scadding, Oct 20 2026).
If this file and the script disagree, the script wins. Dialogue text lives only in `src/content/ch1/dialogue.json`.

## The game in one paragraph

A short narrative game set on a haor in Sylhet during the monsoon. You play Mitu, a girl whose father (Abba) has not come home. Chapter 1 builds the bond between the player and Amma (pregnant), Dadi, Rahim Chacha and the absent father, so that the decision in Chapter 3 truly hurts. Everything is painted in ink wash on warm paper, as silhouettes under a sky that darkens from dusk to storm. The player watches most of it as cutscenes and takes over whenever Mitu acts; the joins are invisible. Nothing cuts suddenly; every scene fades. Dialogue is in Sylheti with English subtitles in italics.

## Pillars

1. **Bond before loss.** Every activity is small, warm and impossible to fail. Its job is to make the player care.
2. **Echoes.** Every activity comes back once in Chapter 2, 3 or 4, changed by what happened. The player should recognise the motion.
3. **Quiet beauty.** Ink on paper, one evening that keeps darkening, soft sound. No hard cuts, no flashing UI.
4. **Short and kind.** Chapter 1 lasts 5–7 minutes. Each activity ends within 30 seconds. Nothing is hard.

## Characters

| id | Name | Role in Chapter 1 | Visual note |
|---|---|---|---|
| `mitu` | মিতু | Player. Narrates the opening as her grown-up self. | Small girl silhouette, rows the boat. |
| `ma` | মা (Amma) | Pregnant, waiting on the veranda. | Seated, visible belly. |
| `dadi` | দাদি | Grandmother. Wears a gold bangle she plans to give Mitu. | Bent, the bangle is the only gold glint in the house scene. |
| `rahim` | রহিম চাচা | Fisherman. The **only** person who knows which way Abba went. | Standing in his own boat, hauling a net. |
| `kalam` | কালাম মাঝি | Old boatman stuck in water hyacinth. Optional kindness. | Old man pushing with a pole. |
| Abba | আব্বা | Absent. Present only through objects: gamchha, flute, tiffin box, his favourite fish. | Never shown. |

## Chapter 1 flow (সন্ধ্যা — Dusk)

Time budget is a target for playtesting, not a rule.

| # | Scene | What happens | Player does | Target time |
|---|---|---|---|---|
| S1 | শুরু (Opening) | Black screen, water lapping 3–4 s. Narration fades in, fades out. Game title fades in, then chapter card. | Nothing (click to start happens before this, see Start screen). | 0:25 |
| S2 | ঘর (Home) | Orange sky, small tin house on the water. Amma on the veranda, Dadi beside her. Crickets, distant cow, light wind. | Activities 1, 2, 3. | 1:30 |
| S3 | বৈঠা ও স্মৃতি (Rowing and memories) | Mitu gets in the boat. Sky moves orange → purple. Sky reflects in water. Oar sounds, crickets, faint azan. | Learn rowing (Activity 4). Optionally pick up 3 floating memories. | 1:30 |
| S4 | রহিম চাচা | Rahim Chacha struggling with a net near the ghat. | Activity 5 (net), then lift the fish into the boat. | 1:15 |
| S5 | কালাম মাঝি | On the way back an old boat is stuck in hyacinth. Deep purple sky, first distant thunder. | First choice: Help or Go home. | 0:45 |
| S6 | বাড়ি ফেরা (Return) | Almost dark. Only the lantern and the kupi light. Mitu gives Amma the fish; the pot holds it. Lightning, music stops, rain begins, fade to black, card "অধ্যায় ২ — ঝড়". | Watch. | 0:45 |

### Start screen (not in the script, needed by the browser)
Browsers block sound until the player clicks. The opening depends on sound, so the game starts on a quiet screen with the title and one button: **শুরু করো / Begin** (plus **চালিয়ে যাও / Continue** if a save exists). That click unlocks audio and goes fullscreen-friendly. See `07-decisions.md` D6.

## How it is presented
Cutscenes (pre-rendered video) for everything the player watches; live play for every activity and choice. Which parts of each scene are video and which are live: `02-architecture.md`, "What is video and what is live". Dialogue and choices appear in the empty sky at the top; key hints at the bottom.

## Activities (Chapter 1)

Each activity is its own file in `src/activities/`. None can be failed. Numbers below are starting values; all tuning lives in `src/config.ts`.

### A1 — ভাইয়ের নড়াচড়া (Baby kick)
- **Lead-in:** a first soft kick (thud, a small ripple of light on the belly); Amma gasps, smiles and lays her hand there; then `a1.babyKick.prompt`.
- **Control:** an ink hand pulses over Amma's belly; **click it once** (D20; was a 2–3 s hold).
- **Then (clip):** Mitu steps over, kneels and puts her hand on the belly; a beat; the kick: soft thud, a ring of light spreading from the belly, Mitu startles.
- **Then:** `a1.babyKick.after`.
- **Echo:** Chapter 3, same action, the movement is weaker.

### A2 — পান বানানো (Making paan for Dadi)
- **Lead-in (clip):** Dadi chuckles, pulls her paan box round and pats it; Mitu sits by her. Then `a2.paan.prompt` and the close-up: Dadi across the plate, the box open in front.
- **Control:** drag the betel leaf onto the plate first, then chun (lime) and supari onto the leaf in any order, then click the leaf to fold it. A picture checklist down the right shows what is done and what is next.
- **Rule:** 15–20 s, no wrong moves. A piece dropped in the wrong place floats back to its spot.
- **During:** once the leaf is on the plate the pieces pause; Dadi turns her bangle (its glint goes round) and says both `a2.paan.during` lines (D20).
- **Echo:** Chapter 3, Mitu's paan in Dadi's hand. Ending 2, the floating bangle and paan box.

### A3 — হারিকেনে তেল ভরা (Filling the lantern)
- **Lead-in (clips):** after `a3.lantern.prompt[0]` Dadi reaches behind her for the lantern and holds it out; `[1]` while she holds it; Mitu takes it and sets it down by the bottle; the close-up.
- **Control:** hold the mouse on the kerosene bottle to pour.
- **Rule:** oil pours while held and the meter rises. The bottle holds a limited amount, so the meter can never reach 100. Releasing stops pouring. When the bottle is empty, it stops by itself.
- **Saves:** `lampOil` (0–100) = meter value when the activity ends.
- **After:** the oil meter stays in a screen corner for the rest of the game.
- **Echo:** Chapter 2, lamp light radius; decision about giving oil to Kalam Majhi.

### A4 — নাও চালানো (Steering the boat) — the core mechanic
- **Hint:** `steerHint` appears small on screen, then fades.
- **Control:** D = right, A = left, W = away from the camera, S = toward it. Keys can be held and combined.
- **Rules:**
  - The boat faces the direction of the journey (D18): left to right when leaving home (S3, S4), right to left when going back (S5, S6). The player only steers.
  - Each oar stroke pushes the boat forward, so it surges and eases instead of gliding; the bow lifts slightly on each pull and a small wake trails behind. Mitu's oar strokes, the water rings and the oar sound play by themselves while the boat moves.
  - Releasing the keys lets the boat glide to a stop.
  - Nothing can go wrong: the boat **never** sinks or gets stuck, and stops softly at the edge of the water.
- **Used:** for the whole game.
- **Space:** side view with depth (D2): the boat moves along the water and toward/away from the camera.
- **Changed after the M1 play-test (D17):** the script's rhythm rowing (alternate A/D in time, repeat one side to turn) felt too strange to control. The script's Sylheti name for this activity is "ছন্দে বৈঠা মারা".

### Memories — বাবার ৩টা স্মৃতি (optional)
- Three objects float in the water during S3, each marked by a faint light: গামছা, বাঁশি, টিফিন বাটি.
- **Control:** row close, `pickupHint` appears, press E.
- **Then:** the matching beat (`mem.gamchha`, `mem.flute`, `mem.tiffin`). The flute plays a short tune (4–5 s) before its line.
- **Saves:** `foundGamchha`, `foundFlute`, `foundTiffin`.
- **Intent:** finding all three makes the player ask "why are Abba's things in the water?" No line says it.
- **Echo:** Ending 1, the flute in the empty boat. Hidden ending, Abba plays the flute.

### A5 — জাল টানা (Pulling the net)
- **Trigger:** after `s4.intro`.
- **Control:** a rhythm mark moves across a bar; press Space when it is inside the target zone.
- **Rule:** each hit lifts the net a little. A miss lets it slip back a little; it never fails. 5 hits complete it (tuning: 5–6).
- **During:** after a hit, Rahim says the next line of `a5.net.pull1..3` as an ambient line. Spread the 3 lines across the hits (default: hits 1, 3, 5).
- **Story weight:** from here the player knows only Rahim Chacha knows where Abba went. This sets up Chapter 3.
- **Echo:** Chapter 3, Rahim Chacha caught in the same net.

### Big fish — বড় মাছ
- Net comes up with a large আইড় (aair) fish jumping. `s4.fish` plays.
- **Control:** drag the fish into Mitu's boat.
- The fish stays visible in the boat for the rest of the trip and jumps now and then.
- Then `s4.leave`.
- **Echo:** Chapter 4, the fish in the pot in every ending.

### First choice — কালাম মাঝি
- After `s5.intro`, two options: **সাহায্য করো** / **বাড়ি ফিরে যাও**.
- **Help:** row up until Mitu's boat touches Kalam's, then hold Space for 8–10 s. While Space is held, the sky visibly darkens (help has a cost, and you can see it). Releasing pauses progress. When the boat breaks free, `s5.helped`.
- **Go home:** `s5.declined`. The old man says nothing, nods quietly and keeps pushing alone. No punishment, no blame: the player should move on with their own decision, not guilt.
- **Saves:** `helpedKalam1`.
- **Consequence (hidden from player now):** if helped, Kalam returns in Chapter 2; if not, he does not, and the hidden good ending is no longer reachable.

### Return and end
- Mitu docks, gives Amma the fish (`s6.return`). Amma puts it in a water pot; the camera rests on the pot 1–2 s. The pot is now the symbol of waiting for Abba.
- `s6.dadi`.
- Final moment: distant lightning, the whole haor flashes white for an instant, screen shakes lightly, music stops, first drops then rising rain, slow fade to black, rain only, card `nextChapterTitle`.
- **Saves:** `fishGiven = true` (always true; endings need it).

## Save data after Chapter 1

| Flag | Type | Meaning |
|---|---|---|
| `lampOil` | number 0–100 | Oil in the lantern; sets light size in Chapter 2 |
| `foundGamchha` | boolean | Picked up Abba's gamchha |
| `foundFlute` | boolean | Picked up Abba's flute |
| `foundTiffin` | boolean | Picked up Abba's tiffin box |
| `helpedKalam1` | boolean | Helped Kalam Majhi |
| `fishGiven` | boolean | Fish given to Amma (always true) |

## Echo table (what comes back later)

| Activity | Control | Returns in |
|---|---|---|
| Baby kick | Hold mouse | Ch 3: same action, weaker movement |
| Paan | Drag + click | Ch 3: Mitu's paan in Dadi's hand; Ending 2: floating bangle and paan box |
| Lantern oil | Hold mouse | Ch 2: light size; giving oil to Kalam |
| Steering the boat | W A S D | Whole game |
| 3 memories | E | Ending 1: flute in the empty boat; hidden ending: Abba plays the flute |
| Net | Space on time | Ch 3: Rahim caught in the same net |
| Big fish | Drag | Ch 4: fish in the pot in every ending |
| Push Kalam's boat | Hold Space | Ch 2: Kalam returns; hidden ending |

## Out of scope for this build
Chapters 2–4 (not written yet). The architecture must make them easy to add, but nothing from them is built now.
