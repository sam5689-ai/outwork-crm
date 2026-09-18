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
npm run lint          # eslint
npm run db:migrate    # run Prisma migrations
npm run db:seed       # seed the database
npm run db:studio     # open Prisma Studio to browse data
```
