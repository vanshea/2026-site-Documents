# Root cleanup dry run

## Root serving behavior

The local site is a custom Express server started with `npm start` (`node server.js`). Ordinary root requests now check `/build/` first and serve its files directly, including its `index.html`; `/build/` remains available. The one command to start the site is `npm start` (the server listens on port 3000 unless `PORT` is set). Server-owned `/api`, `/analytics`, `/app`, `/login`, `/logout`, `/vscimage`, `/assets/vscimage`, `/livesite`, and `/blog` paths are kept out of the build-first lookup. `/comingsoon/` and `/build/` keep their existing handlers.

The live process already occupying port 3000 could not be replaced safely, so routing checks used the edited server on port 3002. Root pages and their `/build/` counterparts returned identical content for `/`, `/work.html`, `/case-studies/`, `/aidesign/`, and `/experience.html`. The requested portfolio pages and case studies returned HTTP 200, and 86 linked local assets (including CSS, JS, images, fonts, and video references) had no 404s. `/livesite/`, `/analytics`, `/api/analytics/config`, `/assets/vscimage/config.json`, and `/vscimage` also returned HTTP 200.

`/blog/` returned HTTP 200, but the response is the site's existing fallback page, not WordPress. The project starts Express and has no local PHP/WordPress handler in `server.js`; the WordPress PHP files under `/blog/` therefore are not executed by this local command. The server change leaves `/blog/` outside the build lookup and does not edit that tree. The request to temporarily edit a `/build/` comment was skipped because the hard boundary says not to edit anything inside `/build/`; direct root-to-build serving was verified through matching responses instead.

## Root paths that currently compete with `/build/`

The root contains older site copies at `index.html`, `experience.html`, `script.js`, `styles.css`, `assets/`, and `case-studies/`. They were last committed September 26, 2026. The build-first lookup serves the matching `/build/` content whenever it exists; the root copies remain as fallbacks and have not been moved. Server-managed root files and the `/assets/vscimage` path remain separately routed.

## Hard-coded paths in `/build/` that need attention before hosting at `/livesite/`

No files inside `/build/` were edited. A source scan found 849 references beginning `/build/` in 51 files. Those URLs point to the domain root and will continue to request `/build/...` if the site is mounted at `/livesite/`. The references appear in:

- Root pages: `build/index.html`, `build/home.html`, `build/home-2.html`, `build/home-3.html`, `build/work.html`, `build/experience.html`, `build/404.html`, `build/nft-prototype.html`, and `build/macos26-slider/index.html`.
- Case studies: `build/case-studies/index.html` and each of its five case-study `index.html` pages.
- AI Design pages: `build/aidesign/` pages, including `index.html`, `index/index.html`, `experiments/`, prototype/share pages, and standalone demos.
- Home and demo assets: `build/assets/home-2027/selected-home.html` and its demo HTML files.
- Supporting notes: `build/COPY_CHANGES.md`, `build/README.md`, `build/A11Y_REPORT.md`, `build/design-qa.md`, and `build/seo/{REPORT,AUDIT}.md`.

The scan also found 118 distinct root-absolute paths in 607 file occurrences. They include `/assets/...` (stylesheets, scripts, icons, images, videos, and VSCimage references), `/case-studies/...`, `/aidesign/...`, `/work.html`, `/experience.html`, `/analytics.js`, `/script.js`, `/styles.css`, `/favicon...`, `/apple-touch-icon.png`, and `/site.webmanifest`. Root-absolute URLs also resolve from the domain root rather than the `/livesite/` mount. This is an inventory for later path work only; no build files were changed.

## Archive candidates

Cutoff: before 2026-03-28. Dates use the last Git commit for tracked files and filesystem modification time for untracked files. References were searched by path and filename in `/build/`, `/livesite/`, `/blog/`, `server.js`, and `package.json`. Candidates remain in place pending approval.

| Path | Size | Last committed/modified | Reference check |
|---|---:|---|---|
| `CLEANUP BEFORE GOING LIVE.rtf` | 4,455 B | 2026-03-02 | no references found |
| `assets/fpo-large-atlas-1900x1600.svg` | 947 B | 2026-02-15 | no references found |
| `assets/fpo-large-city-transit-1900x1600.svg` | 959 B | 2026-02-15 | no references found |
| `assets/fpo-large-field-notes-1900x1600.svg` | 955 B | 2026-02-15 | no references found |
| `assets/fpo-large-hollow-creek-1900x1600.svg` | 955 B | 2026-02-15 | no references found |
| `assets/fpo-large-northline-1900x1600.svg` | 951 B | 2026-02-15 | no references found |
| `assets/fpo-large-wren-1900x1600.svg` | 941 B | 2026-02-15 | no references found |
| `assets/fpo-thumb-760x570.svg` | 775 B | 2026-02-15 | no references found |
| `github-test.txt` | 39 B | 2026-02-16 | no references found |

## Kept because referenced

| Path | Where it is referenced |
|---|---|
| `assets/web_logomark_240_dark.png` | `build/styles.css`, `build/assets/home-2027/apply-site-theme.py`, `livesite/styles.css`, and the WordPress import under `blog/wp-content/imports/` |
| `assets/web_logomark_240_white.png` | `build/styles.css` and `livesite/styles.css` |

## Unsure

| Path | Why it needs review; left in place |
|---|---|
| `.gitattributes` | Repository behavior file; not treated as disposable content. |
| `clients/acme/http/README.md`, `clients/sample-public/http/README.md` | Client scaffolding/docs; references may be assembled by tooling rather than a literal site link. |
| `clients/acme/images/cover.svg`, `clients/sample-public/images/cover.svg` | Client scaffold assets; no direct site reference found, but runtime/scaffold use is unclear. |
| `content/clients/acme.json`, `content/clients/index.json`, `content/clients/sample-public.json` | Data files may be consumed by tooling dynamically; no direct reference found in the requested search surfaces. |
| `lib/prisma.js` | Loaded by the server through extensionless module resolution. |
| `prisma/schema.prisma`, `prisma/migrations/20260216170000_add_filter_dimensions/migration.sql`, `prisma/migrations/migration_lock.toml` | Database runtime and migration files; references are indirect through Prisma tooling. |
| `views/login.ejs`, `views/partials/dashboard_footer.ejs`, `views/partials/dashboard_head.ejs`, `views/partials/dashboard_nav.ejs` | Express templates/partials rendered by name; direct filename search does not establish usage. |

## Archived

Nothing has been archived. The dry-run report is ready for review; cleanup moves require approval. The `_archive/` directory was not added to `.gitignore`.
