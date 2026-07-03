# Christhood Accountability Platform

Christhood Accountability Platform (CAP) is the internal operations portal for Christhood Outfield Ministries International.

## Current stack

- Next.js 15 + React 19
- Auth.js with Google sign-in
- Neon/Postgres for the active database path
- Cloudflare R2 for uploads and attachment storage
- Resend for email delivery
- Groq for AI summaries and report generation

Firebase is no longer part of the active CAP runtime or setup flow.

## What CAP includes

- Invite-only authentication with Google and credentials-based onboarding support
- Department-scoped roles and approval workflows
- Weekly ministry records with visitors and WhatsApp-ready summaries
- Insights, trends, anomaly detection, and accountability reporting
- Meetings, AI minutes extraction, and action item tracking
- Admin tools for departments, users, memberships, and field definitions

## Local setup

1. Copy `.env.local.example` to `.env.local`.
2. Fill in the required values from your real services.
3. Install dependencies and start the app:

```bash
npm install
npm run dev
```

## Required local environment values

- `DATABASE_URL`
- `NEXTAUTH_URL`
- `NEXTAUTH_SECRET`
- `AUTH_SECRET`
- `CAP_ADMIN_EMAIL`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `CRON_SECRET`
- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`
- `GROQ_API_KEY`
- `R2_ACCOUNT_ID`
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- `R2_BUCKET`

## Helpful docs

- `docs/CAP_NEON_ENV_SETUP.md`
- `docs/CAP_PHASE2_ENV_CHECKLIST.md`
- `docs/CAP_ENV_HANDOFF.md`

## Google OAuth note

If you run CAP on a non-default port such as `http://localhost:3003`, update both:

- `NEXTAUTH_URL` in `.env.local`
- the Google OAuth authorized redirect URI for `/api/auth/callback/google`
