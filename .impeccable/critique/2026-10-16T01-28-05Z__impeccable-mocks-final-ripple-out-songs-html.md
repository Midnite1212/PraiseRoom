---
target: songs mock round 2
total_score: 29
max_score: 40
na_heuristics:
p0_count: 0
p1_count: 1
target_identity: 'file:/Users/yuenyauyoo/Development/ripple-out-worship-revamp/.impeccable/mocks/final/ripple-out-songs.html'
target_fingerprint: 'sha256:61b3c25463742c46bec7497528a8edb051e402025f24eea8527de7063ab9a4b5'
target_path: /Users/yuenyauyoo/Development/ripple-out-worship-revamp/.impeccable/mocks/final/ripple-out-songs.html
timestamp: 2026-10-16T01-28-05Z
slug: impeccable-mocks-final-ripple-out-songs-html
---

Method: dual-agent (A: design review sub-agent · B: detector and browser sub-agent). Round 2.

## Design Health Score: 29/40 (Good) — was 24

1 Status 3 · 2 Real world 3 · 3 Control 3 · 4 Consistency 3 · 5 Error prevention 3 · 6 Recognition 3 · 7 Flexibility 3 · 8 Minimalism 3 · 9 Error recovery 3 · 10 Help 2

## Specificity

Reading and writing are authored (hymnal indexes, lyric-line search, key-aware add, chart check, smart paste). Songbook landing is the most generic screen.
Detector: 0 low-contrast; nested-cards on search fields (frame-induced); wide tracking on popover label; cramped padding on editor current line.

## Priority issues

- [P1] Phone song page stacks two bars (global + song). Drop the global bar on /song/:id phone.
- [P2] Two search fields on the songbook; breadcrumb ignores path; request form pre-filled with a typo invites duplicates; lyrics-mode phone breaks ignore phrases; .btn.on/.chip.on draw an outline ring; facet count mismatch; guest/member song page, request sent, song not found, save failed not drawn.
- [P3] Unavailable letters too faint; unlabelled key tags; unsorted add popover; roadmap line; sparkle icon reads as AI; one Full | Simplified control; lyrics section labels small; long queries clip without ellipsis.
