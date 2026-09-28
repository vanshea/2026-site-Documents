# SEO, accessibility, and mobile preview report

Date: 2026-09-28  
Scope: `/build/` only. No `/livesite/` or design-system files were read or changed.  
Primary-host implementation: `https://vanshea.com`. The second supplied host, `https://humanagencydesign.com`, needs a single-host/redirect decision before release.

## Summary

- Added unique titles, descriptions, canonical links, Open Graph and Twitter metadata, and the icon set to 16 indexable routes. Added noindex policies and metadata to internal demos/previews so they are excluded from search and the sitemap.
- Added Person, Organization, ProfessionalService, WebSite, CreativeWork, and BreadcrumbList JSON-LD where applicable. JSON-LD syntax parses successfully.
- Added `sitemap.xml`, `robots.txt`, and a custom `404.html`; changed `.htaccess` to route missing requests to the new 404 document.
- Kept visible copy, page layout, spacing, and styling unchanged for SEO work. No body-copy or heading wording was rewritten.
- On the Experience page, verified the new résumé URL. The LinkedIn and Resume button labels are visually unreadable in the Wild theme because their foreground and background are both `#171222` (1:1 contrast). The CSS fix is listed for approval below and was not applied, per the brief’s report-only contrast rule.
- Removed the active AI Design preview iframe source at the mobile breakpoint and hid its visual figure. Browser checks: at 390 × 844, the figure is `display:none`, zero-sized, and the iframe has no `src`; at desktop, Self Care, Meeting Coach, Contact, and Partner each load their own local animated prototype, with the figure remaining 678 px high.

## Phase 0 — Discover and baseline

The repository README describes `/build/` as a static HTML/CSS/JS variant served at `http://localhost:3000/build/`, with `npm run build:sync` and `npm run build:bundle` for materialization and packaging. Apache configuration lives in `/build/.htaccess`. The baseline inventory is recorded in [AUDIT.md](AUDIT.md); it captured 46 HTML pages before this SEO pass and documents each page’s baseline title, description, H1, canonical, and visible word count.

Lighthouse could not run in this environment: there is no installed `lighthouse` executable/package, and shell access to the localhost server is blocked. Therefore no baseline or post-change scores are reported for SEO, Performance, Accessibility, or Best Practices. This is an unverified requirement, not a passing score. The existing axe report in `/build/A11Y_REPORT.md` is dated 2026-09-24 and is historical, not a current Lighthouse or full ADA certification.

## Phase 1 — On-page metadata

There are 16 indexable routes in the sitemap. All now have one H1, a self-referencing canonical on `vanshea.com`, a unique title in the 50–60 character range, a description in the 140–160 character range, Open Graph fields, a Twitter large-image card, and `lang`, charset, viewport, favicon, and Apple touch icon tags. Current title and description lengths are in range on all 16 routes.

| Route | Title | Title / description length |
|---|---|---:|
| `/` | Human Agency Design and Service Strategy \| Van Shea Creative | 60 / 156 |
| `/work.html` | Service Design Portfolio & Case Studies \| Van Shea Creative | 59 / 148 |
| `/experience.html` | Design Leadership Experience and Résumé \| Van Shea Creative | 59 / 148 |
| `/case-studies/` | Service Design and UX Case Studies \| Van Shea Creative | 54 / 148 |
| `/case-studies/capital-one-gesture-patent/` | Capital One Gesture Patent Case Study \| Van Shea Creative | 57 / 158 |
| `/case-studies/mt-bank-commercial-banking-transformation/` | M&T Bank Commercial Banking Case Study \| Van Shea Creative | 58 / 144 |
| `/case-studies/nami-delaware-988-campaign/` | NAMI Delaware 988 Campaign Case Study \| Van Shea Creative | 57 / 150 |
| `/case-studies/nyu-curriculum-alignment/` | NYU UX Curriculum Design Case Study \| Van Shea Creative | 55 / 147 |
| `/case-studies/vanguard-innovation-lab-integration/` | Vanguard Voice UX Strategy Case Study \| Van Shea Creative | 57 / 143 |
| `/aidesign/` | Human-Centered AI Design and Prototypes \| Van Shea Creative | 59 / 142 |
| `/aidesign/experiments/` | AI Design and Product Experiments \| Van Shea Creative | 53 / 150 |
| `/aidesign/experiments/stock-performance-test/` | AI Stock Performance Projection Test \| Van Shea Creative | 56 / 151 |
| `/aidesign/share/contact.html` | Contact Design Problem \| AI Design Lab \| Van Shea Creative | 58 / 148 |
| `/aidesign/share/meeting-coach.html` | Meeting Coach Design \| AI Design Lab \| Van Shea Creative | 56 / 148 |
| `/aidesign/share/partner.html` | Partner Design Problem \| AI Design Lab \| Van Shea Creative | 58 / 150 |
| `/aidesign/share/self-care.html` | Self Care Design Problem \| AI Design Lab \| Van Shea Creative | 60 / 149 |

The other HTML documents under `/build/` are internal demos, variants, prototypes, or error handling. They have unique descriptive metadata, canonical URLs, icon metadata, and `noindex,follow`; they are excluded from the sitemap. Their paths should stay internal unless intentionally promoted.

Four 1200 × 630 AI Design share images are suitable OG images and are used on the matching share pages. Other indexable pages currently point at the square portrait asset, which does not meet the requested 1200 × 630 OG-image size. No replacement image was generated. See “Needs Van’s decision.”

## Phase 2 — Content structure and crawl paths

- The 16 indexable routes each have exactly one H1. The source-order heading scan found no skipped heading levels on these routes.
- Public routes contain header, navigation, main, and footer landmarks; all section/case-study routes use section/article landmarks where appropriate.
- No meaningful image in the public route inventory is missing an `alt` attribute.
- Internal local `href`, `src`, and `poster` references on the indexable pages resolve after repairing four missing v2 thumbnail paths on the AI Design Lab listing. Those four expected `*-mobile-thumbnail-v2.png` files are not present under `/build/assets/aidesign/`; the gallery now references the existing originals. The homepage `lab-visual` uses animated HTML prototypes, not PNGs.
- The sitemap includes 16 routes. The home navigation reaches Work, Case Studies, AI Design, and Experience directly; case studies and experiment pages are reachable through those sections. No known public orphan was found in the navigation/content links inspected.
- URLs were not renamed. Internal preview routes are noindex. `.htaccess` previously mapped 404 requests to the homepage; it now names the dedicated `404.html` document.
- The core public page text is in HTML. The AI Design interaction previews are iframe content; at mobile widths the animations are intentionally not loaded.

## Phase 3 — Structured data

Homepage JSON-LD includes Van Shea Sedita (`Person`), Van Shea Creative (`Organization` and `ProfessionalService`), and the site (`WebSite`). It uses the LinkedIn profile already linked on the site as `sameAs`. Each case study has `CreativeWork` and `BreadcrumbList`; work, experience, case-study index, AI Design Lab, and experiments have applicable breadcrumbs. All JSON-LD blocks parse as JSON.

The markup follows Google’s guidance that structured data must describe visible page content and does not guarantee a rich result: [General structured data guidelines](https://developers.google.com/search/docs/appearance/structured-data/sd-policies), [Introduction to structured data](https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data), and [Organization markup](https://developers.google.com/search/docs/appearance/structured-data/organization).

## Phase 4 — Crawlability and indexing

- Created `/build/sitemap.xml` with the 16 canonical, indexable URLs and `lastmod` of 2026-09-28 (the date of this edit).
- Created `/build/robots.txt` allowing crawling and referencing `https://vanshea.com/sitemap.xml`.
- Added `/build/404.html` and updated `/build/.htaccess` to serve it for 404s.
- Added `noindex,follow` metadata to nonpublic HTML previews and demos. The sitemap excludes them.
- Local reference checks covered the public pages and found no unresolved local links/assets after the thumbnail-path correction. HTTP status and deployed Apache behavior remain unverified because localhost curl is blocked and this build was not deployed.

## Phase 5 — Performance and Core Web Vitals

The homepage iframe source is absent at mobile widths and its visual wrapper is hidden; desktop swaps preserve the same 678 px figure height for all four animations. The homepage portrait has explicit dimensions and `fetchpriority="high"`; public images have alt text. Thirteen images on `/work.html`, five on `/case-studies/`, and seven on the NAMI Delaware case study lack explicit width/height attributes. Several are existing portfolio images. No dimensions, responsive image sources, minification, or stylesheet/script loading behavior were changed because Lighthouse and visual CLS measurements were unavailable and the brief prohibits layout changes. Google Fonts URLs already use `display=swap` where declared. Performance targets, LCP, and CLS are not verified.

## Phase 6 — Accessibility overlap

Experience-page buttons were inspected in the Wild theme. The accessible names remain “LinkedIn Profile” and “PDF Resume,” but both links render with text `rgb(23, 18, 34)` on background `rgb(23, 18, 34)`, a contrast ratio of **1.00:1**. The “Copy Text” button retains the light theme text and is readable. In the High Contrast theme, the light-mode blue button with its forced text color is approximately **4.48:1**, just below the 4.5:1 WCAG AA threshold for normal-size text. In Clear, the measured token pair is approximately 19.46:1. Theme contrast needs broader verification with Lighthouse/axe.

The cause is `.agency-site .agency-main a { color: var(--ink) }` overriding the shared `.btn` text color. Suggested correction is `.agency-site .agency-main a.btn { color: var(--btn-text) }`, with an appropriate override for High Contrast if runtime inspection confirms it. This touches visual design, so it is not applied. The historical axe scan is not evidence that the current theme/button cascade passes.

The Resume link in `/build/experience.html` now points to the exact user-supplied Drive URL. The refreshed localhost page exposes that destination in its link target and accessible name.

## Phase 7 — Search intent and copy recommendations (not applied)

These are suggestions only, based on existing site content. No visible copy was rewritten.

| Page | Primary and secondary search intents | Current visible wording | Suggested wording | Rationale |
|---|---|---|---|---|
| Home | Human agency design; design strategy; fractional design leadership | “Leading design to increase human capability.” | “Design strategy that helps leaders make complex services clearer and more human.” | Makes the service and audience clearer while retaining the stated human-capability aim. |
| Work | Service design portfolio; UX strategy; product design | “The work, in practice.” | “Service design, UX strategy, and product work in practice.” | Adds the portfolio topics already represented by the work. |
| Experience | Design leadership; service design; enterprise UX | “Experience” | “Design leadership across service design, enterprise UX, product, AI, and education.” | Summarizes the areas already shown in the experience page. |
| Case studies | Service design case studies; enterprise UX; product transformation | “Case studies” | “Service design and enterprise UX case studies.” | Adds the practice areas demonstrated in the cases. |
| Capital One case | Gesture interface; interaction design; patent | “Capital One, the patent and beyond” | “Capital One gesture-interface patent and interaction design.” | States the existing case topic with recognizable search terms. |
| M&T Bank case | Commercial banking; service blueprint; service design | “M&T Bank commercial banking transformation” | “Commercial banking service design at M&T Bank.” | Names the industry and practice described in the case. |
| NAMI case | 988 campaign; crisis-support communication; service design | “NAMI Delaware 988 campaign” | “NAMI Delaware’s 988 crisis-support campaign.” | Clarifies the campaign’s visible subject. |
| NYU case | UX curriculum; information architecture; design education | “NYU curriculum alignment” | “NYU’s human-centered UX curriculum.” | Surfaces the curriculum’s UX scope already described on the page. |
| Vanguard case | Voice UX; security strategy; client trust | “Vanguard smart-home voice and security strategy” | “Vanguard voice UX strategy for security and client trust.” | Connects the existing voice, security, and trust themes. |
| AI Design Lab | Human-AI interaction; AI product design; responsible UX | “AI Design Lab” | “Human-centered AI design prototypes and experiments.” | Describes the prototypes and experiments shown in the lab. |
| Experiments | AI design experiments; product prototyping; responsible UX | “AI application experiments” | “AI product design and responsible UX experiments.” | Uses the page’s actual comparison topics. |
| Stock test | AI data visualization; stock chart prototype; projection UX | “Stock performance projection test” | “AI stock-chart prototype for projections and uncertainty.” | Names the tested visualization and its uncertainty focus. |
| Contact | Communication design; relationship-centered UX; AI prototype | “Contact: the problem” | “A relationship-centered way to bring communication together.” | Reflects the page’s existing description without adding claims. |
| Meeting Coach | Meeting preparation; meeting UX; AI prototype | “Meeting Coach: the problem” | “A meeting tool for preparation, purpose, and clear next steps.” | Mirrors the prototype’s stated user problem. |
| Partner | Shared decisions; data sharing; consent UX | “Partner: the problem” | “A mutual, revisitable way to coordinate intimate data sharing.” | Reflects the page’s current framing of temporary, mutual sharing. |
| Self Care | Self-care UX; habit support; AI prototype | “Self Care: the problem” | “Small, timely choices that lower the effort of self-care.” | Uses the page’s existing low-friction, timely-support concept. |

## Needs Van’s decision

1. **Production host:** choose whether `humanagencydesign.com` should 301 redirect to `vanshea.com` or become the primary canonical host. Canonicals and sitemap currently use `vanshea.com` only; a page cannot use two preferred canonicals.
2. **OG image:** approve creating a shared 1200 × 630 image for home, work, Experience, case-study, and lab index pages. Those routes currently use the portrait asset because no correctly sized shared image was found.
3. **Experience button contrast:** approve the color-only `.btn` correction described above. In Wild, the two text links currently have 1:1 contrast; High Contrast is borderline at about 4.48:1 in light mode.
4. **Portfolio image dimensions:** approve adding verified width/height attributes and responsive `srcset`/modern-format variants to the 25 existing images identified in Phase 5. This can prevent layout shift but requires checking each source asset and rendition before editing.
5. **Copy recommendations:** review the Phase 7 suggestions before any visible wording is changed.
6. **Unverified Lighthouse and HTTP checks:** run Lighthouse in an environment with the CLI/browser audit available and verify status codes/404 handling against the local Apache server before release.

## Pre-push checklist for `/build/`

- Confirm which host is canonical and configure the other host to redirect to it.
- Check that copied static files retain the sitemap, robots file, and 404 handler at the site root.
- Run Lighthouse SEO, Performance, Accessibility, and Best Practices on all 16 sitemap routes; review the button contrast and image layout-shift findings.
- Validate JSON-LD with Google’s Rich Results Test and Schema.org Validator; confirm the structured facts match visible page content.
- Submit `https://vanshea.com/sitemap.xml` in Google Search Console and inspect indexing/canonical reports.
- Preview Open Graph cards; supply approved 1200 × 630 images where needed.
- Verify redirects and a real 404 response on the production-like host before any later promotion.

No deployment or copy to `/livesite/` was performed.
