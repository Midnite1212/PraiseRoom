---
target: setlists mock
total_score: 24
max_score: 40
na_heuristics:
p0_count: 0
p1_count: 3
target_identity: 'file:/Users/yuenyauyoo/Development/ripple-out-worship-revamp/.impeccable/mocks/final/ripple-out-setlists.html'
target_fingerprint: 'sha256:0fb34f33e8d14d43ea7c6b31b678c42a381a42343e1226633d2393ae90f167b1'
target_path: /Users/yuenyauyoo/Development/ripple-out-worship-revamp/.impeccable/mocks/final/ripple-out-setlists.html
timestamp: 2026-10-15T18-00-08Z
slug: impeccable-mocks-final-ripple-out-setlists-html
---

Method: dual-agent (A: design review sub-agent · B: detector and browser sub-agent)

## Design Health Score: 24/40 (Acceptable)

1 Status 3 · 2 Real world 2 · 3 Control 3 · 4 Consistency 2 · 5 Error prevention 3 · 6 Recognition 3 · 7 Flexibility 2 · 8 Minimalism 3 · 9 Error recovery 1 · 10 Help 2

## Design specificity

Song flow line, key-moved chips and "Share with the room" QR are specific; the skeleton (filter column + event list + detail sidebar + two-pane builder) is generic. The "services / Run sheet / Present" framing contradicts PRODUCT.md's "beyond the Sunday stage".
Detector: 0 non-advisory CLI findings. Overlay: accent on wash 4.04:1; grips drawn in hairline 1.28:1; skipped heading levels.

## Priority issues

- [P1] Services model excludes individuals and undated setlists. Fix: optional date, an undated/practice shelf, plain names, care-group-first examples.
- [P1] Hover-only and drag-only interactions on a phone/tablet product; invisible grips; phone builder cannot reorder or remove; no tablet mocks. Fix: always-visible ⋯ menus, muted grips, Move up/down, keyboard reorder, tablet frames.
- [P1] Public-link state after its effects; no "off" state; no confirmation to turn it off. Fix: state first, off state, consequence-spelled confirm.
- [P2] Two editing surfaces and a muddled save model. Fix: setlist page read-and-sing, one editor with autosave + Done.
- [P2] Group model does not fit care groups (everyone can edit; groups only filter; no phone group page). Fix: Can view / Can edit roles, group pages reachable, phone group page.

## Persona red flags

Casey: chips cut mid-word, 34px Add buttons, unlabelled grid icon for share. Sam: drag-only reorder, hover-only remove, no focus rings, 4.04:1 text. Jordan: "Run sheet" jargon, ambiguous "Present", no path to invite a group.

## Minor

More than one navy per screen; "Upcoming" twice; leading zeros; phone drops week labels and +2 badge; "Hope" chip next to "Themes"; mock data inconsistent (18 vs 25 Oct); decorative QR on planner; toast covers a row; no past, loading or error states.
