# Scene status

Where every scene stands. The `start` skill reads this file first and keeps it up to date; nobody else needs to edit it by hand.

**Statuses**
- `not started`
- `in progress`: being built.
- `ready for frame review`: clips built in code, not rendered; waiting for dh1 to check them in `preview.html` and greenlight the render.
- `ready for play-test`: built, rendered, `check-joins` passes; waiting for dh1 to play it.
- `approved`: dh1 played it and confirmed; committed and merged.

A chapter is **done** when every scene in it is `approved`. A chapter only appears here once its script is in `docs/source/` (see `add-chapter`).

## Chapter 1 — সন্ধ্যা (Dusk)

Script: `docs/source/chapter-1-script.pdf` · Design: `docs/01-game-design.md` · Milestones: `docs/06-build-plan.md`

| Scene | Name | Milestone | Status | Notes |
|---|---|---|---|---|
| — | Save, transitions, scene order | M2 | approved | Approved by dh1, 2026-11-12 |
| S1 | শুরু (Opening) | M3 | approved | No video. Approved by dh1, 2026-11-12 |
| S2 | ঘর (Home) | M4 | approved | Approved by dh1, 2026-11-13 |
| S3 | বৈঠা ও স্মৃতি (Rowing and memories) | M5 | ready for play-test | Outward: left to right (D18). Rendered; joins ok |
| S4 | রহিম চাচা | M6 | not started | Outward: left to right (D18) |
| S5 | কালাম মাঝি | M1 | approved | Approved by dh1 and merged to `main`, 2026-11-12 (`e5fc2f0`) |
| — | S5 in the chapter (real flags from S4) | M7 | not started | After S4 |
| S6 | বাড়ি ফেরা (Return) | M8 | not started | Homeward: right to left (D18) |
| — | Polish, deploy | M9, M10 | not started | After S6 |
