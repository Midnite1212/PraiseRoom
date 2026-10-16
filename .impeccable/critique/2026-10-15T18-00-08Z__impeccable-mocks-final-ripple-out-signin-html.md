---
target: signin mock
total_score: 24
max_score: 40
na_heuristics:
p0_count: 0
p1_count: 3
target_identity: 'file:/Users/yuenyauyoo/Development/ripple-out-worship-revamp/.impeccable/mocks/final/ripple-out-signin.html'
target_fingerprint: 'sha256:47e8213512ea56ff516a4349e408af54aef94e9a5d24ec67cddc41423dc97205'
target_path: /Users/yuenyauyoo/Development/ripple-out-worship-revamp/.impeccable/mocks/final/ripple-out-signin.html
timestamp: 2026-10-15T18-00-08Z
slug: impeccable-mocks-final-ripple-out-signin-html
---

Method: dual-agent (A: design review sub-agent · B: detector and browser sub-agent)

## Design Health Score: 24/40 (Acceptable)

1 Status 2 · 2 Real world 3 · 3 Control 2 · 4 Consistency 3 · 5 Error prevention 2 · 6 Recognition 3 · 7 Flexibility 2 · 8 Minimalism 3 · 9 Error recovery 2 · 10 Help 2

## Design specificity

Copy is specific ("Reading a shared setlist never needs an account", "This page has rippled away."); the layout is the generic SaaS split screen, the brand half is identical on five screens, and the rings are wallpaper.
Detector: 0 non-advisory CLI findings; few overlay findings.

## Priority issues

- [P1] Real sign-in states missing: wrong password, unknown email, provider conflict, expired reset link, rate limit, loading.
- [P1] Invite assumes an existing email account; Apple/Google with a different address breaks it.
- [P1] No path for accounts from the old login.
- [P2] Navy email Sign in outranks the providers; provider buttons do not meet Google/Apple branding. Fix: "Continue with email" disclosure, official marks.
- [P2] Fields 1.11:1 against the sheet, placeholder dots look filled, no show/hide, confirm field, colour-only checklist, autocomplete not specified.

## Persona red flags

Jordan (invited first-timer) cannot create a password; Casey loses 140px to the brand bar on phone and is told to open the reset on "this device"; Sam meets tab order Email → Forgot → Password and no focus states.

## Minor

Wordmark should be "Ripple Out Worship"; invite heading strands "Group"; account enumeration in "Link sent"; no privacy link; 404 assumes a signed-in visitor and offers nine options.
