# Human Agency Design redesign

Van Shea Creative remains a static HTML, CSS, and JavaScript site. The homepage now follows a short path from positioning to proof, writing, experiments, and contact. The longer practice explanation, recommendations, and inquiry form live on About. Art and craft work remains on its separate Art page.

## Build and preview

- `npm run build:redesign` fetches WordPress posts, pins Human Agency Design first, and writes six total titles into the homepage. If the API is unavailable, it uses `src/writing-fallback.json`.
- `npm run build:redesign -- --offline` creates a deterministic build from that fallback.
- `npm run build:redesign -- --output=/absolute/path/outside-this-repo` creates a separate static upload directory while preserving case studies and AI experiments.
- WordPress remains separately deployed at `/blog`. No deployment was performed.
- The form now lives at `/about/#contact`. It keeps the existing `/api/contact` integration and Google Form fallback.

## Visible placeholders Van must fill

1. Replace `[X]` in the hero with the number of years Van wants to claim.
2. Replace `[Role title]` in the M&T Bank row.
3. Replace `[Role title]` in the Vanguard row.
4. Replace `[Role title]` in the Capital One row.
5. Replace `[years]` in the Capital One row.
6. Add Van's portrait at `assets/headshot.webp`. Until that file exists, the header shows a circular, clearly marked `VS` placeholder.

## Decisions and deviations

- The homepage contains only the required Header, Hero, Work, Writing, Experiments, Contact, and Footer sequence.
- Work contains M&T Bank, Vanguard, and Capital One only. Their existing case-study URLs and still previews are retained.
- Who I work with, How I work, the four pillars, Engagement, all seven recommendation quotes, and the full inquiry form moved to About without rewriting their copy.
- The homepage uses Space Grotesk only, with three type-size tokens and two weight tokens. No font, asset, copy, or color was taken from the reference site.
- The reference uses a long blur and opacity entrance for most hero words and a shorter fade for its emphasized verbs. The requested masked slide and stacked text-roll behavior governs this implementation: five masked lines slide for 1000ms with a 120ms stagger, and the two accent verbs roll for 600ms.
- `assets/headshot.webp` was not present, so no face was generated or sourced.
- The footer keeps one compact text control that cycles Clear, Tinted, High Contrast, and Wild and persists the selection.
- The generated header animation, ticker, recommendation carousel, hero button, badges, counters, and decorative gradients were removed from the homepage.
- Writing shows six titles, the pinned Human Agency Design post plus five latest distinct posts. The fallback snapshot remains committed for offline builds.
- The Art page retains the existing eight craft items and keyboard-operable lightbox. It is linked from About and the footer, outside the main navigation.
- Recommendations retain their original wording and attributions, including existing punctuation. No new site copy uses em dashes.
- The footer artwork remains the visual signature and the Open Graph image.
- Old fragment aliases remain handled in `src/js/site.js` because URL fragments cannot be redirected by a server.
- WordPress changes remain limited to the active theme header navigation and shared theme assets. Post content, plugins, database, and other templates are unchanged.

## Verification

The measured before/after inventory, responsive screenshots, motion timings, type audit, reduced-motion result, accessibility checks, and Lighthouse scores are recorded in `docs/round2-audit.md`.
