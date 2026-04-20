# Site Assessment and Git Pull Notes

Date: 2026-04-20
Workspace: `/Library/WebServer/Documents`
Branch: `main`
HEAD: `0710bca2ccb4ff3c0deb799e288a8e1022953333`

## Current Git State

- Working tree is clean.
- Local `main` matches `origin/main`.
- The most recent pull landed as merge commit `0710bca` on 2026-04-20.
- Reflog shows the repo was reset to `origin/main` immediately before/after the merge was finalized.

Compared with the prior local commit `dfd3d8a`, the pulled merge changed 87 files with 3,366 insertions and 877 deletions.

## What Was Pulled

### 1. Public website expanded beyond a simple portfolio

The site is no longer just a static homepage and resume page. The Express app now serves:

- `/` portfolio homepage
- `/experience.html` experience/resume page
- `/case-studies` listing page
- `/case-studies/:slug` detail pages rendered from JSON content

Relevant implementation:

- [`/Library/WebServer/Documents/server.js`](/Library/WebServer/Documents/server.js)
- [`/Library/WebServer/Documents/lib/case-studies.js`](/Library/WebServer/Documents/lib/case-studies.js)
- [`/Library/WebServer/Documents/views/case-studies/index.ejs`](/Library/WebServer/Documents/views/case-studies/index.ejs)
- [`/Library/WebServer/Documents/views/case-studies/show.ejs`](/Library/WebServer/Documents/views/case-studies/show.ejs)
- [`/Library/WebServer/Documents/content/case-studies/capital-one-gesture-patent.json`](/Library/WebServer/Documents/content/case-studies/capital-one-gesture-patent.json)

### 2. Homepage and experience page were updated

User-facing content changed in these files:

- [`/Library/WebServer/Documents/index.html`](/Library/WebServer/Documents/index.html)
- [`/Library/WebServer/Documents/experience.html`](/Library/WebServer/Documents/experience.html)
- [`/Library/WebServer/Documents/script.js`](/Library/WebServer/Documents/script.js)
- [`/Library/WebServer/Documents/styles.css`](/Library/WebServer/Documents/styles.css)

Visible changes include:

- navigation now points to `Home`, `Case Studies`, and `Experience`
- resume copy was rewritten toward service design and responsible AI leadership
- additional generated portfolio images were added to the homepage gallery
- interaction polish improved around the mobile nav and lightbox behavior

### 3. Analytics/admin security was tightened

The pull added or changed several controls around the analytics/admin area:

- admin session cookies are now HMAC-signed
- `/vscimage` and `/api/vscimage/*` require authenticated analytics admin access
- client room passwords are stored in SQLite with hashed values rather than plaintext in JSON
- trusted origins for Next server actions are derived from environment configuration

Relevant files:

- [`/Library/WebServer/Documents/analytics-ui/lib/admin-auth.ts`](/Library/WebServer/Documents/analytics-ui/lib/admin-auth.ts)
- [`/Library/WebServer/Documents/analytics-ui/lib/client-secrets.ts`](/Library/WebServer/Documents/analytics-ui/lib/client-secrets.ts)
- [`/Library/WebServer/Documents/analytics-ui/next.config.mjs`](/Library/WebServer/Documents/analytics-ui/next.config.mjs)

### 4. Backup and static-hosting workflows were added

The repo now includes scripts and docs for:

- launch-ready FTP bundles
- dynamic backups
- combined dynamic + static export packaging
- SiteGround static hosting handoff

Relevant files:

- [`/Library/WebServer/Documents/scripts/create-launch-ready-bundle.mjs`](/Library/WebServer/Documents/scripts/create-launch-ready-bundle.mjs)
- [`/Library/WebServer/Documents/scripts/create-dynamic-backup.mjs`](/Library/WebServer/Documents/scripts/create-dynamic-backup.mjs)
- [`/Library/WebServer/Documents/scripts/create-dynamic-and-static-packages.mjs`](/Library/WebServer/Documents/scripts/create-dynamic-and-static-packages.mjs)
- [`/Library/WebServer/Documents/scripts/create-siteground-static-bundle.mjs`](/Library/WebServer/Documents/scripts/create-siteground-static-bundle.mjs)
- [`/Library/WebServer/Documents/docs/BACKUP-AND-STATIC-WORKFLOW.md`](/Library/WebServer/Documents/docs/BACKUP-AND-STATIC-WORKFLOW.md)
- [`/Library/WebServer/Documents/docs/SITEGROUND-STATIC-FTP-HANDOFF.md`](/Library/WebServer/Documents/docs/SITEGROUND-STATIC-FTP-HANDOFF.md)

### 5. Repository hygiene improved in some places

The merge removed committed runtime data that should not live in the repo:

- deleted `data/client-secrets.sqlite`
- deleted `postgres_dump_20260218_081301.sql`

That is a positive cleanup, and `data/README.md` now explicitly says live secrets should not be stored in the repository.

## Website Assessment

The current site is a hybrid portfolio platform:

- public marketing/portfolio pages are still primarily static HTML/CSS/JS
- case studies are now template-driven and content-backed
- protected analytics/admin capabilities sit behind the Express app and the Next.js analytics UI
- generated media assets play a large role in the visual presentation

Overall assessment:

- The site is materially more capable than the earlier static version.
- The repo is now closer to a small content platform than a single-page portfolio.
- Documentation coverage improved significantly around setup, publishing, and backups.

## Risks and Follow-Up Items

### High priority

- `.gitignore` was removed in this merge. The previous version ignored `.env`, generated image folders, `node_modules`, and local runtime artifacts. Without a replacement, it will be easy to recommit secrets, build output, or generated assets by accident.

### Medium priority

- The homepage depends on a large volume of generated image assets under `assets/vscimage/generated/`. That improves the portfolio presentation, but it also increases deploy size and raises the chance of asset drift between static and dynamic deployment flows.
- The app now spans static pages, Express routes, EJS templates, a Next.js admin UI, Prisma/Postgres, and SQLite. That architecture is workable, but deployment complexity is materially higher than the old static site.

### Low priority

- I did not find test scripts in the root `package.json`, so there is no obvious automated verification path after a pull.

## Recommendation

Before the next commit or deploy:

1. Restore or replace `.gitignore`.
2. Run a manual smoke test for `/`, `/experience.html`, `/case-studies`, `/analytics`, and `/vscimage`.
3. Confirm `CLIENT_SECRETS_DB_PATH`, `SESSION_SECRET`, `ADMIN_SESSION_COOKIE_SECRET`, and trusted origin settings are correct for the target environment.
