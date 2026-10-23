# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Anyone who wants a tool to carry their praise and worship, wherever it happens:

- **Individuals** worshipping alone in their own room.
- **Small groups** gathering in a home or a small room.
- **Worship teams** on stage in a church building, where musicians read chords on a phone during the service and a worship leader builds and shares the setlist beforehand.

The job is the same at every scale: find the song, see it in the right key, and keep moving through a set without the tool getting in the way of worship.

## Product Purpose

Praise Room (formerly "Psalted 2") is a song library with chord charts, key transposition, and setlists. Songs open as lyrics with chords above them in any key; setlists order songs with a key per song, can be grouped into folders shared with teammates, and can be published as a public link anyone can open signed out.

It exists so that anyone can worship anywhere they want, at any time they choose. Success is a person or team reaching the song they need, in the key they need, quickly enough that the tool disappears and the worship continues.

## Positioning

A free passion project made by churchgoers in Hong Kong, not a commercial planning product. There is no billing, no plans, and no upsell; the tool serves the solitary worshipper as fully as the church team on stage, rather than being built around church administration.

## Operating Context

- Used live, during worship: on a phone held or mounted while playing, often in dim rooms or on stage. Reading mid-song is the critical moment; the dark theme is the default for this reason.
- Prepared beforehand: a leader searches the library, builds a dated setlist, sets each song's key, and shares it through a folder or a public link.
- Bilingual by default: English and 繁體中文 throughout the UI. Song content (titles, lyrics, artists) is data and is never translated.
- Sign-in is email and password or Google, through the app's own domain. Public setlist links show song content only, never member data.

## Capabilities and Constraints

- **Songs:** search by title, artist, or lyrics; filter by tempo and theme.
- **Reading:** chords above lyrics, transposed to any key (major or minor), shown as letters or Nashville numbers; lyrics-only mode; five lyrics sizes; a sticky title row while scrolling.
- **Setlists:** dated or undated, ordered songs with a key per song, grouped into upcoming, undated, and past; Mine / Shared filters.
- **Musician view:** one setlist on screen with a song rail, a progress strip, per-song keys, and ← / → to change songs.
- **Sharing:** folders share setlists with their members; every setlist has a public signed-out reading link.
- **Roles:** `member` (default), `editor` (can write songs), `admin`. The UI hides what a role cannot do; the server enforces it.
- **Phones first:** every screen must work at 390 px wide and on desktop, as one responsive component.
- **Rebuild in progress:** `ui/` is the production UI being rebuilt. Sign-up, password reset, song adding and editing, and the profile page are not rebuilt yet; `old-ui/` is the frozen reference for how they worked.
- **Undecided:** the language mix of the song library and whether it is a positioning point have not been confirmed.

## Brand Commitments

- **Name:** Praise Room. "Psalted" is the retired name.
- **Icons are pixel-themed.** A pixel is the smallest single unit of colour and light in a digital image; we are the pixels that want to shine and display Jesus as we worship Him together.
- **Components are Liquid Glass-themed.** Glass reflects God like a mirror, and liquid is worship that overflows the four walls of our rooms, homes, and church buildings into a worshipful lifestyle.
- **Drop the Psalted assets.** The old logo, background images (`old-ui/public/images/`), and favicons are legacy and do not carry forward.

## Evidence on Hand

- A real song library, imported from the earlier MongoDB app.
- No testimonials, user counts, church partners, or press. Future work must not invent any.
- No current logo or icon set; the pixel-themed icons are a commitment still to be made.

## Product Principles

1. **Worship first, tool second.** In the moment of worship the interface recedes; nothing competes with the song.
2. **Anywhere, any scale.** A single person in their room and a team on stage get the same complete tool; no feature assumes a church.
3. **Free and freely shared.** No paywalls, no upsell, and a public link that anyone can open.
4. **Readable in the real room.** Phone-sized, low-light, mid-song reading is the hardest case and the one that sets the bar.
5. **Two languages, equally home.** English and 繁體中文 are both first-class.

## Accessibility & Inclusion

- Bilingual UI (English, 繁體中文), with the language following the browser on first visit.
- Light and dark themes, dark by default; adjustable lyrics size.
- No formal conformance standard has been set.
