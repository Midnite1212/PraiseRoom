---
target: songs mock
total_score: 24
max_score: 40
na_heuristics:
p0_count: 0
p1_count: 4
target_identity: 'file:/Users/yuenyauyoo/Development/ripple-out-worship-revamp/.impeccable/mocks/final/ripple-out-songs.html'
target_fingerprint: 'sha256:9aa750fab82a92f08acd9301df999cfbdfecce140398d1398bd36b9c2bca58d0'
target_path: /Users/yuenyauyoo/Development/ripple-out-worship-revamp/.impeccable/mocks/final/ripple-out-songs.html
timestamp: 2026-10-15T18-00-07Z
slug: impeccable-mocks-final-ripple-out-songs-html
---

Method: dual-agent (A: design review sub-agent · B: detector and browser sub-agent)

## Design Health Score: 24/40 (Acceptable)

1 Status 3 · 2 Real world 3 · 3 Control 3 · 4 Consistency 2 · 5 Error prevention 2 · 6 Recognition 3 · 7 Flexibility 2 · 8 Minimalism 3 · 9 Error recovery 1 · 10 Help 2

## Design specificity

Library (hymnal indexes, lyric search with matched line) and editor (smart paste) are authored for the product. The song page is a generic title + sidebar-cards template. The ripple vision barely appears.
Detector: 0 non-advisory CLI findings (all advisories compare against the legacy DESIGN.md). Overlay: accent on wash 4.04:1 (light) on key tags, chips, active tabs; unavailable A–Z letters at 1.3:1; editor line numbers 2.5:1.

## Priority issues

- [P1] Phone song page buries the song: lyrics start ~65% down; piano shows in Lyrics mode; planner action is the hero. Fix: title, then lyrics; one compact chord bar; demote Add to setlist.
- [P1] Two key pickers (piano vs locked stepper + grid); piano hides black-key names, fixed spellings, no minor, small targets. Fix: one picker everywhere.
- [P1] Song page ignores the locked reading model (Show card vs header D + Aa); several navy masses. Fix: reuse header D, Aa, chord bar; soft Add to setlist.
- [P1] No empty/error states, no request path, no chart-syntax errors. Fix: no-results with Request, offline/save failure, gutter errors.
- [P2] Transposing in Numbers mode shows no visible key. Fix: key chip at head of sheet, "1 = E".

## Persona red flags

Casey (phone at care group) scrolls past chrome to verse 1; Jordan sees "Code B2", unlabelled 1 4 5, a navy New song they cannot use; Alex gets hover-only actions and silent removal when unchecking a setlist.

## Minor

Phone editor lines cut off; no simplified source; role-aware primary (Request a song for members); dark piano keys 1.4:1; section label case; static hover states read as random highlights; no focus states.
