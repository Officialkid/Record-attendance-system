# CAP User Guide

This guide reflects the current Christhood Accountability Platform setup. Firebase-based instructions are no longer applicable.

## Signing in

1. Open the CAP app in your browser.
2. Choose `Sign in with Google`.
3. Use the Google account that has been approved or seeded for CAP access.
4. If this is your first sign-in and your department access is still pending, CAP will show a pending-access state instead of a blank page.

## Profile page

Visit `/settings/profile` to confirm:

- your signed-in email
- your CAP role
- your system role
- your assigned departments
- whether Google Calendar is connected

This page is also where a first-time credentials-based user can change their onboarding password.

## Core areas

- `Dashboard`: high-level ministry operations overview
- `Weekly Record`: create a new department record
- `Records`: view saved weekly records
- `Insights`: trends, anomaly flags, and accountability reporting
- `Meetings`: meeting summaries, minutes, and action items
- `Notifications`: in-app reminders and updates
- `Admin`: departments, users, memberships, and approval actions
- `Setup Docs`: current deployment and environment checklist

## Google Calendar

From the profile page, use `Connect Google Calendar` to grant CAP access for calendar event creation. CAP can still send normal reminders even if a user never connects their calendar.

## Health check

Open `/api/health` to confirm:

- database connectivity
- auth configuration
- R2 readiness
- Resend readiness
- Groq readiness
- any remaining missing environment values

## Troubleshooting

### Google sign-in fails

- Confirm `NEXTAUTH_URL` matches the exact local or deployed base URL.
- Confirm Google Cloud Console includes the matching redirect URI for `/api/auth/callback/google`.

### Email notifications do not send

- Confirm both `RESEND_API_KEY` and `RESEND_FROM_EMAIL` are set.
- Confirm the sender address or domain is verified in Resend.

### File uploads fail

- Confirm the `R2_*` values are present and point to the intended bucket.

### Calendar connection fails

- Confirm the Google OAuth client allows the callback URL currently in use.
- If separate calendar credentials are not provided, CAP falls back to `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`.
