# Site Functionality Read Me: Localhost

This file is the simple version of how to get the site running on your computer.

If anything changes about:
- startup commands
- ports
- environment variables
- databases
- login routes

this file should be updated at the same time.

## What This Site Uses

This project has 4 moving parts:

1. The main website server
   - Express
   - runs on port `3000`

2. The analytics / client interface
   - Next.js
   - runs on port `3001`
   - Express shows it publicly at `/analytics`

3. PostgreSQL
   - stores analytics data
   - must be running for the analytics dashboard to work

4. SQLite
   - stores client password hashes
   - file path comes from `CLIENT_SECRETS_DB_PATH`
   - default path is `/data/client-secrets.sqlite` only when that env var is not set
   - you do not start this manually
   - it is created automatically when needed

## Before You Start

You need:
- Node.js installed
- PostgreSQL installed and running
- this project on your machine

## First-Time Setup

From the project root:

```bash
npm install
npm --prefix analytics-ui install
```

Create your environment file:

```bash
cp .env.example .env
```

Then fill in `.env`.

Minimum things to set:
- `DATABASE_URL`
- `SESSION_SECRET`
- `TRUSTED_WEB_ORIGINS`
- `CLIENT_ACCESS_COOKIE_SECRET`
- `ADMIN_SESSION_COOKIE_SECRET`
- `ANALYTICS_HOME_ADMIN_PASSWORD`

## Start PostgreSQL

PostgreSQL must be running before analytics pages can work.

If PostgreSQL is not running:
- start it with your normal Postgres app or service manager
- make sure the database in `DATABASE_URL` exists

## Set Up The Postgres Tables

Run:

```bash
npm run prisma:generate
npm run prisma:migrate
```

You usually only need to do this:
- the first time
- after schema changes

## Start Localhost

Run:

```bash
npm run dev
```

That starts:
- Express on `http://localhost:3000`
- Next.js on `http://localhost:3001`

## What To Open In The Browser

Main entry:
- `http://localhost:3000` (redirects to the Build sandbox)

Live site:
- `http://localhost:3000/livesite/`

Coming-soon site:
- `http://localhost:3000/comingsoon/`

Build sandbox:
- `http://localhost:3000/build/`

Analytics login:
- `http://localhost:3000/login`

Client landing page:
- `http://localhost:3000/analytics/clients`

Client admin:
- `http://localhost:3000/analytics/home`

Client admin login:
- `http://localhost:3000/analytics/home/login`

## Public Site Folder Layout

Static variant folders:
- Build, for every new public change: [`/Library/WebServer/Documents/build`](/Library/WebServer/Documents/build)
- Livesite, for manually approved publication files only: [`/Library/WebServer/Documents/livesite`](/Library/WebServer/Documents/livesite)
- Coming soon: [`/Library/WebServer/Documents/comingsoon`](/Library/WebServer/Documents/comingsoon)

Shared assets used by those folders:
- [`/Library/WebServer/Documents/assets`](/Library/WebServer/Documents/assets)
- [`/Library/WebServer/Documents/large_web_portfolio`](/Library/WebServer/Documents/large_web_portfolio)

Static FTP bundle commands:
- `npm run livesite:bundle`
- `npm run comingsoon:bundle`

Build refresh command:
- `npm run build:sync`

General sync and VSCimage refreshes do not modify Livesite. Promote reviewed
files from Build to Livesite manually.

## Passwords

Analytics login (`/login`):
- uses the username and password values from `.env`
- example keys:
  - `ANALYTICS_ADMIN_USERNAME`
  - `ANALYTICS_ADMIN_PASSWORD`
  - `ANALYTICS_VIEWER_USERNAME`
  - `ANALYTICS_VIEWER_PASSWORD`

Client admin login (`/analytics/home/login`):
- password comes from:
  - `ANALYTICS_HOME_ADMIN_PASSWORD`

Client passwords:
- are set from `/analytics/home`
- are never shown back to you
- are stored only as hashes in SQLite

VSCimage admin:
- `/vscimage` now requires an authenticated analytics admin session

## Client Content Files

Public client registry:
- [`/Library/WebServer/Documents/content/clients/index.json`](/Library/WebServer/Documents/content/clients/index.json)

Client slide content:
- [`/Library/WebServer/Documents/content/clients`](/Library/WebServer/Documents/content/clients)

Per-client folders:
- [`/Library/WebServer/Documents/clients`](/Library/WebServer/Documents/clients)

Each client folder includes:
- `/clients/<clientId>/images/`
- `/clients/<clientId>/http/README.md`

## Add A New Client

Easiest way:
- go to `http://localhost:3000/analytics/home`
- use the `Add client` form

This creates:
- a new registry entry
- a new `/content/clients/<clientId>.json` file
- a new `/clients/<clientId>/images/` folder
- a new `/clients/<clientId>/http/README.md`

Optional command-line version:

```bash
npm run client:scaffold -- acme --title "ACME" --access password
```

## Stop Localhost

In the terminal where `npm run dev` is running:

```bash
Ctrl + C
```

## If Something Is Not Working

Check these first:

1. Is PostgreSQL running?
2. Did you create `.env`?
3. Did you run `npm install` in both places?
4. Did you run `npm run prisma:migrate`?
5. Is `npm run dev` still running?
6. Are you using `http://localhost:3000/...` and not just `http://localhost/...`?

## Simple Rule For Future Changes

If you change anything that affects:
- how localhost starts
- ports
- login paths
- env vars
- database setup

update this file immediately.
