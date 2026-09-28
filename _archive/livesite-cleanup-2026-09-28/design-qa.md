# Homepage design QA — September 23, 2026

final result: passed

## Visual truth and evidence

- Source: `/Users/vansedita/Sync/2026/09-2026/VSC Redesign 2027/design-01.png` (1440 × 652 PNG).
- Animation source: `/Users/vansedita/Sync/2026/09-2026/VSC Redesign 2027/SVG/wave-animated/wave-05-morph.svg`.
- Implementation: `http://localhost:3000/build/`.
- Final hero: `qa/home-2027/desktop-hero.jpg`.
- Combined comparison: `qa/home-2027/comparison.jpg` (source above, implementation below).
- Desktop CSS viewport: 1440 × 652; devicePixelRatio: 1. The in-app browser exported 1425 × 645 JPEG pixels. The implementation was normalized to 1440 × 652 for the combined comparison.
- State: default Wild theme, menu closed, hero at top. The supplied SVG morph was paused for the capture. Its paths and timing differ from the reference's static wave by design; the user specifically requested Wave 05 Morph.
- Additional evidence: `qa/home-2027/mobile-hero.jpg`, `high-contrast.jpg`, `tinted-dark.jpg`, `mt-feature.jpg`, and `featured-work.jpg`.

## Findings and comparison history

1. First comparison (`desktop-first.jpg`): P2 brand typography/mark mismatch, portrait crop, and wave placement. Reused the existing vector logomark, used a Times italic wordmark and adjusted Georgia headline size/tracking, aligned the portrait crop and vertical spacing, sampled the source cream color, and fitted the supplied wave to the hero.
2. Second comparison: P2 exposed wave endpoints at some morph phases and an overly wide CTA at 320px. Increased horizontal bleed while preserving the wave's vertical footprint, and constrained the CTA to its container. Corrected header line height to retain the 76px total header height.
3. Theme screenshot review: P1 embedded SVG rendered a white canvas under a dark page color scheme. Explicitly set the embedded object's color scheme to light, retaining transparency against each parent theme. Recaptured and visually inspected High Contrast and Tinted dark mode; the white rectangle is gone and the headline is unobscured.
4. Final combined source/implementation comparison: no remaining actionable P0/P1/P2 findings. The hero preserves the reference's navigation, cream/lime palette, centered portrait, large serif headline, bracketed lead, and bordered conversation CTA. Browser typography rasterization, minor text-width differences, and morph-frame differences are acceptable for this implementation of the supplied beginning design.

## Required fidelity surfaces

- **Fonts and typography:** serif hierarchy, italic wordmark, and Open Sans interface/body copy verified. Hero wording matches the source. Headline remains balanced on narrow screens. The exact Figma font metadata was not supplied; Georgia and Times are the visual matches used here.
- **Spacing and layout:** matched the desktop hero's main vertical positions; verified 320, 390, 768, and 1440 CSS pixel widths. No horizontal page overflow. Mobile navigation expands within the page and closes with Escape.
- **Colors and tokens:** default background sampled as `#fffcf3`; lime, peach, and pale-lime accents follow the reference. Clear, Tinted, High Contrast, and Wild all apply distinct palettes. Clear and Tinted were inspected under the host's dark system preference. The SVG stays transparent in dark themes.
- **Image quality:** existing vector brand mark, supplied portrait, and exact Wave 05 source are used. Large M&T and NAMI imagery preserves its aspect ratio. The four featured case images, both portraits, and the AI Lab image loaded successfully in the browser. No fabricated project visuals were introduced.
- **Copy and content:** retained source hero copy and reused Build's career, approach, case-study, and contact copy. No new measured performance claims. The NAMI visual is described as a concept. Featured visual links lead to the existing case studies.

The full-size 1440px comparison makes the header, portrait, headline, lead, and CTA individually readable; separate cropped comparison images were unnecessary. Below-the-fold sections have no supplied visual target and were reviewed for readable hierarchy, image proportions, spacing, and consistency with the hero.

## Functional checks

- Theme selection: all four choices; High Contrast persistence after reload; theme-specific logo; restored Wild for handoff.
- Mobile menu: open, closed, correct expanded state, Escape and focus return.
- Native approach disclosure: expands and displays the associated copy.
- Featured M&T visual: navigates to the existing case-study page, which renders its title and story.
- Wave: browser pause/play state verified. A temporary Node VM behavior check exercised SVG and CSS pause/resume, reduced-motion changes, hidden tabs, and offscreen transitions; all passed. Reduced motion was not toggled at OS level; its static fallback and CSS rule were inspected in code.
- Local links/assets: all 22 local file targets exist; no missing fragment targets or duplicate IDs. HTTP enumeration from the shell was sandbox-blocked; browser rendering and filesystem checks supplied verification instead.
- All four homepage aliases match `selected-home.html`; home-only regeneration completed successfully.
- Wave 05 asset is byte-for-byte identical to the supplied file.
- JavaScript syntax check passed. Browser console error/warning inspection returned none for the homepage.
- Scheduling and email CTAs use the existing Calendly and mailto destinations; no booking or message was submitted.

## Follow-up polish

- Optional P3: match font metadata exactly if the source design's font specifications become available.
- Existing destination pages retain their previously implemented shared styling; this task changes the Build homepage and its aliases.

## Implementation checklist

- [x] Build homepage and aliases updated.
- [x] Exact Wave 05 Morph asset integrated with motion controls.
- [x] Four persistent themes and dark SVG transparency verified.
- [x] Existing career copy and large case-study visuals included.
- [x] Desktop, tablet, mobile, links, disclosures, and assets checked.
- [x] Final source comparison completed; preview left open.
