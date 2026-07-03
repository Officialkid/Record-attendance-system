# CAP Setup

This repository now runs as the Christhood Accountability Platform using Auth.js, Neon/Postgres, Cloudflare R2, Resend, and Groq. Firebase is not part of the current setup.

## 1. Create your local environment file

Copy:

```bash
.env.local.example -> .env.local
```

Then populate the real values for:

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

## 2. Install dependencies

```bash
npm install
```

## 3. Start the app

```bash
npm run dev
```

If you use a custom local port, make sure `NEXTAUTH_URL` matches it exactly and that the same callback URL is present in Google Cloud Console.

## 4. Sign in

Open the app in your browser and sign in with the Google account that should become CAP's main admin. In this project, the intended seeded main admin is controlled by `CAP_ADMIN_EMAIL`.

## 5. Verify readiness

Check:

- `/api/health` for environment readiness
- `/settings/profile` to confirm the signed-in account and role
- `/docs` for the in-app handoff checklist

## Supporting docs

- `docs/CAP_NEON_ENV_SETUP.md`
- `docs/CAP_PHASE2_ENV_CHECKLIST.md`
- `docs/CAP_ENV_HANDOFF.md`
