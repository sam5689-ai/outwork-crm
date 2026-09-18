# Outwork CRM

A CRM for managing potential clients and candidates. Contacts can be converted
into **clients** (companies you're placing candidates with) or **candidates**
(people looking for work), each with their own pipeline:

- **Client stages:** Interested → Candidate Matched → Contract Signed → Trial Passed
- **Candidate stages:** Sourced → Suitable For Roles → Matched To Client → Accepted

Candidates are matched to a client's open jobs, and matches move through
Proposed → Accepted/Rejected. The app also scaffolds Gmail and Google Meet
integration so emails and meetings can be linked to a contact's timeline.

## Tech stack

- [Next.js](https://nextjs.org) (App Router) + TypeScript + Tailwind CSS
- [Prisma](https://prisma.io) + PostgreSQL
- [Auth.js / NextAuth](https://authjs.dev) with a username/password (credentials) login and Admin/User roles
- [googleapis](https://github.com/googleapis/google-api-nodejs-client) for Gmail + Google Calendar/Meet

## Getting started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Copy `.env.example` to `.env` and fill in the values:

```bash
cp .env.example .env
```

- `DATABASE_URL` — a PostgreSQL connection string.
- `AUTH_SECRET` — generate one with `openssl rand -base64 32`.
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` / `GOOGLE_REDIRECT_URI` — see
  [Google integration setup](#google-integration-setup) below. The app runs
  fine without these; Settings → Integrations will just show a "not
  configured" notice until they're added.
- `SEED_ADMIN_USERNAME` / `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` — the
  first admin account created by the seed script.

### 3. Set up the database

```bash
npm run db:migrate   # applies Prisma migrations
npm run db:seed       # creates the first admin user + default settings
```

### 4. Run the app

```bash
npm run dev
```

Visit `http://localhost:3000` and log in with the admin username/password
from your `.env` (defaults to `admin` / `ChangeMe123!` if unset — change
this after first login via Settings → Users).

## Logins and roles

There's no self-service sign-up. An **Admin** creates logins for teammates
under **Settings → Users**, choosing a username, temporary password and role
(`Admin` or `User`). Admins can manage branding, users and see everyone's
data; regular Users manage contacts/clients/candidates and their own Google
connection.

## Google integration setup

Gmail and Google Meet syncing use Google OAuth. To enable it:

1. Create a project in the [Google Cloud Console](https://console.cloud.google.com/).
2. Enable the **Gmail API** and **Google Calendar API**.
3. Under **APIs & Services → Credentials**, create an **OAuth Client ID**
   (type: Web application).
4. Add an authorized redirect URI matching `GOOGLE_REDIRECT_URI` in your
   `.env` (e.g. `http://localhost:3000/api/google/callback` for local dev).
5. Copy the generated Client ID and Client Secret into `GOOGLE_CLIENT_ID`
   and `GOOGLE_CLIENT_SECRET` in `.env`, and restart the dev server.

Once configured, each user connects their own Google account from
**Settings → Integrations**. After connecting, opening a contact shows a
"Schedule Google Meet" button that creates a calendar event with a Meet
link and saves it to that contact's timeline. Gmail message linking uses
the same connection; the current scaffolding stores emails against a
contact (`EmailMessage` model) and is ready for a sync job to populate it
via the Gmail API.

## Deploying to Railway

The repo includes a `railway.json` and a `start:prod` script (`prisma migrate
deploy && next start`), so Railway's default Nixpacks build works out of the
box:

1. **New Project → Deploy from GitHub repo**, pick this repo/branch.
2. **Add a Postgres database** to the same Railway project (`+ New` →
   `Database` → `PostgreSQL`), then in the app service's **Variables** tab
   add `DATABASE_URL` as a reference to the Postgres plugin's connection
   string (Railway suggests this automatically once both services are in
   the same project).
3. Add the rest of the required variables on the app service:
   - `AUTH_SECRET` — `openssl rand -base64 32`
   - `NEXTAUTH_URL` — your Railway public domain, e.g.
     `https://outwork-crm.up.railway.app` (set this after Railway assigns a
     domain under **Settings → Networking → Generate Domain**)
   - `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` / `GOOGLE_REDIRECT_URI` —
     optional; set `GOOGLE_REDIRECT_URI` to
     `https://<your-domain>/api/google/callback` and add that same URL to
     the OAuth client's authorized redirect URIs in Google Cloud Console
   - `SEED_ADMIN_USERNAME` / `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` —
     only read by the manual seed step below, not by the app at runtime
4. Deploy. Railway builds with `npm run build` and starts with
   `npm run start:prod`, which applies any pending Prisma migrations before
   starting the server — safe to run on every boot. `next start` binds to
   Railway's `$PORT` automatically.
5. **Create the first admin user** — this only needs to run once, so it's
   not part of the boot command. Use the Railway CLI:
   ```bash
   railway link      # link to your project, if not already
   railway run npm run db:seed
   ```
   (or open a shell on the service from the Railway dashboard and run
   `npm run db:seed` there).

Why Railway over Vercel here: the Prisma client uses a raw `pg` connection
pool (`@prisma/adapter-pg`), which assumes a long-lived Node process reusing
one pool — exactly how Railway runs the app. Vercel's serverless functions
spin up per-request and tend to exhaust Postgres connections with a raw
pool unless you add a pooler (Neon/Supabase pooled connection string or
PgBouncer); Railway avoids that extra piece entirely.

## Project structure

```
prisma/schema.prisma        Data model (users, contacts, clients, candidates, jobs, matches, emails, meetings, settings)
prisma/seed.ts               Seeds an admin user and default settings
src/app/(dashboard)/...      Authenticated app pages (dashboard, contacts, clients, candidates, jobs, settings)
src/app/login/               Login page
src/app/api/google/...       Google OAuth connect/callback routes
src/lib/                     Prisma client, auth config, Google OAuth helpers, stage/label constants
src/components/              Shared UI (cards, buttons, forms) and feature components
```

## Useful scripts

```bash
npm run dev          # start the dev server
npm run build         # production build
npm run start:prod    # apply pending migrations, then start (used in production)
npm run lint          # eslint
npm run db:migrate    # run Prisma migrations
npm run db:seed       # seed the database
npm run db:studio     # open Prisma Studio to browse data
```
