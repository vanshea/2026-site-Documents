# Design Portfolio Site

Portfolio site with an Express backend, a password-protected first-party analytics dashboard, and file-backed client presentation rooms.

Simple how-to guides:
- Localhost: [`/Library/WebServer/Documents/docs/SITE-FUNCTIONALITY-LOCAL.md`](/Library/WebServer/Documents/docs/SITE-FUNCTIONALITY-LOCAL.md)
- Publishing online: [`/Library/WebServer/Documents/docs/SITE-FUNCTIONALITY-PUBLISHING.md`](/Library/WebServer/Documents/docs/SITE-FUNCTIONALITY-PUBLISHING.md)
- Network Solutions handoff: [`/Library/WebServer/Documents/docs/NETWORK-SOLUTIONS-HOSTING-HANDOFF.md`](/Library/WebServer/Documents/docs/NETWORK-SOLUTIONS-HOSTING-HANDOFF.md)
- SiteGround static FTP handoff: [`/Library/WebServer/Documents/docs/SITEGROUND-STATIC-FTP-HANDOFF.md`](/Library/WebServer/Documents/docs/SITEGROUND-STATIC-FTP-HANDOFF.md)
- Dynamic backup + static export workflow: [`/Library/WebServer/Documents/docs/BACKUP-AND-STATIC-WORKFLOW.md`](/Library/WebServer/Documents/docs/BACKUP-AND-STATIC-WORKFLOW.md)

Maintenance rule:
- If startup, localhost, deployment, database, env var, or domain-routing behavior changes, update all of the docs above in the same change.

## Stack

- Portfolio + ingestion API: Node.js + Express (`server.js`)
- Analytics storage: PostgreSQL + Prisma
- Analytics UI: Next.js 14 + TypeScript + Tailwind + Recharts (mounted at `/analytics`)
- Client content: `/content/clients/index.json` registry + `/content/clients/<clientId>.json`
- Client secret storage: SQLite (`CLIENT_SECRETS_DB_PATH`, defaults to `/data/client-secrets.sqlite` only when unset)

## Local Setup

1. Install dependencies for both apps:

```bash
npm install && npm --prefix analytics-ui install
```

2. Run both servers (Express + Next.js UI):

```bash
npm run dev
```

Open:
- Portfolio hub: [http://localhost:3000](http://localhost:3000)
- Live site: [http://localhost:3000/livesite/](http://localhost:3000/livesite/)
- Coming soon: [http://localhost:3000/comingsoon/](http://localhost:3000/comingsoon/)
- Build sandbox: [http://localhost:3000/build/](http://localhost:3000/build/)
- Analytics login: [http://localhost:3000/login](http://localhost:3000/login)
- Analytics app (after login): [http://localhost:3000/analytics](http://localhost:3000/analytics)
- Client rooms: [http://localhost:3000/analytics/clients](http://localhost:3000/analytics/clients)
- Client admin: [http://localhost:3000/analytics/home](http://localhost:3000/analytics/home)

Static variant folders:
- Live site: [`/Library/WebServer/Documents/livesite`](/Library/WebServer/Documents/livesite)
- Coming-soon site: [`/Library/WebServer/Documents/comingsoon`](/Library/WebServer/Documents/comingsoon)
- Build variant: [`/Library/WebServer/Documents/build`](/Library/WebServer/Documents/build)

Each variant folder now contains a complete static copy of:
- `index.html`
- `experience.html`
- `case-studies/`
- `assets/`
- `large_web_portfolio/`
- `.htaccess`

## Environment Variables

Copy `.env.example` to `.env` and set:

- `PORT`: Express port (`3000` by default)
- `DATABASE_URL`: Postgres connection string
- `SESSION_SECRET`: long random session secret
- `TRUSTED_WEB_ORIGINS`: comma-separated browser origins allowed to call first-party APIs and Next server actions
- `ANALYTICS_ADMIN_USERNAME` / `ANALYTICS_ADMIN_PASSWORD`: admin credentials
- `ANALYTICS_HOME_ADMIN_PASSWORD`: password for `/analytics/home`
- `ANALYTICS_VIEWER_USERNAME` / `ANALYTICS_VIEWER_PASSWORD`: read-only viewer credentials
- `ANALYTICS_UI_ENABLED`: enable Next.js proxy mount (`true`)
- `ANALYTICS_UI_ORIGIN`: Next.js origin (`http://127.0.0.1:3001`)
- `CLIENT_ACCESS_COOKIE_SECRET`: signing secret for per-client unlock cookies
- `ADMIN_SESSION_COOKIE_SECRET`: signing secret for the `/home` admin cookie
- `CLIENT_PASSWORD_PEPPER`: optional extra server-side pepper for Argon2 client password hashes
- `CLIENT_SECRETS_DB_PATH`: optional absolute path for the SQLite password DB outside the repo/web root
- `ANALYTICS_SESSION_TTL_MINUTES`: session timeout
- `ANALYTICS_COLLECT_ENABLED`, `ANALYTICS_DASHBOARD_ENABLED`
- Optional mail settings: `RESEND_API_KEY`, `CONTACT_TO_EMAIL`, `CONTACT_FROM_EMAIL`

Next client-room auth reads env vars from the normal process environment and falls back to the root [`/Library/WebServer/Documents/.env`](/Library/WebServer/Documents/.env) file, so the same `.env` can drive both Express and the Next app locally.

## Client Content

Runtime source of truth:
- Registry: [`/Library/WebServer/Documents/content/clients/index.json`](/Library/WebServer/Documents/content/clients/index.json)
- Full slide content: [`/Library/WebServer/Documents/content/clients`](/Library/WebServer/Documents/content/clients)
- Per-client folders: [`/Library/WebServer/Documents/clients`](/Library/WebServer/Documents/clients)

Per-client structure:
- `/clients/<clientId>/images/`
- `/clients/<clientId>/http/README.md`
- `/content/clients/<clientId>.json`

Security rule:
- No slide JSON is read before auth passes. The page loads only lightweight metadata from `index.json`, checks the signed per-client cookie for `access="password"` clients, redirects to the unlock page if needed, and only then reads `/content/clients/<clientId>.json`.

## Home Admin

How `/home` works:
- Route path in the Next app is `/home`, exposed publicly at `/analytics/home` because the app uses `basePath: /analytics`.
- Login page is `/analytics/home/login`.
- The admin password comes from `ANALYTICS_HOME_ADMIN_PASSWORD`.
- Successful login sets a signed `httpOnly` `admin_session` cookie with a 12 hour max age.
- `/home` never displays any stored client password. Password resets are write-only and stored as Argon2 hashes in SQLite.
- Registry edits update [`/Library/WebServer/Documents/content/clients/index.json`](/Library/WebServer/Documents/content/clients/index.json).
- Client password resets upsert into the SQLite database pointed to by `CLIENT_SECRETS_DB_PATH`.

Warnings:
- No plaintext passwords are stored in JSON.
- No plaintext passwords are re-displayed by `/home`.
- `/vscimage` and `/api/vscimage/*` now require an authenticated analytics admin session.

Create a new client scaffold:

```bash
npm run client:scaffold -- acme --title "ACME" --access password
```

What the scaffold does:
- creates `/clients/<clientId>/images/cover.svg`
- creates `/clients/<clientId>/http/README.md`
- creates `/content/clients/<clientId>.json`
- upserts the lightweight registry entry in `content/clients/index.json`

## Prisma

Generate and migrate:

```bash
npm run prisma:generate
npm run prisma:migrate
```

Production migration deploy:

```bash
npm run prisma:deploy
```

## Analytics API Surface

All endpoints require authenticated session:

- `GET /api/analytics/overview?from&to&compare=true`
- `GET /api/analytics/realtime?minutes=30`
- `GET /api/analytics/acquisition?from&to&dimension=sourceMedium|campaign`
- `GET /api/analytics/engagement/pages?from&to`
- `GET /api/analytics/engagement/case-studies?from&to`
- `GET /api/analytics/events?from&to&type=`
- `GET /api/analytics/conversions?from&to`
- `GET /api/analytics/funnels?from&to&funnel=home_to_contact|case_to_resume`
- `GET /api/analytics/export.csv?from&to&report=`

Supported filters via query params:
- `device`, `country`, `referrer`, `source`, `medium`, `campaign`, `page_path`, `case_study_slug`, `q`

## Deploy

Run two processes (or two containers):

1. Express app:

```bash
npm start
```

2. Analytics UI:

```bash
npm --prefix analytics-ui run build && npm --prefix analytics-ui run start
```

Ensure `ANALYTICS_UI_ORIGIN` points to the deployed Next.js analytics UI service.

## Static FTP Exports

Refresh the complete static variant folders after source-content changes:

```bash
npm run variants:sync
```

Create a root-ready static export for the live site:

```bash
npm run livesite:bundle
```

Create a root-ready static export for the coming-soon site:

```bash
npm run comingsoon:bundle
```

Both commands write to `~/Backups/portfolio-site/<variant>-static-upload`.

## Launch-Ready FTP Upload

Create a clean upload folder with:

```bash
node scripts/create-launch-ready-bundle.mjs
```

This generates a clean FTP bundle without local secrets, SQL dumps, `node_modules`, or build artifacts.
By default the bundle is written to `~/Backups/portfolio-site/launch-ready` because the web root itself may be read-only.

## Existing APIs

- `POST /api/collect` (first-party analytics ingestion)
- `POST /api/contact`
- `GET /vscimage` + `/api/vscimage/*`
