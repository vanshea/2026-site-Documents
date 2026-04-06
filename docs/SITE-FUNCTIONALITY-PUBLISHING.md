# Site Functionality Read Me: Publishing Online

This file is the simple version of how to put the site on the internet.

If anything changes about:
- deployment steps
- required services
- build commands
- environment variables
- databases
- domain routing

this file should be updated at the same time.

## Simple Version

To publish this project online, you need:

1. A server or host for the code
2. A PostgreSQL database
3. A persistent place to keep the SQLite file
4. A domain name

## Easiest Hosting Shape

The simplest mental model is:

1. One checked-out copy of this repo on a server
2. Express running on port `3000`
3. Next.js running on port `3001`
4. PostgreSQL running separately or on the same server
5. A reverse proxy like Nginx or Caddy sending web traffic to Express

This project is easiest to publish when:
- the whole repo stays together
- Express and Next both run from the same repo
- the `content` and `clients` folders stay beside the code
- the SQLite password DB lives at the absolute path in `CLIENT_SECRETS_DB_PATH`

## Important Folders To Keep

Do not lose these folders in production:

- `/content/clients`
- `/clients`

Why:
- `/content/clients` holds the client registry and slide files
- `/clients` holds client images and `/http` folders
- the SQLite file at `CLIENT_SECRETS_DB_PATH` holds hashed client passwords

## Before Publishing

On the server:

1. Copy the repo to the server
2. Install Node.js
3. Install dependencies
4. Create the `.env` file
5. Set up PostgreSQL
6. Run Prisma deploy
7. Build the Next app
8. Start both Node processes

## Install Dependencies

From the repo root:

```bash
npm install
npm --prefix analytics-ui install
```

## Create Environment Variables

Create a production `.env` file.

Important values:
- `PORT=3000`
- `DATABASE_URL=...`
- `SESSION_SECRET=...`
- `TRUSTED_WEB_ORIGINS=https://example.com,https://www.example.com`
- `CLIENT_ACCESS_COOKIE_SECRET=...`
- `ADMIN_SESSION_COOKIE_SECRET=...`
- `CLIENT_PASSWORD_PEPPER=...`
- `CLIENT_SECRETS_DB_PATH=/var/lib/portfolio-site/client-secrets.sqlite`
- `ANALYTICS_UI_ENABLED=true`
- `ANALYTICS_UI_ORIGIN=http://127.0.0.1:3001`
- `ANALYTICS_HOME_ADMIN_PASSWORD=...`

Also set your analytics login credentials:
- `ANALYTICS_ADMIN_USERNAME`
- `ANALYTICS_ADMIN_PASSWORD`
- `ANALYTICS_VIEWER_USERNAME`
- `ANALYTICS_VIEWER_PASSWORD`

## Set Up Postgres

Make sure your production PostgreSQL database exists.

Then run:

```bash
npm run prisma:generate
npm run prisma:deploy
```

## Build The Next App

Run:

```bash
npm --prefix analytics-ui run build
```

## Start The Site

Start Express:

```bash
npm start
```

Start Next:

```bash
npm --prefix analytics-ui run start
```

You need both running at the same time.

## What Each Process Does

Express:
- serves the main site
- handles `/login`
- proxies `/analytics/*` to Next

Next:
- serves `/analytics`
- serves `/analytics/clients`
- serves `/analytics/home`

## Put It Behind A Domain

Your reverse proxy should send public web traffic to:

- Express on port `3000`

The browser should never need to talk directly to port `3001`.

## Production URLs

Once deployed, these are the main paths:

- `/`
- `/login`
- `/analytics`
- `/analytics/clients`
- `/analytics/home`

## Password Notes

Analytics login:
- comes from `.env`

Client admin login:
- comes from `ANALYTICS_HOME_ADMIN_PASSWORD`

Client passwords:
- are created inside `/analytics/home`
- are stored only as hashes in SQLite
- are never shown in plaintext later

## Very Important Production Notes

1. Keep the SQLite file at `CLIENT_SECRETS_DB_PATH` persistent.
   - if the server is rebuilt and this file is lost, client password hashes are lost

2. Keep the `content` and `clients` folders persistent.
   - those folders contain the client content and images

3. Use HTTPS in production.
   - cookies are marked secure in production

4. Restart both services after code changes.
   - Express must reload `server.js`
   - Next must reload the built app

## Recommended Simple Process Manager

If you are on a VPS, use something like:
- PM2
- systemd

That way both Node processes restart automatically if the server reboots.

## If The Site Is Online But Broken

Check these first:

1. Is Express running?
2. Is Next running?
3. Is PostgreSQL reachable?
4. Is `.env` present?
5. Did you run `npm --prefix analytics-ui run build`?
6. Does `ANALYTICS_UI_ORIGIN` point to `http://127.0.0.1:3001`?
7. Does `TRUSTED_WEB_ORIGINS` include your production domain?
8. Are the `content` and `clients` folders still present, and is `CLIENT_SECRETS_DB_PATH` reachable?

## Simple Rule For Future Changes

If you change anything that affects:
- build commands
- startup commands
- deployment shape
- env vars
- ports
- domain routing
- database storage

update this file immediately.
