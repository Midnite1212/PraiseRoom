---
version: 1
slug: "ui-src-routes-setlist-view-setlistid-tsx"
primary_target: "ui/src/routes/setlist/view/$setlistId.tsx"
related_targets: []
---

# Public setlist view

Scope: `/setlist/view/:id`, the signed-out reading view a shared setlist link opens. Mode: Operate (the visitor plays through a set). This round is a standalone HTML design mock; the route code is unchanged until the design is approved.

Audience and job: anyone holding a shared link, from a musician on stage to one person worshipping in their room, on a phone first, often in low light. They read lyrics with chords, change the key, and move song to song without losing their place.

Constraints: song content only, never member data; English and 繁體中文; light and dark, dark by default; works at 390 px and desktop; standard web controls.

Brand pins (user): Liquid Glass components, pixelarticons (MIT) icons. Glass technique chosen with the user: a hybrid, with a CSS backdrop-filter stack in every browser plus Chromium-only bezel refraction from size-specific SVG displacement maps.

## Layout and UX (shaped with the user)

Board: `.impeccable/mocks/layout-brainstorm.html`. Scenes: in hand, on a stand (hands busy, often landscape), and a laptop screen-shared to a TV for small groups. Mid-song actions are scrolling, text layout, and next/previous song.

- **Portrait phone: Scroll & Dock.** One song scrolls. The dock holds previous, the pixel strip and next; next grows into the next song's name as you reach the last section. After the last line, the next song's title and opening lines **flow on**, dimmed, and scrolling into them makes it current. A horizontal swipe also changes song, as a hidden gesture. **No peek** at the screen edge (the user rejected it).
- **Landscape tablet and laptop: Stage Split**, switched on by orientation and width. Current song on the left and the next song on the right, each scrolling on its own; the right pane is quieter until it becomes current. Advancing **slides** the right pane to the left and brings the following song in on the right. Either pane's title opens a picker to **pin any song** there; "Next song" unpins. The song list can be **reordered**: an explicit edit mode with drag handles, saved on this device only, a "Your order" chip, and a reset to the leader's order. The leader's set is never changed.
- **TV: Present mode**, opened from the top bar's menu. Full screen, lyrics only by default with a "Show chords" toggle, one section at a time, the next line previewed, and a title card between songs. Keyboard, clicker and pedal advance sections, then songs.
- **Control tiers.** Always in reach: previous/next, position, text size, scroll. One tap: key, lyrics/chords, notation, split/columns, auto-scroll, song list. Tucked into the top bar's menu: theme, language, copy link, sign in, Present, song details.
- **Every layout:** keep the screen awake, pedal and keyboard control (← → for songs, PgUp/PgDn/Space to scroll), section jump chips, and auto-scroll.
- **Open:** whether a song rail sits beside the split on very wide screens; the auto-scroll speed model; whether reordering also reorders Present mode.

## Direction contract

THESIS: The song owns the screen and the controls float above it as glass. We refuse the category default, a bordered sheet under a crowded toolbar of outline buttons.

OWN-WORLD: A deep ink ground tinted by one brand hue (oklch hue 250, a cool glass blue), even and clean with a single soft wash of light from the top (the user asked for a modern, clean background), that every tint, chord and pixel of light derives from. The user asked for one central colour rather than a hue per song: "please stick to a central color theme. that's clean and suitable for this visual identity." Controls are liquid-glass capsules with a specular rim and refracting edges. Pixelarticons glyphs at 18px on 2x screens, 20px on 3x and 24px at 1x, so each icon pixel is a whole number of device pixels wide (edges snapped with crispEdges). Geist for every word, controls included (bold titles, regular lyrics and body), falling back to PingFang TC; Geist Mono for musical data only: chords, keys, offsets, counts and the notation toggle. The user chose Geist and Geist Mono. The user asked for type roles chosen by UI/UX practice.

STORY: The visitor sees which set and which song this is, reads in the right key at once, and moves on with a thumb.

FIRST VIEWPORT: A floating glass top bar holds the pixel mark, setlist name and date, then copy-link, a Display menu and sign-in. Language and theme live in the Display menu because there is only 375 px of width, and the language already follows the browser on first visit (zh* opens in 繁體中文). Below 480 px, copy-link moves into that menu too, so the setlist name gets the width. The song title is large, with the artist below. A row of glass controls holds key, lyrics/chords, notation and size. The lyrics start above the fold. A floating glass dock at the bottom holds previous, the pixel spectrum with the current song, and next. On desktop, a glass rail on the left lists the set, and the dock centres on the reading column. Lyrics dissolve into scroll-edge bands before they reach either bar.

FORM: The set drawn as a strip of pixels of light, one per song, in the one brand hue: played songs half-lit, the current song lit and glowing, upcoming songs dark. The signature interaction: changing songs slides a glass lens bead along the strip. While the visitor reads downward, the dock gathers into the strip alone. The user pinned the world ("redesign public setlist view in the Liquid Glass and Pixel Icons world") and approved the pixel-strip form ("each song a pixel of light, the lens bead riding it"). They later replaced its per-song hues with one central colour. concept-seed did not run. seed: none (user-approved form, not rolled).

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
