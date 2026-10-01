# Van Shea Creative Site Context for Codex

Last reconciled with the local workspace: 2026-10-01. Use this as orientation, not proof that a change is deployed. The current user request and the files actually served for its URL take precedence.

## Project map and scope

- Workspace root: `/Library/WebServer/Documents`.
- `build/` is the static Build/staging tree. `livesite/` is the separate static copy prepared for the public website. Keep navigation and asset paths within the variant being edited.
- Nested copies exist under `build/build/` and `livesite/build/`. Do not assume they are needed for the public root homepage. Confirm the requested URL and serving root before editing, generating aliases, or listing upload files.
- The public homepage at `https://vanshea.com/` is represented locally by `livesite/index.html`; primary homepage assets are in `livesite/assets/home-2027/`. Nested `livesite/build/` files are separate Build/preview copies and are not automatically part of a root homepage upload.
- WordPress is separate under `/blog/`. Theme copies may also exist under `build/blog/` and `livesite/blog/`. The active theme was previously identified as `livesite/blog/wp-content/themes/vanshea-creative-blog-revised`; verify the actual serving/runtime path before editing. Work on WordPress only when the user explicitly asks. Do not mix static Build/Livesite changes into the WordPress theme.
- Express, analytics, client rooms, Coming Soon, static Livesite, and WordPress have distinct routes and deployment behavior. An Express fallback or static 200 response does not prove the PHP WordPress site works.

## Homepage and current anchor work

- The asterisk beside “Human Agency Design” targets `#human-agency`, the intro section containing “We make the complex visible and the next decision clearer.”
- The sticky header previously obscured that section on anchor navigation. Local homepage JavaScript now measures the current header height, scrolls the intro below it, preserves the hash, and moves keyboard focus to the intro container. The target uses `tabindex="-1"`. CSS scroll padding is also set for direct hash URLs. Current homepage CSS/JS query token: `20261001-intro-anchor-dynamic`.
- The asterisk was moved closer to “Design” with a small negative margin in `agency-home.css`.
- These edits are local. The user reported the public page still obscured the intro. Do not claim this is fixed live until the exact served HTML, CSS, and JS are checked in a browser. For the public root homepage, the relevant upload files are `livesite/index.html`, `livesite/assets/home-2027/agency-home.css`, and `livesite/assets/home-2027/agency-home.js`.
- If the requested URL is under `/build/`, inspect that route’s actual page and assets too. Keep upload lists limited to files required by the requested URL.
- Root HTML contains SEO/Open Graph metadata and theme-dependent favicon links. Check the served HTML and resolved asset URLs, not only local paths.

## Theme switcher and visual preferences

- Requested main static-site labels: Clear, Contrast, Bold, Wild. Rename “High Contrast” to “Contrast” wherever it remains. Page variants use different markup, including radio fieldsets, button groups, and selects; inspect before broad edits.
- Preferred style: iOS 27-inspired glass switcher, visible labels at all times, a wide rounded background that fits the controls, and no visible “Color theme” label.
- Mobile: the four theme buttons should share one row across the available footer width, with legible text and usable tap targets.
- Only Wild should use lime `#d2ff00` in the footer. Clear, Contrast, and Bold should use darker, theme-appropriate footer colors.
- Preserve theme IDs, persistence, keyboard operation, focus indication, and system preference behavior when changing labels or visuals.
- A prompt for the Blog/WordPress switcher was drafted in chat. That prompt is not evidence that WordPress code was changed.

## Icons and installable assets

- Static favicon and web app assets are in `/fav-icon/` in Build and Livesite. Link explicit filenames, never the directory itself; `/fav-icon/` previously returned 403.
- The root homepage links to `/fav-icon/site.webmanifest`, light/dark PNG favicons, and Apple touch icons. A script switches between `apple-touch-icon.png` and `apple-touch-icon-dk.png` based on color scheme.
- The user supplied replacement Apple and PNG favicon assets. Preserve them. Before claiming icon behavior is correct, verify iPhone Add to Home Screen, Android manifest/icon paths, dimensions, MIME types, and actual server responses.

## Accessibility, semantics, SEO, and responsive requirements

The user requested these baseline improvements for static HTML. Check current source and served output before describing each as implemented:

1. Give icon-only controls accessible names. Prefer native `<button>` controls to adding `role="button"` to links or divs.
2. Use native inquiry-form validation (`required`, appropriate input types) and a visually hidden, non-required, non-focusable honeypot.
3. Put theme state on the `<html>` root with `data-theme` and respect `prefers-color-scheme` for first-time visitors.
4. Give portfolio images intrinsic width and height; lazy-load and async-decode non-critical images. Keep above-the-fold/LCP images eager when appropriate.
5. Keep a clear heading hierarchy, homepage `<header>`/`<h1>` semantics, and `<article>` elements for independent portfolio cards.
6. Make Recommendations a keyboard-usable carousel with a polite slide status and reduced-motion support.
7. Keep the skip link offscreen by default and reveal it at the top-left on focus.
8. Disable “Load More” and set `aria-disabled="true"` when no work is available.
9. Keep the portfolio description and Open Graph metadata accurate.
10. Make privacy-first analytics consent accessible, trap and restore focus while open, and persist Allow/Deny in `localStorage`.
- Avoid widowed one-word lines at standard widths. Balance headings and choose readable content widths. Verify desktop, tablet, and mobile; do not clip text to hide wrapping problems.
- Experience page top spacing should match Work and Case Studies.

## WordPress / Blog

- The user asked for a prompt for the Blog WordPress switcher: glass style, always-visible labels, Contrast rename, full-width mobile row, dark theme-specific footer colors except Wild lime, accessibility, and no deployment. Only the prompt was drafted in this conversation; inspect the current theme before implementing.
- For WordPress tasks inspect the active theme’s `header.php`, CSS/JS, enqueue/cache-busting behavior, site icon configuration, and actual rendered page. Keep WordPress runtime/assets separate from static `/build/` and `/livesite/` files.
- A static file check or package does not prove WordPress runtime or live behavior. Verify the exact route and loaded assets.

## Build, Livesite, and deployment

- New/approved static work normally starts in `build/` and is promoted to `livesite/` through the current approval/promotion workflow. Prior notes flag `livesite/` as protected. Inspect the active branch, dirty state, and any `push:live` gate before editing or publishing; do not assume a past approval covers deployment.
- `npm run variants:sync` refreshes static copies and case studies. `npm run livesite:bundle` creates a root-ready static upload bundle by default under `~/Backups/portfolio-site/livesite-static-upload/ftp-upload/`. Inspect the bundle before transfer; do not upload an extra `livesite/` path segment into the web root.
- No FTP uploader or host has been confirmed in the project. `.env` is for app configuration/secrets, not FTP. Never print, commit, or ask the user to paste passwords or private keys into chat. Do not invent a host or remote root. The SiteGround static FTP handoff document currently describes Coming Soon, so do not apply it blindly to Livesite.
- Never claim a change is live until the server response and rendered page are verified. Check loaded CSS/JS query versions, CDN/browser caches, and route-to-file mapping.
- After every edit, provide a clear, exact upload list. Separate public Livesite root files from optional Build/preview files.

## Working preferences

- Before substantial site edits, inspect the active branch and working tree, applicable instructions, source/output relationship, and requested URL. Avoid broad replacements across unrelated variants.
- Preserve supplied copy, URLs, themes, recommendations, footer artwork, and accessibility. Do not invent site content or overstate unverified completion.
- Rendered behavior matters. Check served asset URLs and desktop/mobile layouts in a browser when possible. If browser validation is unavailable, say what was checked instead.
- After edits, briefly explain the change and verification, then list every exact file to upload. Do not say something is deployed unless it actually was.
- Do not commit, push, publish, or FTP-upload unless directly requested. Never expose secrets in command output or project documentation.
