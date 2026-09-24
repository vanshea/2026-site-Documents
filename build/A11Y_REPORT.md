# Accessibility report, staging Build

Date: 24 September 2026. Scope: 28 navigable HTML pages under `/build/`; asset snapshots inside `/build/assets/` were treated as embedded resources, not separate site routes. The Blog and its linked content were not changed.

Axe-core ran in headless Chrome at 1360 × 900 with the WCAG 2 A/AA, 2.1 A/AA, and 2.2 AA rule tags. Each table cell is **before → after** for the number of automated rule violations on that page in that theme, not a count of affected elements. The initial scan produced 25 page/theme rule violations; the final scan produced zero. An additional dark operating-system preference scan produced zero violations in all 112 page/theme combinations. Zero automated violations is not a WCAG conformance claim.

| Page | Clear | Tinted | High Contrast | Wild |
|---|---:|---:|---:|---:|
| `/build/aidesign/Contact Prototype (standalone).html` | 0 → 0 | 0 → 0 | 0 → 0 | 0 → 0 |
| `/build/aidesign/experiments/index.html` | 1 → 0 | 1 → 0 | 1 → 0 | 1 → 0 |
| `/build/aidesign/experiments/stock-performance-test/index.html` | 1 → 0 | 0 → 0 | 0 → 0 | 0 → 0 |
| `/build/aidesign/index.html` | 1 → 0 | 1 → 0 | 0 → 0 | 1 → 0 |
| `/build/aidesign/index/index.html` | 1 → 0 | 1 → 0 | 0 → 0 | 1 → 0 |
| `/build/aidesign/meeting_coach.html` | 0 → 0 | 0 → 0 | 0 → 0 | 0 → 0 |
| `/build/aidesign/meeting_coach_demo.html` | 0 → 0 | 0 → 0 | 0 → 0 | 0 → 0 |
| `/build/aidesign/partner.html` | 0 → 0 | 0 → 0 | 0 → 0 | 0 → 0 |
| `/build/aidesign/partner_fullscreen.html` | 0 → 0 | 0 → 0 | 0 → 0 | 0 → 0 |
| `/build/aidesign/self_care.html` | 0 → 0 | 0 → 0 | 0 → 0 | 0 → 0 |
| `/build/aidesign/share/contact.html` | 0 → 0 | 0 → 0 | 0 → 0 | 0 → 0 |
| `/build/aidesign/share/meeting-coach.html` | 0 → 0 | 0 → 0 | 0 → 0 | 0 → 0 |
| `/build/aidesign/share/partner.html` | 0 → 0 | 0 → 0 | 0 → 0 | 0 → 0 |
| `/build/aidesign/share/self-care.html` | 0 → 0 | 0 → 0 | 0 → 0 | 0 → 0 |
| `/build/case-studies/capital-one-gesture-patent/index.html` | 0 → 0 | 0 → 0 | 0 → 0 | 0 → 0 |
| `/build/case-studies/index.html` | 0 → 0 | 0 → 0 | 0 → 0 | 0 → 0 |
| `/build/case-studies/mt-bank-commercial-banking-transformation/index.html` | 0 → 0 | 0 → 0 | 0 → 0 | 0 → 0 |
| `/build/case-studies/nami-delaware-988-campaign/index.html` | 1 → 0 | 1 → 0 | 1 → 0 | 1 → 0 |
| `/build/case-studies/nyu-curriculum-alignment/index.html` | 0 → 0 | 0 → 0 | 0 → 0 | 0 → 0 |
| `/build/case-studies/vanguard-innovation-lab-integration/index.html` | 0 → 0 | 0 → 0 | 0 → 0 | 0 → 0 |
| `/build/experience.html` | 1 → 0 | 1 → 0 | 0 → 0 | 0 → 0 |
| `/build/home-2.html` | 0 → 0 | 0 → 0 | 0 → 0 | 0 → 0 |
| `/build/home-3.html` | 0 → 0 | 0 → 0 | 0 → 0 | 0 → 0 |
| `/build/home.html` | 0 → 0 | 0 → 0 | 0 → 0 | 0 → 0 |
| `/build/index.html` | 0 → 0 | 0 → 0 | 0 → 0 | 0 → 0 |
| `/build/macos26-slider/index.html` | 0 → 0 | 0 → 0 | 0 → 0 | 0 → 0 |
| `/build/nft-prototype.html` | 0 → 0 | 0 → 0 | 0 → 0 | 0 → 0 |
| `/build/work.html` | 2 → 0 | 2 → 0 | 2 → 0 | 2 → 0 |

The baseline rule types were `color-contrast` (13 page/theme instances), `aria-hidden-focus` (8), and `aria-allowed-attr` (4). The final scan also cleared the indeterminate `aria-prohibited-attr` checks by using semantic groups or removing unsupported labels.

## Interaction and structural checks

- Every navigable page has one H1, one `main#main`, `lang="en"`, a unique document title, a first-focusable skip link, and a current-page navigation marker. The Home previews now use the selected Home content.
- The theme switcher is a labeled native radio group; its selection persists after reload. Header logos have accessible link names, decorative waves are hidden from assistive technology, and new-tab links announce that behavior.
- A mobile keyboard smoke test confirmed menu open/close with Escape and focus return, Work and NAMI dialog open/close with Escape and focus return, inline required-field errors, the Meeting Coach deep link, and ten Home FAQ disclosures. Home mobile targets measured at least 24 × 24 CSS pixels after enlarging text links and radio controls; the radio labels are at least 44 pixels high.
- A static crawl of navigable HTML found no missing local assets or root links that leave `/build/`. Directory URLs now have trailing slashes.

## Remaining launch checks

1. **Prerecorded video captions:** M&T Bank and Capital One videos contain audio and do not yet have verified caption files. The Vanguard video has no audio track. All three already expose controls and do not autoplay; concise project summaries were added nearby. Accurate timed captions for the two audio videos require a transcript or review of the audio before release. Axe marks `video-caption` as needing review on the three video pages, rather than a pass.
2. **Résumé PDF:** The Experience link identifies the PDF file type, but the document is hosted on Google Drive. Its tagging and file size were not verified from the staging source.
3. **Inquiry receipt:** Client-side required-field validation and submission code were checked. The Google Form request uses `no-cors`, which gives the browser an opaque response, so a browser success state cannot prove that Google recorded a submission. A controlled end-to-end receipt check remains necessary before launch.
4. **Embedded content and visual review:** Axe returned indeterminate color-contrast checks where backgrounds are covered by artwork or pseudo-elements; the visual screenshots were reviewed, and control boundaries and focus outlines were strengthened, but every visual state and embedded prototype or patent iframe still needs a manual assistive-technology review.

## “Verify” items that were already sound

- `M&amp;T` is HTML encoding in source and renders as “M&T”; no literal `&amp;` is displayed.
- The case-study index already had image alternatives, including “Capital One logo.”
- The case-study links already stayed under `/build/`; the real URL issue was missing trailing slashes on directory links.
- Home testimonials are static and do not truncate or auto-advance. The Work recommendations carousel is manually controlled, with labeled previous and next buttons.
- The case-study videos already had visible controls and no sound autoplay.

## Reproduction

The scan data are in `build/qa/axe-before.json`, `build/qa/axe-final.json`, and `build/qa/axe-dark.json`; keyboard results are in `build/qa/smoke.json`. The local runners are `build/qa/run-axe.mjs` and `build/qa/run-smoke.mjs`. They require Chrome, Node.js, axe-core, and puppeteer-core; set `VSC_A11Y_DEPS` to the Node module directory if it differs from the local test environment.
