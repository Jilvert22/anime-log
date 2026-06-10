# anime-log Design Context

## Product Intent
anime-log is a personal anime viewing log for recording watched titles, ratings, impressions, favorite works, characters, songs, quotes, and a profile-style Anime DNA card.

The design direction is: calm hobby log plus shareable enthusiasm. Keep the current app information architecture and workflows. Do not turn the first screen into a landing page.

## Stitch Connection State
- Stitch tools are not currently callable in this Codex session.
- Stitch tool execution requires the user to configure `STITCH_API_KEY` or OAuth/GCloud credentials and expose the Stitch MCP/SDK tools to Codex.
- Generate 2 to 3 design directions in Stitch, then select exactly one direction as the implementation source of truth.

## Screens To Preserve
- Navigation with home and my page destinations.
- Home tabs and anime list workflows.
- My Page overview with Anime DNA, stats, collections, and settings.
- Anime DNA card, share modal, and user-initiated image export.
- Login modal, add anime form, detail modal, settings modal, and related edit flows.
- Dark mode.

## Visual Principles
- App-first, mobile-first, dense enough for repeated use.
- Quiet surfaces, readable hierarchy, and a few confident accent colors.
- Standard cards and repeated items use an 8px radius baseline.
- Brand expression surfaces such as Anime DNA may use larger radii and richer gradients.
- Avoid copyrighted anime art, titles, quotes, or user profile identifiers in generated share/export imagery unless explicitly authorized by the app state.
- Use records, stats, pattern language, and abstract card expression to create enthusiasm.

## Current Tokens
Use these CSS variables as the starting point for Tailwind/global CSS implementation.

```css
--al-bg: #fff8f2;
--al-surface: rgba(255, 255, 255, 0.88);
--al-surface-strong: #ffffff;
--al-text: #24181f;
--al-muted: #6f6470;
--al-border: rgba(71, 48, 64, 0.13);
--al-accent: #c7357f;
--al-accent-hover: #a8266b;
--al-teal: #0f8f88;
--al-gold: #d99a16;
--al-indigo: #4f5fb7;
--al-shadow-soft: 0 18px 48px rgba(77, 46, 69, 0.13);
```

Dark mode uses a near-black neutral base, softer pink accent, teal highlight, and the same semantic variable names.

## Component Rules
- Buttons: primary actions use the accent color; secondary actions use surfaced backgrounds with borders.
- Inputs: 8px radius, clear focus ring, no layout shift on focus.
- Tabs: segmented controls with obvious selected state and no cramped text.
- Modals: centered, focused, readable; avoid nesting cards inside modal cards.
- Cards: do not nest cards inside cards; repeated records may be cards, sections should be full-width layouts or unframed groups.
- Empty states: concise and actionable, not marketing copy.
- Text must not overflow buttons or compact panels at 390px, 768px, or 1440px widths.

## Anime DNA Rules
- Do not add a sample DNA entry point in the main app.
- Keep the saved image experience user-initiated and expressive; do not force a strict privacy-safe export by default.
- A privacy-safe export can be introduced later only as an explicit optional mode.

## Accessibility And QA
- Maintain color contrast for light and dark modes.
- Preserve keyboard and screen-reader semantics for forms and modal close controls.
- Check mobile 390px, tablet 768px, and desktop 1440px.
- Verify home, my page, login modal, add form, Anime DNA, and dark mode after each broad visual change.
