# Design Portfolio Site

Portfolio site with an Express backend, a password-protected first-party analytics dashboard, and file-backed client presentation rooms.

## Stack

- Portfolio + ingestion API: Node.js + Express (`server.js`)
- Analytics storage: PostgreSQL + Prisma
- Analytics UI: Next.js 14 + TypeScript + Tailwind + Recharts (mounted at `/analytics`)
- Client content: `/content/clients/index.json` registry + `/clients/<clientId>/content.json`

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
- Portfolio: [http://localhost:3000](http://localhost:3000)
- Analytics login: [http://localhost:3000/login](http://localhost:3000/login)
- Analytics app (after login): [http://localhost:3000/analytics](http://localhost:3000/analytics)
- Client rooms: [http://localhost:3000/analytics/clients](http://localhost:3000/analytics/clients)

## Environment Variables

Copy `.env.example` to `.env` and set:

- `PORT`: Express port (`3000` by default)
- `DATABASE_URL`: Postgres connection string
- `SESSION_SECRET`: long random session secret
- `ANALYTICS_ADMIN_USERNAME` / `ANALYTICS_ADMIN_PASSWORD`: admin credentials
- `ANALYTICS_VIEWER_USERNAME` / `ANALYTICS_VIEWER_PASSWORD`: read-only viewer credentials
- `ANALYTICS_UI_ENABLED`: enable Next.js proxy mount (`true`)
- `ANALYTICS_UI_ORIGIN`: Next.js origin (`http://127.0.0.1:3001`)
- `CLIENT_ACCESS_COOKIE_SECRET`: signing secret for per-client unlock cookies
- `CLIENT_PASSWORD_<CLIENTID_UPPER_SNAKE>`: password for each `access="password"` client
- `ANALYTICS_SESSION_TTL_MINUTES`: session timeout
- `ANALYTICS_COLLECT_ENABLED`, `ANALYTICS_DASHBOARD_ENABLED`
- Optional mail settings: `RESEND_API_KEY`, `CONTACT_TO_EMAIL`, `CONTACT_FROM_EMAIL`

Next client-room auth reads env vars from the normal process environment and falls back to the root [`/Library/WebServer/Documents/.env`](/Library/WebServer/Documents/.env) file, so the same `.env` can drive both Express and the Next app locally.

## Client Content

Runtime source of truth:
- Registry: [`/Library/WebServer/Documents/content/clients/index.json`](/Library/WebServer/Documents/content/clients/index.json)
- Per-client content: [`/Library/WebServer/Documents/clients`](/Library/WebServer/Documents/clients)

Per-client structure:
- `/clients/<clientId>/content.json`
- `/clients/<clientId>/images/`
- `/clients/<clientId>/http/README.md`

Security rule:
- No slide JSON is read before auth passes. The page loads only lightweight metadata from `index.json`, checks the signed per-client cookie for `access="password"` clients, redirects to the unlock page if needed, and only then reads `/clients/<clientId>/content.json`.

Create a new client scaffold:

```bash
npm run client:scaffold -- acme --title "ACME" --access password
```

What the scaffold does:
- creates `/clients/<clientId>/content.json`
- creates `/clients/<clientId>/images/cover.svg`
- creates `/clients/<clientId>/http/README.md`
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

## Existing APIs

- `POST /api/collect` (first-party analytics ingestion)
- `POST /api/contact`
- `GET /vscimage` + `/api/vscimage/*`
