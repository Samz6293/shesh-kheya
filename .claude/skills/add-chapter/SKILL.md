---
name: add-chapter
description: Add a new or revised chapter script (PDF) to the game. Use when someone shares or uploads a chapter PDF, says "add chapter N", or asks to update dialogue from a script.
---

# Add a chapter script

Chapter scripts arrive as PDFs, written in the writer's own format (like `docs/source/chapter-1-script.pdf`). The story is his: don't critique it, rewrite it, ask him to change his format, or tell him about the game's design rules. Your job is to bring the script into the repo and turn it into what the game reads.

## 1. Put the PDF in place
Save it as `docs/source/chapter-N-script.pdf` (replace the old file if it's a revision).

## 2. Read it properly
Bengali text extracted from a PDF is often broken (conjuncts and vowel signs come out wrong). **Render each page as an image and read the images**; use extracted text only to help. Read every page.

## 3. Write the dialogue file
Create or update `src/content/chN/dialogue.json` in exactly the shape of `src/content/ch1/dialogue.json`:

```json
{
    "_readme": "…",
    "speakers": { "mitu": { "bn": "মিতু", "en": "Mitu" } },
    "screens": { "chapterTitle": { "sy": "অধ্যায় ২ — ঝড়", "en": "Chapter 2 — Storm" } },
    "beats": {
        "s1.intro": [
            { "speaker": "dadi", "direction": "হেসে", "sy": "…", "en": "…" }
        ]
    }
}
```

- Copy the Sylheti exactly as written. If the script gives an English line, use it; if not, translate faithfully and keep the tone.
- Beat ids: `s<scene>.<moment>` for story lines, `a<n>.<activity>.<moment>` for lines around activities. Lowercase, dots. Reuse speaker ids from earlier chapters.
- `direction` holds stage directions (never shown on screen).
- Choice labels, hints and title cards go in `screens`.
- For a revision: keep existing beat ids where the moment is the same, so the code and cutscene timing still match. List every id you added, removed or renamed.
- Check it parses (`node -e "JSON.parse(require('fs').readFileSync('src/content/chN/dialogue.json','utf8'))"` or Python `json.load`).

## 4. Update `story/bible.md`
New characters, new flags (name, type, meaning, where set), echoes used and created, chapter status. Only facts from the script.

## 5. Note what dh1 needs to know
In the pull request description (not in the script, not to the writer), list:
- each scene: what's watched (cutscene) and what's played (activity, control)
- new flags and where earlier flags are used
- anything the game can't do yet (a new control, a new effect, a new location)
- anything unclear in the script, as questions for dh1 to ask

## 6. Save
Use the `save-work` skill. Branch name: `story/chapter-N` (or `story/chapter-N-revision`).
