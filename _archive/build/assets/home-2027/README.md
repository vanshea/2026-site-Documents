# Human Agency Design — Build homepage

`/build/` is the main homepage, and the full portfolio remains at `/build/work.html`.
All public Build pages share the homepage's Human Agency Design shell.

The hero follows the supplied `design-01.png`: cream background, lime divider,
serif identity and headline, circular portrait, multicolor wave, and conversation
CTA. The page continues into large featured case studies, the working approach,
career highlights, the AI Design Lab, and contact links.

## Editing and refreshing

- `build/index.html`: homepage content and accessible markup.
- `agency-home.css`: responsive layout and homepage theme tokens.
- `agency-home.js`: saved theme selection, mobile navigation, and wave controls.
- `agency-site.css`: shared content-page layout overrides derived from the homepage.
- `wave-05-morph.svg`: byte-for-byte copy of the supplied **05 Morph** animation.
- `wave-05-static.svg`: the same source paths, with animation removed for the
  fallback and reduced-motion display.
- `logomark.svg` / `logomark-lite.svg`: existing site brand assets.

After editing the homepage structure, run from the repository root:

```sh
python3 build/assets/home-2027/propagate-agency.py
```

The older theme files remain in the asset directory for reference, while all
public Build pages now load the current agency shell.

## Themes and motion

The selector retains the existing Clear, Tinted, High Contrast, and Wild theme
IDs and the shared `vsc-site-theme-v2` preference key. Wild defaults to the supplied
cream/lime design. Clear and Tinted adapt to the system color preference.

The wave preserves the supplied morphing paths and timing. Pause controls both
SVG and CSS animation. Motion also pauses while offscreen or the tab is hidden.
Reduced-motion preference shows the static SVG. Without JavaScript, the static
wave and all navigation links remain usable.

## Content and verification

Career and case-study copy comes from the existing Build homepage and experience
page. Images use existing Build assets. Campaign concepts remain described as
concepts; no new performance claims were added.

Preview: http://localhost:3000/build/

Visual QA: `build/design-qa.md`; evidence: `build/qa/home-2027/`.

This is a Build-specific homepage. A general `npm run build:sync` can overwrite
Build-specific files; preserve these files before using the general sync.
