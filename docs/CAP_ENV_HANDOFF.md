# CAP Env Handoff

This file is the practical handoff for the environment values you will eventually supply.

## Important Architecture Note

The current active CAP implementation in this repo is built around:

- local SQLite for development
- Cloudflare D1 for the intended production database path
- Cloudflare R2 for attachments
- an in-progress Postgres/Neon runtime path behind `CAP_DATABASE_DRIVER=postgres`

If you want to use **Neon** as the production database instead, the repo now has a real Postgres driver path started for that direction. It still needs live Neon proof before it can be treated as fully production-signed-off.

## Option A: Current Supported CAP Path

Use this path if you want to run the code as it is currently implemented.

Copy-ready template:

- `.env.d1.example`

### Core App

- `NEXTAUTH_URL`
- `NEXTAUTH_SECRET`
- `AUTH_SECRET`

### Database

- `CAP_DATABASE_DRIVER=d1`
- `CLOUDFLARE_ACCOUNT_ID`
- `CLOUDFLARE_API_TOKEN`
- `D1_DATABASE_ID`

For local-only development without D1:

- `CAP_DATABASE_DRIVER=sqlite`

### Attachments

- `R2_ACCOUNT_ID`
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- `R2_BUCKET`
- `R2_PUBLIC_BASE_URL`

### Google Auth

- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `CAP_ALLOW_CREDENTIALS_LOCAL`

Recommended:

- local/dev: `CAP_ALLOW_CREDENTIALS_LOCAL=true`
- production: `CAP_ALLOW_CREDENTIALS_LOCAL=false`

### Email

- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`

### Groq

- `GROQ_API_KEY`
- `GROQ_MODEL`

Recommended default:

- `GROQ_MODEL=llama-3.1-8b-instant`

### Google Calendar Sync

- `GOOGLE_CALENDAR_CLIENT_ID`
- `GOOGLE_CALENDAR_CLIENT_SECRET`

If these are blank, CAP falls back to:

- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`

### Scheduled Reminder Job

- `CRON_SECRET`
- `CAP_MEETING_REMINDER_HOURS`

Recommended default:

- `CAP_MEETING_REMINDER_HOURS=24`

### Seed / Bootstrap

- `CAP_ADMIN_NAME`
- `CAP_ADMIN_EMAIL`
- `CAP_ADMIN_PASSWORD`
- `CAP_DEFAULT_CURRENCY`
- `CAP_ANOMALY_THRESHOLD`

## Option B: Neon Pivot

Use this path only if you want me to deliberately migrate CAP from D1/SQLite SQL assumptions to Postgres/Neon.

Copy-ready template:

- `.env.neon.example`

You would need to provide at minimum:

- `CAP_DATABASE_DRIVER=postgres`
- `DATABASE_URL`

Typical Neon format:

- `DATABASE_URL=postgresql://USER:PASSWORD@HOST/DBNAME?sslmode=require`

Remaining work still expected for full Neon signoff:

- live-proof schema bootstrap against Neon
- execute the core CAP flows against Postgres, not just local SQLite
- confirm every write path and calendar/reporting path behaves correctly with real Postgres responses

## Practical Recommendation

If the goal is to finish CAP fastest and prove production behavior quickly:

1. keep the current D1/R2 direction
2. fill the variables from Option A
3. run live external-service proof
4. complete the final requirement audit

If the goal is specifically to standardize on Neon:

1. confirm that we are pivoting storage intentionally
2. I migrate the database layer and SQL behavior
3. then we produce the final Neon-only `.env` contract

## Runtime Verification

Once your real environment values are in place, use:

- `/api/health`

The endpoint reports:

- configured database driver
- active database driver
- database reachability
- whether Google Auth, Resend, Groq, R2, Google Calendar, and cron secret are configured
