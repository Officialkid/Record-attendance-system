# CAP Phase 2 Env Checklist

This is the current environment checklist for the Phase 2 direction now being implemented.

## Core App

- `NEXTAUTH_URL`
- `NEXTAUTH_SECRET`
- `AUTH_SECRET`

## Database

Current codebase direction:

- `CAP_DATABASE_DRIVER`
- `CLOUDFLARE_ACCOUNT_ID`
- `CLOUDFLARE_API_TOKEN`
- `D1_DATABASE_ID`

Important note:

The current repo now has:

- the primary D1 path
- the local SQLite fallback path
- an in-progress Postgres/Neon driver path behind `CAP_DATABASE_DRIVER=postgres`

Postgres support is no longer just documentation, but it still needs live Neon proof before it can be treated as fully signed off.

## Postgres / Neon

- `CAP_DATABASE_DRIVER=postgres`
- `DATABASE_URL`

## R2 Attachments

- `R2_ACCOUNT_ID`
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- `R2_BUCKET`
- `R2_PUBLIC_BASE_URL`

## Google Auth

- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `CAP_ALLOW_CREDENTIALS_LOCAL`

## Email Delivery

- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`

Current implementation note:

- request, approval, and admin-added onboarding emails are now wired in code
- if the Resend env vars are missing, CAP safely skips sending instead of crashing

## Groq AI

- `GROQ_API_KEY`
- `GROQ_MODEL`

Recommended default:

- `llama-3.1-8b-instant`

## Local Development Note

Until Google OAuth is fully connected, the app can keep a local credentials fallback for development only.

- Set `CAP_ALLOW_CREDENTIALS_LOCAL=true` only for local/dev use
- Keep it `false` in production once Google sign-in is active

## Optional Google Calendar

- `GOOGLE_CALENDAR_CLIENT_ID`
- `GOOGLE_CALENDAR_CLIENT_SECRET`

Current implementation note:

- CAP now includes the `calendar_connections` persistence table, profile connection UI, and Google refresh-token persistence through the Auth.js Google callback
- users can connect or disconnect Google Calendar access from the profile page
- connected users can now receive synced all-day Google Calendar events for meetings that include a `next_meeting_date`
- calendar API calls use `GOOGLE_CALENDAR_CLIENT_ID` / `GOOGLE_CALENDAR_CLIENT_SECRET` when present, and otherwise fall back to `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`

## Reminder Scheduling

- `CRON_SECRET`
- `CAP_MEETING_REMINDER_HOURS`

Current implementation note:

- CAP now exposes a protected cron endpoint at `/api/cron/meeting-reminders`
- the default reminder window is 24 hours before the `next_meeting_date`
- reminders create in-app CAP notifications and attempt Resend email delivery for approved department members

## Seed/Admin Setup

These are still useful for local/dev bootstrap:

- `CAP_ADMIN_NAME`
- `CAP_ADMIN_EMAIL`
- `CAP_ADMIN_PASSWORD`
- `CAP_DEFAULT_CURRENCY`
- `CAP_ANOMALY_THRESHOLD`
