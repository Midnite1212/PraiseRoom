---
version: 1
slug: 'ents-setlistview-setlistviewcontainer-tsx-93e0da8e'
primary_target: 'ui/src/components/setlistView/SetlistViewContainer.tsx'
related_targets:
  ['ui/src/components/setlistView', 'ui/src/components/setlist/adminView/SetlistPreview.tsx']
---

# Surface brief: Public setlist view (`/setlist/view/:id`)

## Scope and mode

- Route: `/setlist/view/:id`, also embedded as the setlist preview in `SetlistAdminViewContainer` (`SetlistPreview.tsx`, `isSetlistPreview`).
- Visitor mode: **Read**. The visitor reads and sings a setlist's lyrics and chords, song after song.
- First surface of the replacement Ripple Out identity. The rest of the app keeps the legacy theme until later passes migrate it.

## Audience, job, constraints

- Guests and group members opening a shared link (no account needed), individuals learning songs, and a group reading one TV that a laptop is screen-sharing.
- Job: know which songs are in the set and which one is being sung, jump to any song, show or hide chords, change key, sing.
- Constraints: mostly phones and tablets; sometimes a laptop shared to a TV across a living room; often evening, dim light. English lyrics for now. The page shows song content only, never member data.

## Locked decisions (component by component, updated 2026-10-16)

The user rejected the Deep Dive direction and chose the system one component at a time. The direction contract further down is superseded; these decisions win wherever they differ.

- **Type:** two fonts only.
  - **Overpass** for all text. Lyrics are 300 in every approved mock. The user once proposed body 200 with headings 300; final weights get confirmed in the build review.
  - **Source Code Pro** for labels, keys, numbers and chords.
  - ♭ / ♯ are plain Unicode with no special styling. The chord row keeps a locked line height so fallback glyphs never push chords into the lyrics.
- **Colour:** E4 "Dusty Navy & Powder Sky", used in every approved mock. Flat, no gradients, light and dark.
  - Light: tint #EFF4FA (chrome layer), sheet #FFFFFF, alt #E2EAF4, text #14223A, muted #4E5D74 to #5A6880, hairline #DDE4EE, primary #2A4A72 (on-primary #FFFFFF), accent #3A72B0, accent wash #DCE9F7.
  - Dark: tint #16233A (chrome), sheet #0F1826, alt #1F2F4B, text #E8EEF6, muted #A3B2C6, hairline #26364F, primary #B6CDEA (on-primary #16294A), accent #8FB8E6, accent wash #22385A.
  - E5 is retired.
- **Visual language: "Calm × Paper" (locked).**
  - **Two layers.**
    - Controls sit on the soft tinted **chrome layer**.
    - Lyrics sit on a **reading sheet** with 24px rounded top corners: white in light mode, a step darker than the chrome in dark mode.
    - There are no lines around the lyrics and no outlines on controls.
  - **Controls** are gentle fills on alt, with 12px corners and an 8-point spacing rhythm.
    - **One navy moment:** the active Lyrics | Chords option.
    - The current song is a soft accent wash with accent text, never a heavy fill.
  - **Sheet header:** on phone and tablet portrait, a mono accent label with the setlist name only (`THURSDAY CARE GROUP`; no song position, because the top strip shows it); on desktop and tablet landscape, no label (see the H2 header below), the title in Overpass 300 (about 34px on phone, 40px on desktop), then the meta line. Section labels ("Verse 1") use the accent colour.
  - **About this song** is an icon-only **ⓘ** button beside the title (tooltip and aria-label "About this song"). It opens a popover with key, time, tempo and credits. There is never a persistent side panel.
  - **Phone:**
    - A minimal top bar: Lyrics | Chords on the left; **Aa** (text size and theme) and share on the right.
    - Thin progress segments (3px, current song in accent) under the bar. No song tabs.
    - A **floating Up next card** at the bottom: white, 18px radius, soft shadow, ‹ and › plus "Up next · <title>". Tapping its middle opens the song-list bottom sheet with Close.
    - Swipe left or right to change songs.
  - **Desktop:**
    - Top bar: the setlist name and date on the left; Lyrics | Chords, Aa and share on the right. Thin progress segments sit below it.
    - **Aa menu** (C3): Text size (A−, 100%, A+), **Layout** (Auto · One · Two, each with a column glyph and a word) and Theme (**☀ Light | ☾ Dark**, sun and moon icons; no Auto option). On first visit the theme follows the device's light or dark setting, then the person's choice is remembered on that device. The column count lives here, not in the top bar. The theme switch appears only in Aa, on every device and in both views.
    - **R1 contained setlist rail** on the left: a soft panel aligned with the sheet's top edge and corners.
      - Header: "Setlist", "6 songs · <date>", and a **layout-switch icon** (I2): a window with a top band, meaning "show setlist above". In the collapsed strip, the matching icon (a window with a side column) means "show setlist beside". Tooltips say the same.
      - Rows on a grid of number, title and key chip; the current song has the accent wash.
      - The footer holds only clickable `←` `→` keycaps with "change songs". There are no Prev / Next buttons and no Up next section, because rows are clickable and keys and pedals change songs.
    - **Collapsing** moves the list into a **labelled progress strip** across the top (song names under each segment), with an expand button. This follows the one-list rule: the list sits beside or above, never both.
    - The lyrics sheet fills the rest. Auto columns gives two at 22px, and drops to one when space is narrow.
  - **Tablet** (not yet mocked in this language): portrait follows the phone pattern; landscape follows the desktop pattern with the list collapsed into the strip by default.
  - Reference mocks: `.impeccable/mocks/decision/calm-paper-v2.html` (phone, collapse and ⓘ) and `setlist-rail.html` (R1).
- **Navigation:** one song at a time.
  - The URL keeps the current song (`?song=3`).
  - ← and → change songs, and 1–9 jump to a song.
  - Each song keeps its own key, and each new song starts at the top.
  - Edge swipes within about 24px of the screen edge are ignored (Safari Back).
  - The desktop list remembers its placement per device: beside by default on desktop, above by default on tablet landscape.
- **Participant view:** lyrics only by default.
  - Lyrics | Chords is visible; text size, layout (columns, on wider screens) and theme live in Aa.
  - Lyrics are 20px on phone, 24px on tablet and 22px on desktop.
- **Musician view (proposed in Calm × Paper 2026-10-14, awaiting the user's review):**
  - Chords on = the navy "Chords" option.
  - A **chord bar** under the title on the tint: the key chip (accent wash, `Key D ▾` in both modes, with a `+2` badge when your key differs from the setlist), a Numbers | Letters soft switch (`1 4 5 | A B C`, Numbers by default) and a **settings-sliders icon** for chord settings. Never use a sun-like or rayed icon here: users read it as a light/dark toggle, and theme lives only in the Aa menu.
  - **Typography (approved 2026-10-14):**
    - Lyrics stay **Overpass 300** in chord mode, as in the participant view (18px phone, 22px desktop).
    - Chords are **Source Code Pro 500** in the accent colour (the user found 600 too heavy): **16px on a locked 22px row** on phone, **19px on a 26px row** on desktop, so chords keep roughly 0.85–0.9× the lyric size at every width.
    - Section labels are **13px (phone) / 14px (desktop), 500, uppercase**, because musicians navigate by them.
    - The song title is **28px** on phone and **36px** on desktop in chord mode, so lyrics start sooner.
    - No text is set below **11px** (for example the key grid's "setlist" tag).
  - **Phone lyrics drop to 18px in chord mode.** A long chorded line breaks at the phrase boundary nearest its middle (a balanced break), so no word is stranded.
  - **Key panel** (bottom sheet on phone, popover on desktop):
    - − / big key / + stepper with "+2 from setlist key D"
    - a 4×3 chromatic grid: your key in navy, the setlist key in accent wash with a "setlist" tag
    - Reset to the setlist key, and Done
    - Capo appears as a row in this panel only in **Letters** mode with "Guitar capo" on. It never appears in Numbers.
  - **Chord settings** (all songs), in three groups:
    - **Chords:** show chords as Numbers | Letters; Full | Simple; Colour chords (off by default).
    - **Letters:** Sharps & flats (Auto, ♯, ♭) and Guitar capo (off). This group shows only when Letters is selected; in Numbers mode it is simply absent, with no hint.
    - **Reading:** Auto-scroll; Keep screen awake (on).
  - **Colour chords:** numbers are coloured by scale degree (1 is always the same colour); letters by root.
  - **Desktop:** the rail says "6 songs · your keys", each row shows the key you will play, and a dot marks keys you changed.
  - **Tablet:**
    - **Portrait** follows the phone pattern: lyrics Overpass 300 at **24px**, chords Source Code Pro 500 at **20px** on a 26px row, section labels at 14px caps, the key panel as a popover from the chip, and Up next floating centred (560px wide).
    - **Landscape** follows the desktop pattern: the setlist above as the labelled strip by default, two lyric columns at **22px** with chords at **18px** on a 24px row. The layout icon moves the list beside, and Auto columns then drops to one.
  - Mock: `.impeccable/mocks/decision/musician-calm-paper.html`. Tablet mock: `musician-tablet.html`.
- **Feedback round, 2026-10-15:**
  - **Desktop and tablet-landscape song header (superseded 2026-10-16 by header D, below):** the title in Overpass 300 at 28px, the artist (muted) and ⓘ, with **no song number** (the rail or strip already shows the position). **Metadata rule (all devices):** the artist is shown with the title. All other song metadata (key, time, tempo, translator, year) lives only in the ⓘ panel.
  - **Phone and tablet portrait:** the thin progress segments are replaced by a **labelled strip that scrolls sideways** (a short bar plus the number and title per song), with the current song in view and the previous one peeking in from the left edge.
  - **Chord line spacing is slightly tighter:** phone chord row 20px, lyric line-height 1.28, gap between lines 8px; tablet rows 24px (portrait) and 22px (landscape); desktop row 24px. Lyrics-only spacing is unchanged.
  - Final pages: `.impeccable/mocks/final/ripple-out-{phone,tablet,desktop}.html`.
- **Decisions, 2026-10-16:**
  - **Song header = D (two rows) on desktop and tablet landscape.** Row 1: the title (Overpass 300, 28px, balanced wrap) with ⓘ right after it. Row 2: the artist (muted) on the left, and in the musician view the chord controls (key chip, `1 4 5 | A B C`, settings) on the right. Still **no song number**. Long titles get the full sheet width; options B′, N, K, M and G are retired (`.impeccable/mocks/decision/song-header-options.html`).
  - **Full | Simple applies in both Numbers and Letters** (for now). It stays in the Chords group of chord settings.
  - **Split view (two songs side by side) is deferred.** Explorations are kept for later: `.impeccable/mocks/decision/split-view.html` (moving pair vs independent panes, N vs D in panes) and `split-view-2.html` (top-bar split button, per-song columns only fitting on TV-size screens). Do not build it in the first pass.
- **Superseded:** the Mix B "crisp frame" language, the underline song tabs, and the floating card with Prev / Next buttons. Earlier mocks remain in `.impeccable/mocks/decision/` for reference only.

## Direction contract (superseded, see Locked decisions)

THESIS: The setlist is a dive. Songs are depth stops on one vertical line, and a single thermocline band marks the song being sung. It refuses the category default of a song dropdown above a flat lyric sheet with stage-purple glow.

OWN-WORLD: The ground is drenched in ocean depth, deepening from Shallows #123A5E through Twilight #0B2547 to Abyss #061226 as the set goes on. Still marine-snow dots appear in the frame only. Text is Chalk #F0F4F5, with Silt #9DB2C4 for secondary text. Thermocline #5CC8D6 is the only accent, used for the active state and for chords. Rules are chalk hairlines at 28% opacity; there are no shadows, glow, or boxed cards around lyrics. Type: Sora Light for headings, Plus Jakarta Sans for lyrics and body text, Geist Mono for labels, keys, and chords. Stops are circles on a 1px axis.

STORY: A guest opens the link, sees the setlist's name and every song as a stop, knows which one is being sung, taps to dive to any song, switches chords or key, and sings without signing in.

FIRST VIEWPORT: On a 390px phone: a mono brand row with "Copy link"; the title in Sora 300 at about 34px; mono meta (date, song count); the depth rail with every stop and the cyan band on the current one; a controls row (Chords, Split); then song 1's title and opening lyrics. On desktop: a sticky 320px left rail holding title, stops, and controls, with the lyric column on the right at about 70ch and type large enough for a TV across a room.

FORM: Deep Dive (catalog world rivers-tides-ocean-depths-mesophotic-deep-dive), chosen by the user over the assigned Sea Glass in re-roll round 1. The user pinned the type: Plus Jakarta Sans body, a geometric sans for headings (Sora), and a mono for support (Geist Mono). seed: none (unavailable). Signature interaction: as the reader scrolls, the thermocline band glides along the axis to the song in view, and tapping a stop dives there. The lyric column itself never animates.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Unresolved decisions

- The user's review of the musician view proposal. The grid key picker is proposed over the wheel.
- The final Overpass weights for lyrics and headings.
- The legacy `SongsLyrics` keeps its own parser; the new chart parser helper can replace it in a separate cleanup.
