# CAP Neon Environment Setup

This file is the safest copy-ready handoff for running CAP against Neon while keeping the rest of the integrations optional until you are ready.

## 1. Minimum required for CAP to boot on Neon

Copy these into your real `.env.local` file:

```env
NEXTAUTH_URL=http://localhost:3003
NEXTAUTH_SECRET=replace-with-a-long-random-string
AUTH_SECRET=replace-with-a-long-random-string

CAP_DATABASE_DRIVER=postgres
DATABASE_URL=postgresql://USER:PASSWORD@HOST/DBNAME?sslmode=require

CAP_ADMIN_NAME=CAP Administrator
CAP_ADMIN_EMAIL=danielmwalili1@gmail.com
CAP_ADMIN_PASSWORD=ChangeMe123!

CAP_DEFAULT_CURRENCY=KES
CAP_ANOMALY_THRESHOLD=25
CAP_ALLOW_CREDENTIALS_LOCAL=false

CRON_SECRET=replace-with-a-long-random-string
CAP_MEETING_REMINDER_HOURS=24
```

## 2. What you must provide yourself

- `DATABASE_URL`
  Use the Neon connection string for the CAP database.
- `NEXTAUTH_SECRET`
  A long random secret used by Auth.js.
- `AUTH_SECRET`
  Keep this aligned with your auth setup. Use another long random string.
- `CAP_ADMIN_EMAIL`
  This should be the Google account that becomes the seeded `main_admin`.
- `CAP_ADMIN_PASSWORD`
  Only used if local credentials fallback is enabled for development.
- `CRON_SECRET`
  Protects the reminder cron route.

## 3. Google sign-in and calendar

Add these when you are ready for real Google OAuth:

```env
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_CALENDAR_CLIENT_ID=
GOOGLE_CALENDAR_CLIENT_SECRET=
```

Notes:

- `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are required for Google login.
- The calendar client values are required for direct Google Calendar connection and event sync.
- If you are using one Google Cloud app for both auth and calendar scopes, the values may be the same.
- If the Google OAuth app is still in Testing status and requests `https://www.googleapis.com/auth/calendar.events`, the real account must be added under Google Auth Platform `Audience` -> `Test users` or Google will return `Error 403: access_denied`.

## 4. Reporting, email, and attachments

Add these as you enable each service:

```env
GROQ_API_KEY=
GROQ_MODEL=llama-3.1-8b-instant

RESEND_API_KEY=
RESEND_FROM_EMAIL=

R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET=
R2_PUBLIC_BASE_URL=
```

What each one does:

- `GROQ_API_KEY`
  Enables AI-generated leadership summaries and meeting-minutes extraction.
- `RESEND_API_KEY` and `RESEND_FROM_EMAIL`
  Enable approval emails, onboarding emails, and meeting reminder emails.
- `R2_*`
  Enable attachment uploads and source-document storage for meeting files.

## 5. D1 values

These are only needed if you intentionally switch CAP back to Cloudflare D1:

```env
CLOUDFLARE_ACCOUNT_ID=
CLOUDFLARE_API_TOKEN=
D1_DATABASE_ID=
```

If you are standardizing on Neon, leave them blank and keep:

```env
CAP_DATABASE_DRIVER=postgres
```

## 6. Recommended first real setup order

1. Fill in `DATABASE_URL`, auth secrets, seeded admin email, and `CRON_SECRET`.
2. Confirm `/api/health` reports `activeDriver: "postgres"`.
3. Add Google OAuth credentials and test sign-in.
4. Add Resend and test approval emails.
5. Add Groq and test executive report generation.
6. Add R2 and test meeting attachment upload.
7. Add calendar credentials and test event sync.

## 7. Current product expectation

The current codebase supports both D1-oriented and Neon/Postgres-oriented configuration paths, but if your launch target is Neon, the values you should focus on first are:

- `CAP_DATABASE_DRIVER=postgres`
- `DATABASE_URL`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`
- `GROQ_API_KEY`
- `R2_ACCOUNT_ID`
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- `R2_BUCKET`
- `CRON_SECRET`

## 8. Important caution

Do not commit real secrets into:

- `.env.local.example`
- `.env.neon.example`
- `.env.d1.example`
- any file under `docs/`

Keep real credentials only in your local `.env.local` or your deployment platform secret manager.
