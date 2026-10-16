# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Individuals and groups who want a website to support their worship:

- **Individuals** learning a song: reading its lyrics and chords, and singing or playing along at home.
- **Worship leaders and teams** planning a worship night: building a setlist, choosing keys, and sharing it with the people playing.
- **Groups**, such as seasonal care groups: gathering people and the setlists they sing from.
- **Admins** who review, verify, and approve songs for the shared library.

Any user can also contribute by requesting a song that is missing from the library (planned).

Every audience counts. Neither planning nor playing ranks above the other.

## Product Purpose

Ripple Out Worship exists so that a lifestyle of praise and worship ripples out beyond the Sunday stage and church grounds, into individual homes, care groups, and everyday life. It gives anyone a free place to find a song's lyrics and chords, learn it, gather songs into setlists, and share those setlists with the people singing them.

Success means a person or a group, wherever they are, can get from "what are we singing?" to worshipping together without paying for a tool or having everyone sign up for one.

## Positioning

- **Worship beyond the Sunday stage.** Service-planning and stage tools are built around running a Sunday service. Ripple Out Worship is built for everywhere else people worship: the living room, the care group, the worship night, someone learning a song alone. The vision is the differentiator, and the name says it.
- **Free and volunteer-built.** A passion project made by volunteers, with no subscription and no per-seat pricing.
- **Setlists travel without accounts.** A public setlist link opens for anyone, so guests and whole groups can sing along without logging in.
- **One shared, verified library.** Every user and group draws from the same song library, and songs join it only after an admin verifies them.

## Operating Context

- Mostly used on **phones and tablets**, held in the hand or propped up while singing or playing.
- A group sometimes reads together from **one shared TV**, with a laptop screen-sharing the setlist or song, so a whole room reads the same screen from a distance.
- Songs are plain-text chord charts: `{Section}` lines start a block, and `[Chord]` sits inline before the syllable it lands on. Charts can be transposed, and some songs carry a simplified chart.
- Setlists are built during the week and read when the songs are sung, whether that is at a worship night or a care group, or by someone practising alone.
- Public setlist links (`/setlist/view/:id`) are read by people who have never seen the app.

## Capabilities and Constraints

**Current**

- One song library shared by every user and group, with chord charts, key transposition, and simplified charts.
- Setlists that can be grouped, shared with teammates, and published as a public link.
- Groups of people with membership (stored as `Group`, shown in parts of the UI as setlist folders).
- Admin-only song creation and editing.
- Songs are in English for now.
- Maintained by a small volunteer team and hosted as one Vercel project (a React SPA and an Express API on MongoDB). Prefer choices the team can afford to run and maintain.

**Planned**

- **Independence from HMCC HK.** The project is reducing or removing its association with HMCC Hong Kong, and existing HMCC HK references are legacy.
- **New sign-in.** The app will stop using the HMCC HK website's login. Google and Apple sign-in are the likely replacement; this is not yet decided.
- **Verified song additions.** Any user can submit a request to add a song. An admin reviews, edits, verifies, and approves it before it joins the shared library.
- **External song search.** Users can find songs that are not yet in the library and turn a result into a request. OpenSong is searched first, then lrclib.net if OpenSong has no match.

**Open decisions**

- Which sign-in providers to use, and how existing accounts and their setlists move over.
- Who is granted admin, and how.
- How OpenSong will be searched. The source and access method are unconfirmed: OpenSong is desktop software that stores songs as local files, not an online database.
- How chords get added to songs found on lrclib.net, which provides lyrics rather than chord charts.
- Copyright and licensing for imported lyrics and chords, including whether they can appear on public setlist links.
- One name for the people feature across the UI ("group", "folder", or another term).

## Brand Commitments

- The product name is **Ripple Out Worship**. "Psalted 2" in the README is an earlier name.
- The design language and branding must reflect the core vision of praise and worship rippling out beyond the Sunday stage and church grounds. How that is expressed visually is decided in design work, not here.
- The project is reducing or removing its association with HMCC HK. New work adds no HMCC HK branding or references.

## Evidence on Hand

- There are no testimonials, usage numbers, or case studies, and future work must not invent any.
- `ui/public/images/psalted_bg.png` and `psalted-bg.jpg` are backgrounds left over from the Psalted era.

## Product Principles

1. **Worship ripples out.** Design for the places worship happens beyond the stage: a phone at home, a tablet in a care group, a TV in a living room. The Sunday stage is one setting among many, not the default.
2. **The song is the point.** Lyrics and chords come before everything else on the screen, whether someone is learning a song alone or a room is singing together.
3. **Works for one, scales to a group.** Someone with no team gets full value, and groups add sharing without adding friction for the individual.
4. **Open contribution, verified library.** Anyone can propose a song, and admins keep the shared library trustworthy.
5. **Sharing never demands an account.** Reading a shared setlist is always possible without signing up.

## Accessibility & Inclusion

- Lyrics and chords must stay readable on a phone held in the hand or propped up, and from across a room when a laptop shares them to a TV.
- A public link must work for a first-time visitor on whatever device they have, with no account and no instructions.
