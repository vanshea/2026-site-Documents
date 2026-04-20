# Backup And Static Workflow

This workflow keeps two separate deliverables:

1. A private backup of the full dynamic site as it exists on this machine
2. A static SiteGround-friendly export for simple hosting

## Commands

Create only the dynamic backup:

```bash
npm run backup:dynamic
```

Create both the dynamic backup and the static hosting package:

```bash
npm run backup:dynamic-and-static
```

Create only the SiteGround static package:

```bash
npm run siteground:bundle
```

## Dynamic Backup Output

The dynamic backup is written to:

- `~/Backups/portfolio-site/dynamic-preserved/<timestamp>/`

It includes:

- the current working copy of the project
- `.env`
- `analytics-ui/`
- `server.js`
- `content/`
- `clients/`
- `docs/`
- `views/`
- `assets/`
- `prisma/`
- private SQLite copies when present

It excludes:

- `.git/`
- `node_modules/`
- `.next/`

The backup also creates a zip file beside the folder when the `zip` command is available.

## Static Output

The static SiteGround package is written to:

- `~/Backups/portfolio-site/siteground-static-upload/`

It includes only the files needed for the static public site, pre-rendered case study pages, and `.htaccess` redirects for old dynamic routes.

## PostgreSQL Note

This workflow does not generate a fresh PostgreSQL dump by itself.

Reason:

- `pg_dump` was not available on this machine when this workflow was added.

If you later install PostgreSQL client tools, you can extend the workflow to add a fresh analytics database dump.
