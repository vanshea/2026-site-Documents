# Release report — 2026-09-28

## Status

Prepared a local release bundle in `/livesite/`. Nothing was uploaded, deployed, or pushed.

The original `/livesite/` tree was verified against the dated backup before replacement. It is preserved at both `_archive/livesite-backup-2026-09-28/` and `_archive/livesite-before-release-2026-09-28/`. The original `/build/` snapshot is preserved at `_archive/build/`.

## Source and release inventory

| Item | Files | Bytes |
|---|---:|---:|
| Original `/build/` source | 353 | 149,662,411 |
| Original `/livesite/` before release | 5,697 | 326,054,194 |
| Verified release at `/livesite/` | 5,728 | 333,764,424 |

The release contains 39 static HTML pages, 16 indexable URLs in `sitemap.xml`, the existing 5,452-file WordPress blog, the legacy `/lab/` route, and nonconflicting legacy assets. The blog's non-hidden files were restored byte-for-byte from the backup. The release folder and review staging folder match.

## Changes made

- Fixed the static bundle exporter so removing the consent banner only removes the banner itself. The prior regular expression could remove content between an earlier `<aside>` and the banner; the corrected export retains the complete AI Design Lab panels.
- Rewrote build-root paths for hosting at the web root and set root favicon and manifest paths. The 16 page canonicals and sitemap use the apex `https://vanshea.com`; the second domain is treated as an alias that should redirect to the apex.
- Added the release `robots.txt`, verified the 16 sitemap URLs and `lastmod` values (`2026-09-28`), and added the custom 404 page.
- Replaced root `.htaccess` with HTTPS/host normalization, route aliases, WordPress-compatible `DirectoryIndex`, 404 handling, optional compression/cache rules, basic security headers, and access blocks for sensitive/backup file patterns.
- Lowercased and hyphenated the standalone Contact prototype filename and updated its links. The old encoded filename has a 301 rule.
- Restored the four existing 1200×630 AI Design share images and the existing footer image referenced by page metadata.
- Minified the authored global, AI Design, case-study, and homepage CSS/JS. Across those files this reduced CSS by 24,824 bytes and JS by 37,897 bytes.
- Added intrinsic width and height to 24 static images across Work and case-study pages. The dynamically populated case-study lightbox image remains dimensionless so it does not receive an incorrect fixed aspect ratio.
- Archived unlinked homepage previews, an alternate AI Design page with missing v2 PNG references, internal QA/SEO documents, build scripts, and theme ZIPs outside the upload tree. Their originals remain in the build snapshot and phase archives.

The release packaging did not change `/build/` or the design-system folder. It did not change visible body copy or intentionally redesign components. The only source-code change is the one-line bundle-exporter fix.

## Verification

| Check | Result |
|---|---|
| Sitemap routes on the localhost release preview | 16 of 16 returned HTTP 200 |
| AI Design prototype iframe targets | All four returned HTTP 200 |
| Contact prototype and its companion demo | Both returned HTTP 200 |
| `robots.txt`, `sitemap.xml`, 404 page, four social images, footer image | All returned HTTP 200 |
| Static local HTML/CSS references | No unresolved local references; WordPress permalinks are routed by its preserved `.htaccess` |
| SEO metadata on sitemap pages | 16 unique titles and descriptions; self-referencing canonicals; one H1 each; required Open Graph/Twitter fields present |
| Structured data | Existing Person, Organization, WebSite, ProfessionalService, BreadcrumbList, and CreativeWork JSON-LD parsed successfully |
| Mobile AI Design iframe | Headless mobile DOM keeps `data-lab-preview` without a `src`; all four `data-demo` targets are present |
| Apache | Global `apachectl configtest` returned `Syntax OK`; this does not parse `.htaccess` |
| Lighthouse | Not run: no Lighthouse executable/package is installed, so no scores are claimed |

The local Apache has no active `mod_rewrite`, `mod_deflate`, or `mod_expires` modules. The related `.htaccess` blocks are guarded, but host redirects, compression, cache headers, and WordPress permalink behavior must be verified on the target host. The copied WordPress site also requires its normal PHP/database runtime; that runtime was not exercised in this static preview.

## Needs Van's decision

- **Mobile layout:** At 390px, the headless mobile render showed the homepage hero heading and supporting line clipped at the right edge. The preview had external font networking disabled, so confirm with the production fonts and decide whether to authorize a responsive layout fix before upload. No layout change was made under the release guardrail.
- **Social preview artwork:** The four AI Design share pages have 1200×630 images. The other sitemap pages use the 1792×2400 portrait headshot as `og:image`; approve a site-wide or per-page 1200×630 image plan if those pages need tailored social cards. No images were generated.
- **Future URL cleanup:** Internal prototype routes still use underscores, including `/aidesign/meeting_coach.html` and `/aidesign/self_care.html`. They were kept because the prototypes link to them. If these URLs should be cleaned later, create hyphenated routes and 301 redirects.
- **Hosting configuration:** Confirm that the production host enables `mod_rewrite`, `mod_headers`, `mod_deflate`, and `mod_expires`, honors `.htaccess`, and supplies `X-Forwarded-Proto` if TLS terminates at a proxy. Confirm that `humanagencydesign.com` is configured to reach this host before relying on its canonical redirect.

## Release commits

- `b4edfbd` — release inventory
- `cf716e9` — preserve page content during static bundle generation
- `418b495` — canonical routes and indexing configuration
- `dfd6a10` — verified local site bundle

See [UPLOAD-CHECKLIST.md](UPLOAD-CHECKLIST.md) for pre-upload steps.
