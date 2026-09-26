# Phase 2 validation

Checked 2026-09-26 against the local static preview in Codex's in-app browser.

## Completed checks

- Both pages at **360, 768, 1280, and 1600 CSS pixels**, in all four themes: 32 combinations. No horizontal document overflow, one h1 per page, and no broken image references.
- Responsive navigation stays visible. Carousel reports one card on mobile, two at 768px, and three at desktop sizes.
- All four theme selections update the palette, pressed state, and logo. High Contrast uses the inverse logo. Selected theme survives reload, including when the page has an explicit theme query parameter.
- Image link activation opens the modal. Close receives focus, the background stops scrolling, arrows change the image and counter, Escape closes, and focus/scroll state return to the opener.
- Backward Tab at Close wraps to Next within the dialog; forward Tab can return to Close. The dialog has an explicit boundary handler in addition to native modal behavior.
- Carousel End reaches the last page and disables Next; its status updates to 4–6 of 6 on desktop. Track Home/End and arrow-key handlers have been inspected alongside normal navigation.
- Text contrast reviewed against the supplied palettes. The corrected large headline is 3.61:1 on Tinted and 3.59:1 on Wild. Clear's problem-panel text was checked against its rendered color-mix background (12.47:1 heading and 6.13:1 supporting text).
- Focus tokens were corrected for the dark modal and Wild's dark contact panel.
- All JavaScript files pass `node --check`; every CSS custom-property reference resolves to a definition in tokens.css.
- Local HTML asset references resolve. Snippets are fragments intended to be copied into pages, not independent pages.
- SHA-256 comparison against the pre-work snapshot confirms every file in build and livesite is unchanged, with no added or removed files.

## Limits

This is a targeted preview check, not a full accessibility certification or a multi-browser audit. Touch swipe, screen-reader announcements, disabled-JavaScript behavior, and reduced-motion behavior have been implemented and source-reviewed but were not separately exercised with touch hardware, a screen reader, disabled JS, or an emulated motion preference. The user should review testimonial context and example leadership copy before publishing.

Phase 3 commands and integration into existing pages are not part of this validation. No production promotion took place.
