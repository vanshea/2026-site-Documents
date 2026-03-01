# Network Solutions Hosting Handoff

This document is for the hosting company.

It explains how this site should be launched and kept running online.

Do not place real private passwords inside this document.
Any actual secrets should be shared separately through a secure method.

## Project Summary

This website is not a plain static site.

It requires:
- one Express server
- one Next.js server
- one PostgreSQL database
- one local SQLite file for client password hashes
- persistent file storage for client content and images

## Required Hosting Support

The hosting environment must support:
- Node.js
- long-running Node processes
- PostgreSQL connection access
- reverse proxy or routing support
- persistent file storage
- SSL / HTTPS

Important:
- this site needs 2 Node processes running at the same time
- if the hosting plan does not support that, this project should be placed on a VPS or another Node-capable environment

## What Must Run

### Process 1

Express app:

```bash
npm start
```

Runs on:
- port `3000`

Purpose:
- serves the main website
- handles `/login`
- proxies `/analytics/*` into the Next app

### Process 2

Next app:

```bash
npm --prefix analytics-ui run start
```

Runs on:
- port `3001`

Purpose:
- serves `/analytics`
- serves `/analytics/clients`
- serves `/analytics/home`

## Required Build Step

Before starting the Next app, run:

```bash
npm --prefix analytics-ui run build
```

## Required Install Step

Run once after deployment or after pulling code changes:

```bash
npm install
npm --prefix analytics-ui install
```

## Database Requirements

### PostgreSQL

This site uses PostgreSQL for analytics data.

Provide:
- a live PostgreSQL database
- a working `DATABASE_URL`

Run after database setup:

```bash
npm run prisma:generate
npm run prisma:deploy
```

### SQLite

This site also uses a local SQLite file for client password hashes.

File path:
- `/data/client-secrets.sqlite`

This file is created automatically by the app.

The `/data` folder must be persistent.

## Folders That Must Be Preserved

These folders are part of the live site and must not be deleted between deploys:

- `/content/clients`
- `/clients`
- `/data`

Purpose:
- `/content/clients` = client registry and client slide JSON
- `/clients` = client images and client `/http` folders
- `/data` = SQLite file storing hashed client passwords

## Environment Variables Required

These values must be present in the production `.env` file:

- `PORT=3000`
- `DATABASE_URL=<TO BE PROVIDED>`
- `SESSION_SECRET=<TO BE PROVIDED>`
- `CLIENT_ACCESS_COOKIE_SECRET=<TO BE PROVIDED>`
- `ADMIN_SESSION_COOKIE_SECRET=<TO BE PROVIDED>`
- `CLIENT_PASSWORD_PEPPER=<OPTIONAL_TO_BE_PROVIDED>`
- `ANALYTICS_UI_ENABLED=true`
- `ANALYTICS_UI_ORIGIN=http://127.0.0.1:3001`
- `ANALYTICS_SESSION_TTL_MINUTES=<SET_VALUE>`
- `ANALYTICS_ADMIN_USERNAME=<TO BE PROVIDED>`
- `ANALYTICS_ADMIN_PASSWORD=<TO BE PROVIDED>`
- `ANALYTICS_VIEWER_USERNAME=<TO BE PROVIDED>`
- `ANALYTICS_VIEWER_PASSWORD=<TO BE PROVIDED>`

Optional if used:
- `RESEND_API_KEY=<TO BE PROVIDED>`
- `CONTACT_TO_EMAIL=<TO BE PROVIDED>`
- `CONTACT_FROM_EMAIL=<TO BE PROVIDED>`
- `GA4_MEASUREMENT_ID=<TO BE PROVIDED>`

## Reverse Proxy / Public Routing

Public traffic should go to:
- Express on port `3000`

The browser should not directly use port `3001`.

The Express app routes traffic to the Next app internally.

## Public Paths

Main website:
- `/`

Analytics login:
- `/login`

Analytics app:
- `/analytics`

Client pages:
- `/analytics/clients`

Client admin:
- `/analytics/home`

## Password Handling Rules

Do not place real passwords inside project documentation.

Do not place client passwords in JSON files.

Client passwords:
- are set inside `/analytics/home`
- are stored only as hashes in SQLite
- are never displayed back to the user

If the hosting company needs environment secrets:
- provide them separately through a secure channel
- do not commit them into the repository
- do not email them in plain text unless there is no safer option

## Client Admin Login

The client admin area is:
- `/analytics/home/login`

The current admin password is not listed in this document.

If the hosting company truly needs that password for launch support:
- provide it separately and securely
- change it afterward if needed

## Deployment Order

Use this order:

1. Upload or pull the repository
2. Run dependency installs
3. Create the production `.env`
4. Confirm PostgreSQL access
5. Run Prisma deploy
6. Build the Next app
7. Start Express
8. Start Next
9. Confirm HTTPS and site routing
10. Confirm these URLs work:
   - `/`
   - `/login`
   - `/analytics`
   - `/analytics/clients`
   - `/analytics/home/login`

## Ongoing Maintenance

After code changes that affect startup or hosting:
- pull latest code
- run installs if dependencies changed
- rebuild Next
- restart both Node processes

## Contact Note

If the hosting team says the plan does not support:
- persistent Node.js apps
- two running Node services
- PostgreSQL access
- persistent writable storage

then this project should be moved to a Node-friendly hosting environment.
