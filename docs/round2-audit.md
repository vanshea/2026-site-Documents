# Round 2 audit

Audited on 2026-09-21 at 1440 × 1000 and 390 × 844. The local source was `http://127.0.0.1:4174/`; the interaction reference was `https://austinknight.com/`. The audit records computed browser output. It does not copy reference assets, text, fonts, or colors.

## Before

### Homepage inventory above Contact

The visible semantic-element count was **47 at 1440px** and **43 at 390px**. The count includes visible `header`, `nav`, `section`, heading, paragraph, link, button, image, list, article, form, label, input, textarea, rule, and blockquote elements whose top edge appeared before Contact. It excludes layout-only wrappers and hidden carousel slides.

Distinct content and controls were:

- Header: logo mark, identity text, and six navigation links.
- Hero: positioning label, multi-part headline, subhead, primary CTA, arrow, supporting captions, and scroll cue.
- Pillar ticker: four pillar names, separators, duplicated track, and pause control.
- Who I work with: section label, heading, three buyer statements, and closing statement.
- How I work: section label, heading, guide-and-solve paragraph, and four numbered pillar rows.
- Engagement: section label and engagement statement.
- Work: section label, heading, and four project rows. Each row included its number, organization, category, outcome, year, arrow, and optional preview.
- Experiments: section label, heading, introduction, lab link, and five experiment cards with label, title, arrow, and description.
- Writing: section label, heading, eight linked titles, and slash separators.
- Recommendations: section label, heading, quote, attribution, counter, previous/next controls, and autoplay state. Additional quotes remained in the carousel DOM.

The reference measured **227 semantic elements at 1440px** and **127 at 390px** before its “Let's build together” section under the same selector rule. Its count is higher because its pre-contact page also includes podcasts, a long essay list, a company-logo reel, and speaking and field-research content. This comparison drove a reduction in the local page, not an attempt to reproduce the reference's section count.

### Computed type inventory

The local desktop page used three families, Open Sans, Space Grotesk, and Lexend Deca, with these computed sizes: **11, 12, 13, 14, 15, 16, 20, 20.8, 21, 23.2, 24, 25, 26.4, 28, 29.6, 32, 48.96, 68, 72, and 120px**. Its computed weights were **400, 500, and 600**.

At 390px it used the same three families, sizes **10, 11, 12, 13, 14, 15, 16, 17.6, 18, 19.2, 20, 21, 22, 22.4, 23, 24, 25, 32, 35.2, 58.5, and 68px**, and weights **400, 500, and 600**.

The reference desktop page used computed sizes **10, 12, 14, 15, 16, 18, 20, 22, 24, 35, 55, and 88px** and weights **300, 400, 600, and 700**. At 390px it used **12, 14, 16, 18, 22, 24, 34, 36, 44, and 55px** and weights **300, 400, and 600**. These values describe the live reference and were not imported.

### Reference hero motion

Frame capture and Web Animations API instrumentation showed two treatments:

1. The ordinary words begin blurred at `blur(30px)` and nearly transparent at opacity `0.001`. Both filter and opacity resolve to their final values over **1600ms** using a spring-like sampled `linear(...)` easing. At intermediate frames the blur falls quickly while opacity settles progressively, producing a soft-focus arrival rather than a simple linear fade.
2. The emphasized verbs `lead` and `design` use duplicated text nodes in stacked wrappers. Their directly observed animation is opacity `0.001` to `1` over **600ms**, with `cubic-bezier(0.44, 0, 0.56, 1)`. The surrounding clipped stack creates the vertical swap impression.
3. The hero groups are clipped by line-level masks so entering text does not show outside its line. Earlier transition layers move the group upward into place, after which the shorter emphasized-word transition settles.

The redesign uses the prompt's specified masked vertical entrance while retaining the measured pacing: each line moves from `translateY(100%)` to `0` over **1000ms**, staggered **120ms**; `guide` and `design` roll one full line over **600ms** with the reference's observed cubic-bezier. The subhead fades in after the final line lands.

### Reference portrait treatment

The reference's portrait reel is centered within the hero rather than attached to the navigation identity. At 1440px the rendered frames measured about **107 × 80px** and centered near x=720; at 390px they measured about **86 × 65px** and remained centered. The source portrait is square but rendered in an approximately 4:3 frame with `object-fit: cover`, so the crop stays tight on the head and shoulders. The page alternates stacked frames vertically. Van's requested treatment is deliberately quieter: a 48px desktop and 40px mobile circle in the header.

## After

### Structure and element count

The final page order is Header, Hero, Work, Writing, Experiments, Contact, and Footer. No homepage sections were added.

- **1440px:** 31 semantic elements before Contact, down from 47.
- **390px:** 28 semantic elements before Contact, down from 43.
- **Reference:** 227 and 127 under the same counting rule.

The final page is well below the requested ceiling of 1.5 times the reference count. Outside the hero, essay titles, and contact line, only one homepage sentence remains: the Experiments line.

### Type system

Computed visible homepage type at 1440px:

- Family: **Space Grotesk**
- Sizes: **12px, 18px, 63.36px**
- Weights: **400, 600**

Computed visible homepage type at 390px:

- Family: **Space Grotesk**
- Sizes: **12px, 18px, 48px**
- Weights: **400, 600**

These are the viewport-resolved values of `--type-label`, `--type-body`, and `--type-display`. All homepage size and weight declarations use those five tokens.

### Responsive and motion evidence

- [1440px hero, mid-animation](round2-screenshots/hero-1440-mid.png)
- [1440px hero, landed](round2-screenshots/hero-1440-landed.png)
- [390px hero, mid-animation](round2-screenshots/hero-390-mid.png)
- [390px hero, landed](round2-screenshots/hero-390-landed.png)
- [1440px full homepage](round2-screenshots/homepage-1440.png)
- [390px full homepage](round2-screenshots/homepage-390.png)

Both widths have zero horizontal overflow. The header placeholder measures 48 × 48px on desktop and 40 × 40px on mobile. The mobile hero wraps into the requested short stacked lines.

With `prefers-reduced-motion: reduce`, the browser reported zero running animations after load. All hero lines and the subhead were fully opaque in their final state, section reveals were immediate, and transitions were disabled.

### Quality checks

Lighthouse mobile results:

- Performance: **99**
- Accessibility: **100**
- Best Practices: **100**
- SEO: **100**

An independent axe scan at both 1440px and 390px reported zero violations. The Art lightbox opened from its link, closed with Escape, and returned focus to its opener. The local build completed in live WordPress mode and in deterministic offline-fallback mode.
