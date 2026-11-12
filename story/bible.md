# Story bible

Everything the chapters share, kept up to date by Claude (`add-chapter` skill) each time a chapter script is added. The script PDFs in `docs/source/` are the source; this file is the summary that keeps code and chapters consistent. Reference only: nobody is asked to write to it.

## The game
A short narrative game set on a haor in Sylhet during the monsoon. Mitu's father (Abba) has not come home. Four chapters. Ink-wash art, Sylheti dialogue with English subtitles, mostly cutscenes with live play whenever Mitu acts.

## Rules every chapter follows
- Nothing can be failed. Wrong input only slows things down.
- No hard cuts; every scene fades.
- Colour comes only from light (lantern, kupi, bangle, lightning). Everything else is ink on paper.
- Each activity is short (under 30 s) and comes back once later as an echo.
- Dialogue: Sylheti line + English subtitle. Stage directions are for animation and never shown.

## Characters

| id | Name | Who | First appears |
|---|---|---|---|
| `mitu` | মিতু | The player. A girl. Narrates the opening as her grown-up self. | Ch 1 |
| `ma` | মা (Amma) | Mitu's mother, pregnant with a boy. | Ch 1 |
| `dadi` | দাদি | Grandmother. Keeps a gold bangle for Mitu. | Ch 1 |
| `rahim` | রহিম চাচা | Fisherman. The only one who knows Abba went to the far side of the haor, toward the hijol forest. | Ch 1 |
| `kalam` | কালাম মাঝি | Old boatman. Mitu may help him in Ch 1. | Ch 1 |
| Abba | আব্বা | Mitu's father. Never shown in Ch 1; present through his gamchha, flute, tiffin box and his favourite fish. | (absent) |

## Flags (what the player did)

| Flag | Type | Set in | Meaning | Used in |
|---|---|---|---|---|
| `lampOil` | 0–100 | Ch 1, A3 | Oil in the hurricane lantern | Ch 2: light radius; giving oil to Kalam |
| `foundGamchha` | bool | Ch 1, S3 | Picked up Abba's gamchha | — |
| `foundFlute` | bool | Ch 1, S3 | Picked up Abba's flute | Ending 1, hidden ending |
| `foundTiffin` | bool | Ch 1, S3 | Picked up Abba's tiffin box | — |
| `helpedKalam1` | bool | Ch 1, S5 | Helped Kalam Majhi free his boat | Ch 2: Kalam returns; hidden ending needs it |
| `fishGiven` | bool | Ch 1, S6 | Gave the fish to Amma (always true) | Ch 4: the fish in the pot in every ending |

## Echoes owed (set up in Chapter 1, still to be written)

| From Ch 1 | Comes back as | Chapter |
|---|---|---|
| Baby kick (hold mouse) | Same action, the movement is weaker | Ch 3 |
| Paan for Dadi (drag + click) | Mitu's paan in Dadi's hand; floating bangle and paan box | Ch 3, Ending 2 |
| Lantern oil (hold mouse) | Light size; giving oil to Kalam | Ch 2 |
| Rowing (A/D) | Used in every chapter | all |
| Three memories (E) | The flute in the empty boat; Abba plays the flute | Ending 1, hidden ending |
| Net pull (Space on time) | Rahim Chacha caught in the same net | Ch 3 |
| Big fish (drag) | The fish in the pot | Ch 4, every ending |
| Pushing Kalam's boat (hold Space) | Kalam returns if helped | Ch 2, hidden ending |

## Known structure

| Chapter | Name | Status |
|---|---|---|
| 1 | সন্ধ্যা — Dusk | Written (`docs/source/chapter-1-script.pdf`) |
| 2 | ঝড় — Storm | To write |
| 3 | (the decision) | To write |
| 4 | (endings: 1, 2, hidden) | To write |

## Controls the game already has
Hold mouse · drag · click · A/D rowing · Space on time · hold Space · E to pick up. Anything else a new chapter needs is listed in that chapter's pull request for dh1.
