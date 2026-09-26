# Redesign validation

Validated 2026-09-20 with headless Chrome against a local static preview. No production deployment or contact message was sent.

## Mobile Lighthouse

Performance **97**, Accessibility **100**, Best Practices **100**, SEO **100**. Mobile simulated throttling, Lighthouse default mobile configuration. Initial and final export runs both scored 97/100/100/100. Initial first contentful paint was 2.1s and largest contentful paint was 2.1s. Local measurements are not a guarantee of deployed hosting performance. Cache and compression policies belong to the deployment host.

## Accessibility and behavior

- Axe WCAG 2 A/AA, WCAG 2.1 A/AA and best-practice checks pass on Home, About, Art and the open Art dialog. An Art heading-order issue and a brand accessible-name mismatch were corrected and rechecked.
- Homepage scans pass across all four themes in both OS color schemes. Body/secondary contrast ratios below exceed AA 4.5:1. Controls and inputs also passed automated contrast checks.
- No horizontal overflow at 320, 390, 640, 810 and 1440px. Mobile headline renders one word per line. Desktop, mobile and footer screenshots visually inspected.
- Theme button/range state persists across reloads. IDs and storage keys match the original site.
- Six-second carousel autoplay verified with browser clock control. Hover pauses it, leaving hover resumes it, changing the OS reduced-motion preference stops it. Manual previous/next and arrow keys work.
- Reduced motion produces zero running animations. All seven recommendations and eight writing links remain available with JavaScript disabled.
- All seven original recommendation HTML blocks compare verbatim; only order changes to place the M&T executive sponsor first and Ashley second.
- Art dialog opens, advances, closes with Escape and returns focus to the original thumbnail. Native modal focus containment and fullscreen control are present.
- Footer WebP image loads successfully. Linked local resources on Home, About and Art respond successfully.
- Form failure path tested against a preview-only rejecting endpoint: no real message sent, entered values preserved, Google Form fallback named in status. Success requires the existing endpoint's JSON `{ok:true}` response. Real email delivery was not tested.
- Legacy About hash redirects to the About page. Surviving homepage anchors remain present.
- Exported case-study and experiment pages have six matching navigation links and no missing local resources. Export-only legacy analytics requests and footer-log paths were corrected.
- Node syntax checks pass. Offline writing build and isolated static export succeed. Live API retrieval and an explicitly simulated unreachable API were also tested.

## Contrast ratios

| Theme | OS scheme | Body | Secondary |
| --- | --- | --- | --- |
| theme1 | light | 15.14:1 | 5.29:1 |
| theme2 | light | 15.44:1 | 6.68:1 |
| theme3 | light | 21.00:1 | 19.26:1 |
| theme4 | light | 17.89:1 | 12.30:1 |
| theme1 | dark | 18.91:1 | 11.43:1 |
| theme2 | dark | 17.96:1 | 12.27:1 |
| theme3 | dark | 21.00:1 | 19.26:1 |
| theme4 | dark | 17.89:1 | 12.30:1 |

## Scope and limits

The WordPress header was edited against the active theme confirmed in live HTML. PHP is not installed in this environment, and no local WordPress database/runtime was available for a rendered post-page test. Shared CSS, header links and compatible theme IDs are in place; verify the deployed blog once those files are uploaded. Existing case-study and experiment bodies remain outside the redesign's Lighthouse claims. Their routes and assets are preserved.

The repository already contained many uncommitted edits and whitespace warnings in legacy variant files before this work. These have not been reset. No git commit or deployment was made.
