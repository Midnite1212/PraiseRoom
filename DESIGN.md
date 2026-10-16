---
name: Ripple Out Worship (legacy UI)
description: The pre-rebrand interface, recorded as reference. Material 3's baseline dark scheme, adopted largely unchanged.
colors:
  primary-darkest: '#141218'
  primary-darker: '#1D192B'
  primary-main: '#4F378B'
  primary-dark: '#6750A4'
  primary-light: '#C9CDFF'
  primary-lighter: '#E6E0E9'
  primary-lightest: '#EADDFF'
  secondary-main: '#D0BCFE'
  secondary-lighter: '#4A4458'
  on-primary: '#381E72'
  on-secondary-container: '#E8DEF8'
  error-main: '#EFB8C8'
  error-text: '#8C1D18'
  background-paper: '#0F0D13'
  background-default: '#171717'
  input-background: '#1D1B20'
  surface-container: '#211F26'
  surface-container-high: '#2B2930'
  surface-container-highest: '#322F35'
  surface-container-active: '#332D41'
  outline: '#938F99'
  outline-variant: '#49454F'
  on-surface-variant: '#CAC4D0'
  on-surface-secondary: '#CCC2DC'
  on-surface-neutral: '#D1D1D1'
  text-primary: '#FFFFFF'
  switch-track-checked: '#8175A0'
  section-chip-border: '#A9A9A9'
  chord-c: '#874F00'
  chord-d: '#255C0D'
  chord-e: '#045C7A'
  chord-f: '#1D309D'
  chord-g: '#471383'
  chord-a: '#840000'
  chord-b: '#992E00'
typography:
  headline-lg:
    fontFamily: 'Work Sans, sans-serif'
    fontSize: '2rem'
    fontWeight: 700
  headline-md:
    fontFamily: 'Work Sans, sans-serif'
    fontSize: '1.5rem'
    fontWeight: 700
  title-lg:
    fontFamily: 'Work Sans, sans-serif'
    fontSize: '1.25rem'
    fontWeight: 700
  title-md:
    fontFamily: 'Work Sans, sans-serif'
    fontSize: '1.125rem'
    fontWeight: 700
  title-sm:
    fontFamily: 'Work Sans, sans-serif'
    fontSize: '1rem'
    fontWeight: 700
  subtitle:
    fontFamily: 'DM Sans, sans-serif'
    fontSize: '1rem'
    fontWeight: 600
  body:
    fontFamily: 'DM Sans, sans-serif'
    fontSize: '1rem'
    fontWeight: 400
  body-sm:
    fontFamily: 'DM Sans, sans-serif'
    fontSize: '0.875rem'
    fontWeight: 400
  label:
    fontFamily: 'DM Sans, sans-serif'
    fontSize: '0.875rem'
    fontWeight: 600
  caption:
    fontFamily: 'DM Sans, sans-serif'
    fontSize: '0.6875rem'
    fontWeight: 400
  chord:
    fontFamily: 'DM Sans, sans-serif'
    fontSize: '13px'
    fontWeight: 700
rounded:
  chip: '4px'
  card: '8px'
  card-featured: '12px'
  pill: '30px'
  pill-full: '100px'
spacing:
  unit: '8px'
  card-padding: '16px'
  card-featured-padding: '24px'
  dialog-padding-x: '24px'
components:
  button-primary:
    backgroundColor: '{colors.secondary-main}'
    textColor: '{colors.on-primary}'
    rounded: '{rounded.pill}'
    padding: '6px 16px'
    typography: '{typography.label}'
  button-outlined:
    textColor: '{colors.secondary-main}'
    rounded: '{rounded.pill}'
    padding: '6px 16px'
    typography: '{typography.label}'
  button-danger:
    backgroundColor: '{colors.error-main}'
    textColor: '{colors.error-text}'
    rounded: '{rounded.pill}'
    padding: '6px 16px'
  card-song:
    backgroundColor: '{colors.primary-darkest}'
    rounded: '{rounded.card}'
    padding: '{spacing.card-padding}'
  card-recommended:
    backgroundColor: '{colors.primary-darkest}'
    rounded: '{rounded.card-featured}'
    padding: '{spacing.card-featured-padding}'
  input:
    backgroundColor: '{colors.input-background}'
    textColor: '{colors.primary-lighter}'
  nav-item-active:
    backgroundColor: '{colors.primary-main}'
    textColor: '{colors.primary-lighter}'
    rounded: '{rounded.pill-full}'
  nav-rail:
    backgroundColor: '{colors.primary-darkest}'
    width: '100px'
  nav-bar-mobile:
    backgroundColor: '{colors.primary-darkest}'
    height: '80px'
  chip-section:
    textColor: '{colors.secondary-main}'
    rounded: '{rounded.chip}'
    height: '30px'
  chip-chord:
    textColor: '{colors.primary-lightest}'
    typography: '{typography.chord}'
    rounded: '{rounded.chip}'
  dialog:
    backgroundColor: '{colors.surface-container-high}'
    textColor: '{colors.primary-lighter}'
    rounded: '{rounded.card}'
  menu:
    backgroundColor: '{colors.primary-darker}'
    textColor: '{colors.primary-lighter}'
    rounded: '{rounded.card}'
---

<!-- LEGACY REFERENCE: records the interface as it stood before the vision-led rebrand (see PRODUCT.md, Brand Commitments). New work is not expected to follow it. The rebrand will replace this file. -->

# Design System: Ripple Out Worship (legacy UI)

## Overview

**Creative North Star:** none. The current interface has no named concept. It is Material 3's baseline dark scheme, the default purple that Google's Material Theme Builder generates, applied through MUI v5 with few changes.

The app is a dark interface throughout. Near-black surfaces (`#0F0D13` to `#332D41`) carry pale lavender text, and one lavender accent (`secondary-main`) does almost all of the signalling: icons, active borders, outlined buttons, and focus. That accent appears about 80 times across the components, far more than any other token. Containers are dark bordered cards, and controls are pills. The layout is a desktop navigation rail on the left that becomes a bottom bar on mobile.

The one piece of visual language particular to this app is the **chord chip**: every chord sits in a small solid chip above the syllable it lands on, coloured by its root note. The rest of the look is Material defaults.

This file records that state so the rebrand has an explicit "before". It is evidence to learn from, not a direction to extend.

**Key Characteristics:**

- Dark-only. There is no light theme and no theme switch.
- Stock Material 3 baseline dark tokens: `#D0BCFE` / `#4F378B` / `#381E72` / `#EADDFF`.
- One lavender accent carries interaction, selection, and iconography.
- Bordered dark cards, pill-shaped buttons and navigation items.
- Chords are colour-coded by root note in solid chips.
- Work Sans headings over DM Sans body text.

## Colors

A violet-tinted dark scheme with a single pale lavender accent. Its values come straight from Material 3's baseline dark palette, extended with MUI module augmentation (`surface`, `outline`, `onSurface`, `onPrimary`, `onSecondaryContainer`, `switchTrack`, `scrollbar`).

### Primary

- **Primary Main** (`primary-main`): the selected navigation pill and the hover/selected state in autocomplete lists.
- **Primary Lighter** (`primary-lighter`): default text and icon colour on inputs, menus, dialogs, tabs, and list items. In practice it is the app's main body colour.
- **Primary Lightest** (`primary-lightest`): text on chord chips and key-step arrows.
- **Primary Dark** (`primary-dark`): key-step buttons in the setlist view and selected autocomplete options.
- **Primary Darker / Darkest** (`primary-darker`, `primary-darkest`): menu and navigation paper backgrounds (darker); card, sidebar, and mobile nav-bar backgrounds (darkest).

### Secondary

- **Lavender Accent** (`secondary-main`): the workhorse. It is used for icons, outlined-button text, hover borders on cards, section-chip labels, switch thumbs, select chevrons, list icons, and the filled primary button.
- **Muted Plum** (`secondary-lighter`): the fill for unselected filter chips and home tab backgrounds. A selected chip switches to `primary-dark`. The name is the reverse of what it holds, since it is darker than `secondary-main`.

### Tertiary

- **Rose** (`error-main`): Material 3's baseline _tertiary_ colour, used here as both `error` and `warning`. It fills destructive buttons with `error-text` (`#8C1D18`) on top.

### Neutral

- **Surfaces** (`background-paper`, `background-default`, `input-background`, `surface-container` through `surface-container-active`): seven near-black steps. Dialogs and drawers sit on `surface-container-high`; inputs sit on `input-background`.
- **Outlines** (`outline`, `outline-variant`): `outline` for input, dialog, and outlined-button borders; `outline-variant` for card borders, dividers, and select borders.
- **On-surface text** (`on-surface-variant`, `on-surface-secondary`, `on-surface-neutral`, `text-primary`): lyrics render in `on-surface-secondary`; headings and dialog titles use pure white.

### Chord Colors

Seven dark, saturated hues keyed to the root note (`chord-c` to `chord-b`), defined as `ChordColors` in `constants.ts`. Minor chords share their root's colour. Each flat shares the colour of the natural note above it: D♭ with D, E♭ with E, G♭ with G, A♭ with A, B♭ with B. Chip text is `primary-lightest` on every hue.

### Named Rules

**The One Accent Rule.** Lavender (`secondary-main`) is the only accent, and it marks everything interactive. Nothing else competes for attention, which also means nothing is singled out.

**Known inconsistencies.** `styles.css` sets `body` to `#000000` and defines unused `--primary-color` / `--secondary-color` variables, while the MUI theme sets the page background to `#171717`. A few one-off hex values remain in components (`#1F1F1F`, `#1E1B26`, `#D0BCFF`, `#A9A9A9`).

## Typography

**Display Font:** Work Sans (sans-serif fallback), used for headings h1–h5 and dialog titles.
**Body Font:** DM Sans (sans-serif fallback), used for everything else, including lyrics and chords.

**Character:** two neutral geometric-grotesque sans serifs. The pairing reads as competent and generic: headings are distinguished by weight (700), not by voice.

### Hierarchy

- **Headline Large** (700, 2rem; 1.875rem at ≥1280px; 1.5rem below 800px): page titles.
- **Headline Medium** (700, 1.5rem): section titles.
- **Title Large** (700, 1.25rem; drops to 600 / 1rem below 800px): card and panel titles, dialog titles.
- **Title Medium / Small** (700, 1.125rem / 1rem): sub-headings.
- **Subtitle** (DM Sans 600, 1rem / 500, 0.875rem): metadata labels.
- **Body** (400, 1rem; **0.875rem below 800px**): lyrics and general text.
- **Body Small** (400, 0.875rem; 0.8rem below 800px): secondary text.
- **Label** (600, 0.875rem, sentence case, no uppercase transform): buttons.
- **Caption** (400, 0.6875rem): fine print.
- **Chord** (700, 13px): chord chip labels.

### Named Rules

**The Shrinking Body Rule (observed, not endorsed).** Body text gets _smaller_ on phones: lyrics drop to 14px below the 800px breakpoint. That is the opposite of what PRODUCT.md asks for (lyrics readable on a phone in the hand and on a TV across the room).

**Known inconsistencies.** Fonts load twice: `@fontsource/work-sans` and `@fontsource/dm-sans` in `theme.ts` (default weight only), and a Google Fonts variable-weight import in `styles.css`.

## Layout

- **Navigation shell:** a fixed 100px rail on the left on desktop (`DESKTOP_SIDEBAR_WIDTH`), replaced by an 80px bottom bar on mobile (`MOBILE_NAVBAR_HEIGHT`). Both sit on `primary-darkest`.
- **Page headers:** 60px on mobile, 70px on tablet, 80px on desktop (`*_PAGE_HEADER_HEIGHT`). The public setlist view has its own 64px header and 48px footer.
- **Breakpoints are moved from MUI's defaults:** `sm` 800px, `md` 960px, `lg` 1280px, `xl` 1920px. "Mobile" here means anything under 800px, which includes most tablets in portrait.
- **Content widths:** the song view uses 600px, 900px, and 1340px widths for mobile, tablet, and desktop, and desktop height is capped at 960px.
- **Spacing:** MUI's 8px unit. Cards pad 16px (song cards) or 24px (featured cards). Dialogs pad 24px horizontally.
- **Mobile variants:** several screens have a separate `*Mobile.tsx` twin instead of one responsive component.
- **Song reading:** lyrics and chords flow as a wrapping row of chord-over-syllable stacks. The song and setlist views offer a split view in landscape, and tell phone users to rotate their phone to use it.

## Elevation & Depth

Depth comes mostly from **tonal layering plus 1px borders**, not shadows. Cards are flat `primary-darkest` with an `outline-variant` border. Floating layers (menus, dialogs, autocomplete lists, date pickers) step up to a lighter surface and add a soft shadow.

### Shadow Vocabulary

- **Floating panel** (`box-shadow: 0px 4px 12px rgba(0, 0, 0, 0.3)`): dialogs, autocomplete dropdowns, date-picker poppers.
- **Menu** (`box-shadow: 0 2px 6px 2px rgba(0, 0, 0, 0.15), 0 1px 2px 0 rgba(0, 0, 0, 0.30)`): Material 3's level-2 elevation, used on context menus.

### Named Rules

**The Border-Not-Shadow Rule.** Resting containers are separated by a 1px border. A shadow means the layer floats above the page.

## Shapes

Two shape families meet without a clear rule. **Controls are pills**: buttons at 30px radius, navigation items and some actions at 100px, filter and search controls at 40px, selects at 1.75rem. **Containers and chips are softly squared**: chord and section chips at 4px, cards, dialogs, and menus at 8px, featured cards at 12px, and the navigation paper at 15px.

**Known inconsistencies.** The components use at least ten distinct radii (4, 5, 8, 10, 12, 15, 20, 26, 30, 40, and 100px, plus 1rem and 1.75rem). The frontmatter records the five that recur.

## Components

### Buttons

- **Shape:** pill (30px radius), sentence-case label in DM Sans 600.
- **Primary (contained):** lavender fill (`secondary-main`) with deep violet text (`on-primary`). It is used sparingly, about seven times in the app.
- **Outlined (the default):** a grey `outline` border with lavender text. The border turns lavender on hover. Used about 22 times; it is the app's main button style.
- **Danger:** rose fill (`error-main`) with dark red text (`error-text`). On hover it inverts to a translucent rose fill with rose text.
- **Text buttons in dialogs:** lavender text with a 15% lavender hover wash.

### Chips

- **Section chip** (`{Verse 1}`, `{Chorus}`): outlined, 4px radius, 30px tall, grey `#A9A9A9` border, lavender 14px label.
- **Chord chip:** solid fill in the chord's root colour, 13px bold `primary-lightest` label, 4px radius, placed above the syllable it lands on. When chords are hidden, an invisible chip keeps the line height stable.

### Cards / Containers

- **Corner Style:** 8px for song cards, 12px for featured "recommended" cards.
- **Background:** `primary-darkest`.
- **Shadow Strategy:** none at rest (see Elevation & Depth).
- **Border:** 1px `outline-variant`. Song cards switch to a lavender border on hover with a 0.1s ease-in-out transition.
- **Internal Padding:** 16px for song cards, 24px for featured cards.

### Inputs / Fields

- **Style:** outlined MUI fields on `input-background` (`#1D1B20`) with an `outline` stroke and `primary-lighter` text at weight 500.
- **Adornment buttons:** circular, with a 10% white hover wash and 16px icons.
- **Select:** pill-shaped (1.75rem), bold 0.875rem text, `outline-variant` border that does not change on focus, lavender chevron.

### Navigation

- **Desktop:** a 100px rail with stacked icon-and-label items. The active item is a `primary-main` pill (100px radius) with `primary-lighter` text, and search sits at the top with a lavender icon.
- **Mobile:** the same items in an 80px bottom bar.
- **Menus and dialogs:** dark violet paper (`primary-darker` for menus, `surface-container-high` for dialogs) with 8px corners and a white Work Sans title.

### Chord-Lyric Line (signature)

The app's one distinctive pattern. Each `[Chord]syllable` pair renders as a vertical stack: a chord chip above a run of lyric text. The stacks wrap as a row, so a long line reflows naturally on narrow screens. Transposition and sharp/flat switching recolour the chips in place.

## Do's and Don'ts

### Do:

- **Do** treat this file as the "before". Read it to understand what exists and what users are used to, not as a style to extend.
- **Do** use the existing palette tokens (`secondary.main`, `outline.variant`, `surface.container*`) rather than raw hex when making a small fix to a legacy screen before the rebrand reaches it.
- **Do** bring the chord colour-by-root behaviour into the rebrand discussion as a functional decision. It is the one piece of interface language here particular to this app.

### Don't:

- **Don't** build new surfaces or the rebrand by extending the stock Material 3 purple. PRODUCT.md requires the design language to reflect the Ripple Out vision.
- **Don't** add another corner radius or another one-off hex value to the legacy screens.
- **Don't** copy the shrinking mobile body size (14px lyrics below 800px) into new work; it conflicts with PRODUCT.md's readability requirement.
