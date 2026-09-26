# vanshea.com — Senior UX / Front-End Audit & Improvement Plan

**Audited:** 2026-07-13 · Source: `/Library/WebServer/Documents` (index.html, styles.css 3,516 lines, script.js 1,754 lines, analytics.js, experience.html, case-studies/\*, assets) **Standard:** WCAG 2.1 AA (with WCAG 2.2 notes) · Contrast ratios below were computed, not estimated. **Scope note:** `/blog` is WordPress and `server.js`/Prisma were not audited. No code was changed.

## **Instructions for Codex**

1. Work only in the repo root. Do **not** modify `livesite/`, `backups/`, `node_modules/`, `blog/`, `comingsoon/`.  
2. Fix in priority order: P0 → P1 → P2. Each item lists file:line as of this audit.  
3. The site has 4 themes (`theme1`–`theme4` on `<html data-theme>`) and each also responds to `prefers-color-scheme`. **Test every fix in all 4 themes × light/dark OS setting.** Default theme is `theme4` ("Wild").  
4. After changes, run the Verification Checklist at the end.  
5. Preserve the visual design language (especially theme4 neubrutalism) unless an item explicitly says otherwise.

---

## **P0 — Critical (fix first)**

### **P0-1 · Illegible button in default "Clear" theme \+ dark mode — contrast 1.72:1**

**WCAG 1.4.3 (Critical)** · `styles.css:90–91` In theme1 dark mode, `--btn-bg: #64d2ff` with `--btn-text: #ffffff` → **1.72:1**. Every `.btn` (Send Inquiry, Load More, Copy Text) is nearly invisible white-on-pale-cyan. **Fix:** in the theme1 `@media (prefers-color-scheme: dark)` block set `--btn-text: #050b16` (measures 11.45:1). Check `--btn-hover-shadow` still reads.

### **P0-2 · Button/status contrast failures in themes 1 & 2 (light)**

**WCAG 1.4.3 (Critical)** · `styles.css:38` (theme1), `styles.css:145` (theme2), `styles.css:56` / status vars Measured (button text is \~16px bold → 4.5:1 required):

| Element | Fg / Bg | Ratio | Required | Pass |
| :---- | :---- | :---- | :---- | :---- |
| theme1 `.btn` | \#ffffff / \#0a84ff | 3.65:1 | 4.5:1 | ❌ |
| theme1 dark `.btn` | \#ffffff / \#64d2ff | 1.72:1 | 4.5:1 | ❌ |
| theme2 `.btn` | \#ffffff / \#bf5af2 | 3.52:1 | 4.5:1 | ❌ |
| theme1 form success `--status-success` | \#248a3d / \#eef7ff | 4.06:1 | 4.5:1 | ❌ |
| theme1 focus ring (non-text) | \#0a84ff / \#eef7ff | 3.37:1 | 3:1 | ✅ |
| theme4 body copy | \#34293d / \#f7f2e8 | 12.3:1 | 4.5:1 | ✅ |
| theme4 card hover title | \#0b0710 / \#ff3d00 | 5.63:1 | 4.5:1 | ✅ |
| theme4 `.btn` | \#ffffff / \#0b0710 | 19.96:1 | 4.5:1 | ✅ |

**Fix:** darken `--btn-bg` (theme1 → \~`#0066cc` or darker; theme2 → \~`#9a34d4` or darker) or switch `--btn-text` to a near-black; darken `--status-success` (e.g. `#1d7434`). Verify each result ≥ 4.5:1 with a contrast checker before committing.

### **P0-3 · Lightbox is not an accessible dialog**

**WCAG 2.1.1, 2.4.3, 4.1.2 (Critical)** · `index.html:653–691`, `script.js:1575–1615` Problems, in order of severity:

1. When closed, `#lightbox` has `aria-hidden="true"` but its 4 buttons remain keyboard-focusable (CSS only sets `opacity:0; pointer-events:none`). Keyboard users tab into invisible controls — this is the axe `aria-hidden-focus` violation.  
2. No `role="dialog"`, no `aria-modal="true"`.  
3. On open, focus is not moved into the dialog; on close, focus is not returned to the triggering card; Tab is not trapped, so keyboard users escape into the page behind the overlay.

**Fix:** add `role="dialog" aria-modal="true" aria-label="Image viewer"` to `#lightbox`; use the `inert` attribute (or `hidden`) when closed instead of relying on opacity; in `openLightbox()` save `document.activeElement`, focus `#lightboxClose`, trap Tab within the dialog; in `closeLightbox()` restore focus. Same treatment pattern applies to nothing else on the page (consent banner is non-modal — see P2-6).

### **P0-4 · Production hygiene: secrets and dumps inside the Apache docroot**

**Security (Critical if this root ever serves production — your `CLEANUP BEFORE GOING LIVE.rtf` suggests you know)** Sitting in the web-served root: `.env`, `.env.example`, `postgres_dump_20260218_081301.sql`, `.git/`, `node_modules/`, `backups/`, `livesite-5-3-2026.zip`, `github-test.txt`, `Untitled.rtf`, `index.html.en`, `package-lock.json`, `prisma/`, `server.js`, `views/`, `data/`, `docs/`, `scripts/`. **Fix:** move server code and data out of the docroot (or deploy only a built `public/` folder); at minimum add Apache deny rules for `.env*`, `.git`, `*.sql`, `*.zip`, `backups/`, `node_modules/`. Never keep a DB dump under a docroot.

---

## **P1 — Major (ADA \+ structure)**

### **P1-1 · No skip link**

**WCAG 2.4.1** · `index.html` (all pages) Keyboard users must tab through brand, nav, and the theme slider on every page. **Fix:** first element in `<body>`: `<a class="skip-link" href="#top">Skip to content</a>`, visually hidden until focused. Add to all page templates.

### **P1-2 · "Selected Work" heading removed from the accessibility tree**

**WCAG 1.3.1 / 2.4.6** · `styles.css:751–753` (`.work .section-head h2 { display: none; }`) `display:none` hides the h2 from screen readers too, so all 12 card `<h3>`s dangle directly under the `<h1>`. **Fix:** replace `display:none` with the existing `.sr-only` utility (`index.html` already defines it) on the h2, or restyle it visibly.

### **P1-3 · Hero subtitle is an `<h3>`**

**WCAG 1.3.1** · `index.html:135` `<h3 class="lead">` skips h2 and marks a paragraph as a heading. **Fix:** change to `<p class="lead">` (CSS targets `.lead`, so styling is unaffected).

### **P1-4 · Broken tab semantics on Corporate/Independent filter**

**WCAG 4.1.2** · `index.html:145–152`, `script.js:1166–1172` (`syncWorkTypeTabs`) `role="tab"` buttons have no `aria-controls`, the grid has no `role="tabpanel"`, both tabs stay in the tab order (no roving `tabindex`), and JS adds `aria-pressed` — an invalid attribute on `role="tab"`. **Fix (recommended, simpler):** drop `role="tablist"/"tab"` and `aria-selected`; make them plain toggle buttons with only `aria-pressed`. The arrow-key handler (`script.js:1283–1305`) can stay. Alternatively implement the full tab pattern — but this is a filter, not true tabs.

### **P1-5 · Placeholder jargon in screen-reader-facing alt text**

**WCAG 1.1.1** · `script.js` `renderLightboxImage` (\~line 1560): `alt = "Large FPO image for ${title}"` "FPO" (for-placement-only) leaks internal jargon to every lightbox image announcement. Card thumbs use "Preview image for X" — "image" is redundant in alt. **Fix:** lightbox alt \= the work title; card alt \= the title alone or a real description. Also fill the empty `data-lightbox-description` attributes (M\&T, Vanguard, NYU, Fluid, Greif Catalog) — they become the visible caption.

### **P1-6 · Experience page is orphaned**

**IA / navigation (Major design issue)** · `experience.html`; nav blocks in `index.html:122–127` and all case-study pages No page links to `experience.html` — your resume, impact metrics, and case-study cross-links are unreachable by browsing. Also inconsistent: index nav \= Work / Case Studies / AIdesign / Blog; other pages omit AIdesign; experience.html defaults to `data-theme="theme2"` while every other page defaults to theme4, and its footer has different theme names ("Basic Theme"/"Pro Theme") plus a Resume link *inside* the "Choose site theme" group (`experience.html:~250–280`). **Fix:** add "Experience" (or "About") to the shared nav on all pages; unify nav items, default theme, and theme-switcher labels site-wide; move the Resume link out of the theme-switcher group.

### **P1-7 · No "Contact" path in navigation**

**Design (Major)** · `index.html:122–127` The inquiry form is the site's conversion goal but is only discoverable by scrolling past everything. The hero has no CTA. **Fix:** add `<a href="#contact">Contact</a>` to the nav and a hero CTA button (e.g. "Start a project") linking to `#contact`.

### **P1-8 · Case-study pages missing canonical/OG metadata**

**SEO** · e.g. `case-studies/capital-one-gesture-patent/index.html` head (0 `og:` tags; index.html has a full set) **Fix:** add per-page `<link rel="canonical">`, `og:title/description/image/url`, and twitter tags using each case study's hero image.

### **P1-9 · Form submission can report false success**

**Code quality / honesty** · `script.js:830–850` (`submitToGoogleForm`, `mode: "no-cors"`) Opaque no-cors responses always "succeed," so "Thanks. Your inquiry was sent." can show when Google rejected the post. You already run an Express server (`server.js`). **Fix:** post to a first-party endpoint (or a form service) that returns a real status; keep the Google Form link as fallback. Also add per-field errors with `aria-invalid` \+ `aria-describedby` instead of only the global status line (WCAG 3.3.1).

### **P1-10 · Case-study video lacks captions**

**WCAG 1.2.2** · `case-studies/capital-one-gesture-patent/index.html:~140` (`capital-one-samples.mp4`, 32.7 MB) If the video contains speech, it needs a `<track kind="captions">`; if it's silent/visual-only, state that in the accessible name. **Fix:** add a WebVTT captions track or `aria-label="Silent demo video: …"` as appropriate. Also re-encode — 32.7 MB is heavy (target \< 8–10 MB at 1080p, or provide an HLS/streaming source).

---

## **P2 — Performance & code efficiency**

### **P2-1 · 1.72 MB footer image on every page**

`assets/footer-art/site-footer-rev-sm.png` (1,756,710 bytes, 1800×1973) is loaded on index, case-study index, and detail pages. `loading="lazy"` helps but most visitors who reach the footer still pull \~1.7 MB. **Fix:** generate AVIF/WebP renditions with `srcset` (e.g. 720w/1200w/1800w; a 1200w WebP should land \~150–250 KB). Keep the PNG only as the `og:image`. Wrap in `<picture>`.

### **P2-2 · Third-party Calendly assets loaded but unused**

`index.html:75` render-blocks on `https://assets.calendly.com/.../widget.css`, and `index.html:~569` loads `widget.js` — but the page only uses a plain `<a href="https://calendly.com/van-shea/30min">`. No popup widget is initialized. **Fix:** delete both tags (also present in `case-studies/index.html` footer). Saves a blocking cross-origin request chain.

### **P2-3 · Font payload: 3 families × 11 weights, render-blocking**

All pages load Lexend Deca 400/500/700/800 \+ Open Sans 400/500/600/700 \+ Space Grotesk 400/500/700 from Google Fonts (blocking stylesheet in head). **Fix:** cut unused weights (audit shows mostly 400/500/700/800 across families — verify with a weight grep), self-host subsetted WOFF2 with `preload` \+ `font-display: swap`, or at minimum trim the CSS2 query. Also delete the dead `@font-face "Pinot Grigio Modern"` at `styles.css:403–406` — it has only `local()` sources and `.brand-name` doesn't render on index.

### **P2-4 · Scripts: no `defer`, no minification, one 55 KB monolith**

`index.html:693–694` loads `analytics.js` (20 KB) and `script.js` (55 KB) synchronously at end of body; both unminified; `script.js` ships lightbox \+ carousel \+ theme \+ form \+ footer-art code to every page (e.g. experience-copy logic loads on index, lightbox code loads on experience.html). **Fix:** add `defer` to both tags on all pages; add a minify step (esbuild/terser \+ cssnano) with hashed filenames — this also fixes the drifting manual cache-busting query strings (`?v=20260706-work-tabs-contrast-1` vs `?v=20260706-capital-one-logo-1` on different pages). Optional: split per-feature modules.

### **P2-5 · Dead and vestigial code**

- `.reveal` animation is disabled (`styles.css:2910–2918` sets `opacity:1; transition:none`) yet `script.js:1436–1447` still runs an IntersectionObserver and sets inline `transitionDelay` on every `.reveal` element. Remove the observer (or restore the effect intentionally).  
- `loadSiteImageConfig` (`script.js:~640`) fetches `/api/vscimage/config` first on every page load; on static/Apache hosting that's a guaranteed 404 before falling back to `/assets/vscimage/config.json`. Swap the order or drop the API probe on static builds.  
- Retired filter UI still shipped: `.filters`, `.filter-btn` styles (`styles.css:~795–830` and theme4 variants), `syncProjectFilters()` no-op (`script.js:1247`), `.art-1`–`.art-6` gradients (`styles.css:~1110`), commented-out mini theme switcher (`index.html:104–111`), hidden `#about` section (`index.html:~330`).  
- theme3's variable block is duplicated verbatim inside `@media (prefers-color-scheme: dark)` (`styles.css:~232–289`) — theme3 is already dark; delete the duplicate.  
- `index.html:85–96`: the `<picture>` dark `<source>` points at the **same file** as the light `src` (`sm_logo_hor_3x.png`), so the element does nothing. Simplify to one `<img>` (theme handling is already done via CSS `filter`). Related: mobile logo swap via CSS `content: url(...)` (`styles.css:3030, 3320`) is fragile — prefer real `<picture>`/`srcset`.

### **P2-6 · Minor ARIA cleanup**

- `index.html:123`: `aria-current="page"` on the in-page `#work` anchor is misleading; use it only on true current-page nav links (as case-study pages correctly do), and add a visible current-page style.  
- Consent banner (`index.html:632–651`): `role="dialog"` \+ `aria-live` on a non-modal toast is contradictory. Use `role="region" aria-label="Analytics consent"` (or `alertdialog` with focus management if you want it modal).  
- `index.html:671, 678`: raw `<` and `>` characters inside spans are invalid HTML (parser recovers, but validators flag it). Use `&lsaquo;`/`&rsaquo;` or inline SVG chevrons.  
- Footer art trigger (`index.html:546–553`) is a `div role="button" tabindex="0"` — works (keydown handled), but a native `<button>` is cheaper and more robust.  
- Redundant `aria-hidden` mirroring on elements that already toggle `hidden`/`display:none` (`script.js:1260, 1266, 1272`) — harmless, removable.  
- Recommendations carousel `dir="rtl"` hack (`index.html:~366`) makes screen readers treat the region as right-to-left and forces inverted arrow-key math (`script.js` keydown). Prefer normal LTR \+ `scrollTo` end on load. Per-card `tabindex="0"` adds 7 extra tab stops; the focusable track already provides keyboard scrolling.  
- WCAG 2.2 note (2.5.8 target size): the mini theme-slider labels on case-study headers are 20px tall (`styles.css:~2101`, `.theme-switcher-mini .theme-link { min-height: 20px }`) — below the 24px minimum.

### **P2-7 · Rendering cost**

- `will-change: transform` sits permanently on every card, card h3, and recommendation card (`styles.css:983, 1056, 1228`) — that pins GPU layers for \~20 elements. Remove; the transforms are simple enough without hinting.  
- `backdrop-filter: blur(14–16px)` on header, every recommendation card, and both theme sliders is the most expensive property in the file; theme4 (default) already disables it on cards — consider limiting it to the header in themes 1–2.  
- Hovering any footer SVG circle re-randomizes **all 38** circles' `cx/cy` (`script.js:400–413`, `pointerenter` per circle). Delegate a single listener and move only the hovered circle, or throttle.  
- Infinite `page-gradient-drift` body animation \+ two blurred fixed `.bg-shape` elements run continuously on themes 1–3. Consider pausing when `document.hidden` or removing on low-end (`prefers-reduced-motion` is already handled — good).

---

## **P3 — Design recommendations (Senior UX review)**

### **D-1 · The default "Wild" theme is a bold bet — aim it**

Enterprise buyers (M\&T, Vanguard, Capital One audiences) land on neubrutalism by default, and hero type jumps from 6.7rem (theme4) to a max 2.75rem in themes 1–3 — the site's hierarchy personality varies wildly per theme. Either commit to Wild as the brand (and normalize the other themes' hero scale toward it), or default to Clear/Tinted and make Wild the delightful opt-in. Also unify theme names — currently "Clear/Tinted/High Contrast/Wild" (index), "Clear Glass/Tinted Glass/…" (case studies), "Basic/Pro" (experience).

### **D-2 · One grid, two behaviors**

In Selected Work, corporate cards navigate to case studies while independent cards open a lightbox — identical-looking cards, different outcomes (consistency heuristic). The ⤢ button hints at it but only after hover. Add an explicit affordance on each card: a "Case study →" tag vs. a "View" tag (you already have `case-study-pill` styling to reuse).

### **D-3 · Personal narrative is missing**

`#about` is `hidden`, there's no photo, and the hidden copy ("I help startups and small teams…") contradicts the enterprise positioning of the case studies. Unhide About with 2–3 sentences that match "Human Agency Design," a portrait, and a link to Experience. Portfolios convert on person \+ proof; you currently ship only proof.

### **D-4 · Strengthen the recommendations carousel**

Add a position indicator ("3 of 7"), and consider surfacing 2–3 quotes as static pull-quotes on first paint — carousels hide social proof behind interaction. The anonymous M\&T/Vanguard executive quotes are strong; move one near the hero.

### **D-5 · Resume delivery**

The PDF resume points to Google Drive (`experience.html:~236`), which adds friction (Drive chrome, potential auth wall) and — bonus bug — your own analytics' `isResumeLink()` (`analytics.js:~195`) only matches `.pdf`/`/resume` hrefs, so Drive clicks are never tracked as resume downloads. Host `/assets/van-shea-sedita-resume.pdf` locally.

### **D-6 · Content polish**

- Nav label "AIdesign" is opaque; consider "AI Design Lab" or a short descriptor, and include/exclude it consistently across pages.  
- Footer alt text jokes ("No A.I. was used or harmed…") are charming but long for repeated SR announcement; keep the joke visible, shorten the alt.  
- Contact fallback copy "Prefer the original form?" assumes context the visitor doesn't have — "Prefer Google Forms?" is clearer.  
- Case-study card titles repeat the topline client name ("Capital One" pill \+ "Capital One: The Patent…"); trim titles to the story ("The Patent and Beyond").

---

## **Verification checklist (run after fixes)**

1. **Contrast:** re-check every pair in the P0-2 table plus new button colors in all 4 themes × light/dark (browser devtools or `npx pa11y`).  
2. **Automated scan:** `npx @axe-core/cli http://localhost` on `/`, `/experience.html`, `/case-studies/`, one detail page — expect zero `aria-hidden-focus`, `aria-allowed-attr`, `heading-order` violations.  
3. **Keyboard walkthrough:** Tab from address bar → skip link appears first; open lightbox (Enter on a card) → focus lands on Close, Tab cycles inside, Esc closes and returns focus to the card; filter toggle reachable and announced as pressed/not pressed.  
4. **HTML validity:** `npx html-validate index.html` — no unescaped `<`/`>` errors.  
5. **Screen reader spot-check (VoiceOver):** work section announces "Selected Work, heading level 2"; lightbox images announce titles without "FPO"; carousel not announced as right-to-left.  
6. **Performance:** Lighthouse on mobile — footer image request \< 300 KB, no Calendly requests, fonts non-blocking, scripts deferred.  
7. **Regression:** all 4 themes render correctly at 375px, 820px, 1440px; theme choice persists across pages; forms still submit.

