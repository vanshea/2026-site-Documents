# Van Shea Creative design system

Phase 2: a plain HTML/CSS/JavaScript source library and local preview. No framework, compilation, or package installation is required. Build and live have not been migrated.

## Preview

From this folder, run:

```sh
python3 -m http.server 4170 --bind 127.0.0.1
```

Open http://127.0.0.1:4170/ for the living reference and `/examples/leadership.html` for the complete page example. Reload after edits. Stop the server with Ctrl+C. If your existing local server exposes the project root, `/design-system/` also works. Google Fonts is the only external rendering dependency; system fallbacks work offline. Images, logos, artwork, and JavaScript are local.

## Editing

- `tokens.css`: the sole source of design values, including colors, type, spacing (`--space-*`), radii, shadows, and motion. Theme blocks override semantic tokens. Unitless layout ratios and media-query thresholds remain in CSS; native CSS custom properties cannot be used in media-query conditions.
- `styles.css`: public entry point; imports fonts, tokens, base rules, and components.
- `components/components.css`: reusable `vsx-` patterns. `components/snippets/` contains twelve plain HTML fragments. Copy a fragment into an explicitly approved page, resolve its asset paths, and keep IDs unique. Fragments are examples, not a runtime templating system.
- `js/theme-switcher.js`: synchronous head script for pre-paint theme application and theme controls.
- `js/lightbox.js`, `js/carousel.js`: deferred progressive enhancements.
- `preview.css`, `js/preview.js`: documentation-only layout and live token inspection. Do not distribute these as site styles.
- `examples/leadership.html`: complete reference page, not a new production landing page.

Typical use in a new page (adjust relative paths):

```html
<html lang="en" data-theme="clear">
<head>
  <script src="design-system/js/theme-switcher.js"></script>
  <link rel="stylesheet" href="design-system/styles.css">
  <script src="design-system/js/lightbox.js" defer></script>
  <script src="design-system/js/carousel.js" defer></script>
</head>
```

## Themes and components

Clear, Tinted, High Contrast, and Wild use `data-theme="clear|tinted|contrast|wild"`. New token and component rules also accept `theme1` through `theme4`. This does not migrate old site-specific CSS or scripts.

The preview remembers `vs-theme`, reading legacy `vsc-site-theme-v2` and `vsc-site-theme` only as a fallback. It never writes the legacy keys. `?theme=wild` selects an explicit preview theme; changing theme updates that parameter. Without a saved preference, Clear is the default. Palettes are explicit and do not follow operating-system dark mode.

Use buttons with `data-set-theme` for theme controls. They expose selection with `aria-pressed`. Logo images can supply `data-logo-light` and `data-logo-dark` paths for automatic contrast-theme switching.

For a lightbox, use an image link with `.vsx-zoom`, `data-lightbox="group-name"`, and descriptive image alt text. Optional `data-title`, `data-caption`, `data-alt`, and `data-src` customize the dialog. A single native modal serves each page. Enter opens the focused link; Escape, Close, and backdrop clicks close it; arrow keys and horizontal swipes navigate. Focus returns to the link and page scrolling is restored. Without JS or dialog support, the link opens the image normally. Text is inserted with `textContent`.

The carousel has no autoplay. It shows three cards on wide screens, two at 1050px and below, and one with a peek at 720px and below. Buttons and focused-track arrow keys move one visible page; Home/End move to either end. The native scrollbar remains available without JS; enhancement-only controls start hidden. Use unique accessible names if adding multiple carousels.

## Accessibility decisions

- The supplied `#f16070` headline passes the large-text threshold on Clear (3.08:1), but fails on Tinted (2.76:1) and Wild (2.75:1). Those themes now use `#d94a5b` (3.61:1 and 3.59:1). Keep this color on large text only.
- Navigation wraps on small screens instead of disappearing. Theme, navigation, carousel, and lightbox controls have at least 44px target heights.
- Theme controls use buttons with pressed states; the metadata panel uses a definition list. The decorative wave is hidden from assistive technology.
- Modal focus rings use a light color against the dark dialog, independent of the page theme. Wild's dark contact panel also has a contrasting focus ring.
- Reduced-motion CSS disables animation and smooth scrolling; carousel JS uses instant scrolling under that preference.
- Hairlines are decorative. Do not use `--line` as the only form-control boundary.
- These changes and the checks in `docs/phase2-validation.md` are not a claim of full-site WCAG certification.

## Workflow boundary

Intended direction: **design-system → build → livesite**. Edit sources here; future copied assets in build/live will be snapshots. Simply linking this CSS to old pages is insufficient because their existing styles and theme scripts compete with it.

**Phase 3 is pending:** `dev` with live reload, `push:build`, `push:live`, backups, and `rollback` are not implemented yet. The manual preview command above is available now. Future promotion will require a reviewed file scope, a diff and confirmation, a verified backup for live changes, path translation, and preservation of WordPress/live-only content. Obsolete files will go to `/_archive/`, not be deleted.

Do not use the existing root `build:sync` or live promotion scripts as substitutes: they regenerate content or delete destinations and do not implement the approved workflow.

Sources: the supplied ZIP and Claude prompt, with recommendations, four steps, case images, and their alt text taken from `build/index.html`. Source locations are recorded in `docs/asset-sources.json`. No testimonial wording was invented. Leadership narrative follows the supplied reference and remains an example for review.
