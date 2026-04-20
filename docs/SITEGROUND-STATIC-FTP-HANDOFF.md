# SiteGround Static FTP Handoff

This document is for publishing the current coming-soon site to SiteGround shared hosting.

Source folder:
- [`/Library/WebServer/Documents/comingsoon`](/Library/WebServer/Documents/comingsoon)

## Important Hosting Limitation

SiteGround shared hosting is suitable for this project only as a static site handoff.

Use the SiteGround bundle when you want to publish:
- the coming-soon homepage
- the experience page
- the case study index and case study detail pages
- shared visual assets

Do not use SiteGround shared hosting for the full app stack in this repo.

Why:
- the full project depends on Express
- the full project depends on a Next.js app mounted at `/analytics`
- the full project depends on long-running Node.js processes
- the full project also uses PostgreSQL and a persistent SQLite secrets file

The SiteGround handoff intentionally excludes the full app runtime and publishes only the public static pages.

## Bundle Command

From the project root run:

```bash
npm run comingsoon:bundle
```

This creates:

- [`/Users/vansedita/Backups/portfolio-site/comingsoon-static-upload`](/Users/vansedita/Backups/portfolio-site/comingsoon-static-upload)

Inside that folder:

- `ftp-upload/`
- `README.md`

## What The Bundle Includes

- `index.html`
- `experience.html`
- `case-studies/`
- `styles.css`
- `script.js`
- `assets/`
- `.htaccess`

## What The Bundle Changes For SiteGround

- pre-renders case studies into plain HTML pages
- keeps `Home` pointed at `index.html`
- redirects old app-only routes back to the homepage with `.htaccess`

Redirect targets include:

- `/login`
- `/analytics`
- `/analytics/*`
- `/app`
- `/vscimage`

## Upload Steps In SiteGround

1. Log in to SiteGround.
2. Open **Site Tools** for the target site.
3. Open **Site > File Manager** or connect by SFTP.
4. Open the web root, usually `public_html/`.
5. Upload the contents of `ftp-upload/` into `public_html/`.
6. If there is an older static or app deployment already in `public_html/`, back it up first.
7. Replace the old public files with the new bundle contents.

## Post-Upload Checks

Confirm these URLs:

- `/`
- `/experience.html`
- `/experience`
- `/case-studies/`
- `/case-studies/capital-one-gesture-patent/`

Confirm these old app URLs no longer hard-fail:

- `/analytics`
- `/login`

They should redirect to `/`.

## If You Need The Full App Later

If you want the analytics dashboard, client rooms, login, or case-study app routes online, move the full repo to a Node-capable host and use the standard deployment docs instead:

- [`/Library/WebServer/Documents/docs/SITE-FUNCTIONALITY-PUBLISHING.md`](/Library/WebServer/Documents/docs/SITE-FUNCTIONALITY-PUBLISHING.md)
- [`/Library/WebServer/Documents/docs/NETWORK-SOLUTIONS-HOSTING-HANDOFF.md`](/Library/WebServer/Documents/docs/NETWORK-SOLUTIONS-HOSTING-HANDOFF.md)
