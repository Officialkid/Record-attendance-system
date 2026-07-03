# CAP Completion Audit

Date: 2026-07-02

This audit reflects the current repo state and local verification evidence for the CAP Phase 2 direction.

## Strongly Verified

- `npx tsc --noEmit` passes.
- `npm run build` passes.
- `http://localhost:3003/login` responds with `200 OK`.
- Dynamic rendering guards are now applied to the authenticated portal shell and session-dependent entry routes so production builds do not fail during Next.js page-data collection.
- CAP auth uses Auth.js with Google as the primary provider and an optional local credentials fallback for development.
- Phase 2 role model exists in the active CAP service layer:
  - `main_admin`
  - `chief_admin`
  - `department_admin`
  - `member`
- Department approval flow is implemented with:
  - pending department requests
  - admin approval / rejection
  - admin-added users with direct approved membership
  - Resend-backed request / approval / onboarding notifications
- CAP reporting now includes:
  - generated report persistence
  - Groq-backed executive summaries with fallback
  - DOCX export
  - print-friendly report view for PDF save
- CAP meetings now include:
  - AI summary persistence
  - pasted-notes AI extraction
  - uploaded `.txt`, `.docx`, and `.pdf` minutes extraction
  - source document R2 linking
- CAP reminders now include:
  - `user_notifications`
  - protected reminder cron route
  - Resend reminder email attempts
  - Google Calendar connection persistence
  - Google Calendar event sync for connected users when `next_meeting_date` is present
- CAP env handoff now includes:
  - scrubbed placeholder-only example env files
  - a Neon-first setup guide
  - explicit separation between required secrets and optional integrations
  - an in-app `/docs` setup page
  - health-based missing-env visibility inside admin and API health output

## Verified Legacy Lockdown

These public or old-product routes are still present but redirect into the CAP flow rather than exposing the old product:

- `/sign-up` -> `/login`
- `/sign-in` -> `/login`
- `/forgot-password` -> `/login`
- `/subscribe` -> `/login`
- `/analytics` -> `/insights`
- `/view-analytics` -> `/insights`
- `/visitors` -> `/records`

This means the old onboarding and analytics entry points are not active public flows anymore.

## Important Evidence Limits

The following are implemented in code, but not fully proven end-to-end in this local environment because real external credentials are not configured:

- D1 live proof
  - Current code supports Cloudflare D1 through env-backed remote queries.
  - Local proof still uses SQLite fallback.
- R2 live proof
  - Upload flow and attachment registration are implemented.
  - Real Cloudflare R2 upload/download proof still depends on production-like credentials.
- Google OAuth live proof
  - Auth.js Google flow is implemented.
  - Full live sign-in + calendar scope + refresh token persistence still needs real Google credentials.
- Resend live proof
  - Email delivery code is implemented.
  - Live request / approval / reminder email proof still needs real API credentials.
- Google Calendar live proof
  - Token persistence and event sync code are implemented.
  - Real calendar event creation/update/delete still needs connected Google OAuth credentials.

## Remaining Gaps Before Calling It Fully Finished

- Requirement-by-requirement final signoff has not yet been completed against every line of the Phase 2 spec.
- The repo still contains legacy Firebase / organization-era files outside the active CAP runtime path.
  - This is not the same as those flows being reachable, but the codebase is not yet fully purged.
- The active storage implementation is still aligned to the CAP D1 direction, not Neon/Postgres.
  - If Neon is the final decision, that is a real backend pivot rather than a simple `.env` fill-in step.

## Practical Conclusion

The current codebase is substantially beyond prototype state and now supports the main CAP Phase 2 workflows in the local build:

- invite-only auth and approvals
- dynamic department access
- records and insights
- generated leadership reporting
- meetings, attachments, and AI minutes assistance
- notifications, reminders, and calendar connection groundwork plus event sync
- safe env handoff guidance for Neon-backed deployment preparation

It is not yet honest to call the entire goal complete because live external-service proof and the final strict spec audit are still outstanding, and the Neon-vs-D1 backend decision remains unresolved.
