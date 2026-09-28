# SEO and Accessibility Audit — Baseline

Date: 2026-09-28. Scope: the static HTML tree under `/build/` before this task’s changes. Enumerated **46 HTML files**; all are listed below, including demos and embedded prototypes. Public-route eligibility will be decided separately for the sitemap.

## Stack and local delivery

- Static HTML/CSS/JavaScript. No page framework or page-build pipeline is used for `/build/`; the tree includes a few preview variants and standalone prototype documents.
- `/build/README.md` documents the preview at `http://localhost:3000/build/` and scripts to sync/bundle a static build. `.htaccess` uses `DirectoryIndex index.html`, redirects a few legacy routes, and currently maps 404s back to `/index.html` (the homepage).
- The existing in-app browser opened the localhost preview. A shell `curl` to port 3000 was blocked in this environment, so HTTP response headers/statuses could not be inspected from the command line.

## Baseline audit tools and limits

- Lighthouse baseline was requested but could not be run: no `lighthouse` executable is installed, and shell access to the localhost server is blocked. No Lighthouse score is fabricated; performance, SEO, Accessibility, and Best Practices baselines are therefore **not captured** for any route.
- Existing `/build/A11Y_REPORT.md` documents an axe-core scan of 28 navigable HTML pages on 2026-09-24, including 112 page/theme combinations with zero automated violations after fixes. It is historical evidence, not a fresh baseline for this task.
- Word count is visible text in each HTML file, excluding `head`, `script`, `style`, and `noscript`; script-rendered prototype pages can therefore report zero.

Baseline metadata gaps across these 46 files: **0** missing titles, **24** missing descriptions, **41** missing canonicals, **14** missing H1s, and **4** pages with multiple H1 text groups.

## Page inventory (baseline)

| HTML file / route | Title | Meta description | H1 | Canonical | Words |
|---|---|---|---|---|---:|
| `/aidesign/Contact Prototype (standalone).html` | Contact \| Van Shea Creative | — | Contact | — | 47 |
| `/aidesign/experiments/index.html` | AI Design Lab Experiments \| Van Shea Creative | A running index of AI application experiments comparing platform output, UX judgment, code quality, and responsible product thinking. | AI application experiments | — | 236 |
| `/aidesign/experiments/stock-performance-test/index.html` | Stock Performance Projection Test \| AI Design Lab \| Van Shea Creative Stock performance chart | A financial visualization prototype that compares how AI platforms handle market data, charts, projections, uncertainty, and responsible UX language. | Stock performance projection test | — | 844 |
| `/aidesign/index/index.html` | AI Design Lab alternate route \| Van Shea Creative | Practical experiments comparing how AI coding platforms approach design, product thinking, data, and responsible UX. | AI Design Lab | — | 1064 |
| `/aidesign/index.html` | AI Design Lab \| Van Shea Creative | Practical experiments comparing how AI coding platforms approach design, product thinking, data, and responsible UX. | AI Design Lab | — | 1064 |
| `/aidesign/meeting_coach.html` | Meeting Coach Prototype \| Van Shea Creative | — | Meeting Coach prototype | — | 49 |
| `/aidesign/meeting_coach_demo.html` | Meeting Coach Demo \| Van Shea Creative | — | Meeting Coach demo | — | 49 |
| `/aidesign/partner.html` | Partner \| Van Shea Creative | — | Partner | — | 47 |
| `/aidesign/partner_fullscreen.html` | Partner, full-screen test \| Van Shea Creative | — | Partner, full-screen test | — | 49 |
| `/aidesign/self_care.html` | Self Care \| Van Shea Creative | — | Self Care | — | 48 |
| `/aidesign/share/contact.html` | Contact: the problem \| AI Design Lab \| Van Shea Creative | — | Contact: the problem \| AI Design Lab | — | 52 |
| `/aidesign/share/meeting-coach.html` | Meeting Coach: the problem \| AI Design Lab \| Van Shea Creative | — | Meeting Coach: the problem \| AI Design Lab | — | 53 |
| `/aidesign/share/partner.html` | Partner: the problem \| AI Design Lab \| Van Shea Creative | — | Partner: the problem \| AI Design Lab | — | 52 |
| `/aidesign/share/self-care.html` | Self Care: the problem \| AI Design Lab \| Van Shea Creative | — | Self Care: the problem \| AI Design Lab | — | 53 |
| `/assets/aidesign/prototypes/contact/index.html` | Pulse Chat Icon, Apple-inspired | — | — | — | 0 |
| `/assets/aidesign/prototypes/meeting-coach/index.html` | Controls, Apple-inspired | — | — | — | 0 |
| `/assets/aidesign/prototypes/partner/index.html` | Overlap, Apple-inspired | — | — | — | 0 |
| `/assets/aidesign/prototypes/self-care/index.html` | Mind and Heart, Apple-inspired | — | — | — | 0 |
| `/assets/embeds/us20220261083a1.html` | US20220261083A1 - Gesture-based user interface | — | US20220261083A1 | — | 167 |
| `/assets/home-2027/demos/aidesign--Contact Prototype (standalone).html` | Bundled Page | — | — | — | 1 |
| `/assets/home-2027/demos/aidesign--meeting_coach.html` | Meeting Coach Prototype | — | — | — | 0 |
| `/assets/home-2027/demos/aidesign--meeting_coach_demo.html` | Bundled Page | — | — | — | 1 |
| `/assets/home-2027/demos/aidesign--partner.html` | Bundled Page | — | — | — | 1 |
| `/assets/home-2027/demos/aidesign--partner_fullscreen.html` | Partner — Full-screen test | — | — | — | 0 |
| `/assets/home-2027/demos/aidesign--self_care.html` | Bundled Page | — | — | — | 2 |
| `/assets/home-2027/demos/aidesign--share--contact.html` | Contact — The Problem \| AI Design Lab | Contact collapses fragmented communication channels into one relationship-centered layer that prioritizes people over platforms. | — | https://www.vanshea.com/aidesign/share/contact.html | 7 |
| `/assets/home-2027/demos/aidesign--share--meeting-coach.html` | Meeting Coach — The Problem \| AI Design Lab | Meeting Coach helps people arrive prepared, stay oriented to purpose, and leave meetings with clarity on what happens next. | — | https://www.vanshea.com/aidesign/share/meeting-coach.html | 8 |
| `/assets/home-2027/demos/aidesign--share--partner.html` | Partner — The Problem \| AI Design Lab | Partner makes intimate data-sharing temporary, visible, coordinated, revisitable, and mutual. | — | https://www.vanshea.com/aidesign/share/partner.html | 7 |
| `/assets/home-2027/demos/aidesign--share--self-care.html` | Self Care — The Problem \| AI Design Lab | Self Care lowers the decision cost of caring for yourself with timely nudges and low-friction choices when willpower is already thin. | — | https://www.vanshea.com/aidesign/share/self-care.html | 8 |
| `/assets/home-2027/demos/macos26-slider--index.html` | Liquid Theme Slider | A macOS 26-inspired liquid glass theme slider with four visual themes. | Clear Glass | — | 23 |
| `/assets/home-2027/demos/nft-prototype.html` | On-chain SVG NFT Prototype | — | Build the composition | — | 44 |
| `/assets/home-2027/selected-home.html` | Van Shea Creative \| Human Agency Design | I guide leaders and design experiences to increase human capability. Explore Van Shea Sedita’s work in service design, strategy, emerging technology, and education. | Human Agency Design * | — | 972 |
| `/case-studies/capital-one-gesture-patent/index.html` | Capital One: The Patent and Beyond \| Case Study \| Van Shea Creative | Testing showed that customers struggled with too many screens. Van assembled a small team, led the prototype, and helped develop the concept into a patent. | Capital One, the patent and beyond | — | 358 |
| `/case-studies/index.html` | Case Studies \| Van Shea Creative | UX, service design, strategy, and product case studies from Van Shea Creative. | Case studies | — | 336 |
| `/case-studies/mt-bank-commercial-banking-transformation/index.html` | M&T Bank Commercial Banking Transformation \| Case Study \| Van Shea Creative | Fragmented processes and repeated handoffs created friction and waste. Van turned research and journey maps into a service blueprint for commercial lending. | M&T Bank commercial banking transformation | — | 376 |
| `/case-studies/nami-delaware-988-campaign/index.html` | NAMI Delaware 988 Campaign \| Case Study \| Van Shea Creative | A public-awareness campaign and service design challenge for NAMI Delaware: making pathways to crisis support easier to understand through plain language, distinct visual cues, and consistent messaging across outdoor, print, and mobile touchpoints. | NAMI Delaware 988 campaign | — | 707 |
| `/case-studies/nyu-curriculum-alignment/index.html` | NYU Curriculum Alignment \| Case Study \| Van Shea Creative | Van expanded NYU’s information architecture curriculum beyond classification methods into a broader human-centered UX process. | NYU curriculum alignment | — | 325 |
| `/case-studies/vanguard-innovation-lab-integration/index.html` | Vanguard Smart Home Voice & Security Strategy \| Case Study \| Van Shea Creative | Vanguard needed a voice-interface strategy that protected client trust. Van led research and prototypes connecting security concepts to business needs, analytics, and legacy systems. | Vanguard smart-home voice and security strategy | — | 337 |
| `/experience.html` | Experience \| Van Shea Sedita | Professional experience and resume details for Van Shea Sedita. | Van Shea Sedita | — | 640 |
| `/home-2.html` | Home preview 2 \| Van Shea Creative | I guide leaders and design experiences to increase human capability. Explore Van Shea Sedita’s work in service design, strategy, emerging technology, and education. | Human Agency Design * | — | 1355 |
| `/home-3.html` | Home preview 3 \| Van Shea Creative | I guide leaders and design experiences to increase human capability. Explore Van Shea Sedita’s work in service design, strategy, emerging technology, and education. | Human Agency Design * | — | 1355 |
| `/home.html` | Home preview \| Van Shea Creative | I guide leaders and design experiences to increase human capability. Explore Van Shea Sedita’s work in service design, strategy, emerging technology, and education. | Human Agency Design * | — | 1355 |
| `/index.html` | Van Shea Creative \| Human Agency Design | I guide leaders and design experiences to increase human capability. Explore Van Shea Sedita’s work in service design, strategy, emerging technology, and education. | Human Agency Design * | — | 1355 |
| `/macos26-slider/index.html` | Liquid Theme Slider \| Van Shea Creative | — | Liquid theme slider | — | 49 |
| `/nft-prototype.html` | On-chain SVG NFT Prototype \| Van Shea Creative | — | On-chain SVG NFT prototype | — | 50 |
| `/work.html` | Van Shea Sedita \| Design Portfolio | Branding, UX, service design, education, and illustration work by Van Shea Sedita. | Work | https://vanshea.com/work.html | 443 |

## Initial findings to resolve

- Many public pages lack self-referencing canonicals and consistent Open Graph/Twitter metadata; some page titles/descriptions are generic or absent.
- Several standalone experiment/design exports are publicly reachable from the static tree and have no canonical/noindex policy. They should not be in the sitemap unless intentionally promoted.
- The requested canonical domain choice is ambiguous because two production hosts were supplied. A single preferred host is needed to avoid duplicate canonical identities; the baseline and proposed edits use `https://vanshea.com` as primary and flag the treatment of `https://humanagencydesign.com` for decision.
- Existing missing/duplicate heading and title issues, image alt coverage, internal-link depth, broken paths, page status codes, JavaScript dependency, and responsive performance need deeper crawl checks.
- The Experience page currently links to an older Google Drive resume URL. Theme colors/buttons need current page review in addition to automated contrast checks.
- `/build/` has no `404.html`; `.htaccess` currently serves the homepage for missing paths, which can mask 404s as soft-404s.

## Baseline evidence

- Current route inventory was extracted from the 46 `.html` files under `/build/` and source content at this commit/worktree state.
- Lighthouse scores: unavailable for the tooling/environment reasons above.
- No files outside `/build/` were read or changed for this audit.
