# Christhood Accountability Platform (CAP) Executive Summary

## What CAP Is

Christhood Accountability Platform (CAP) is the rebuilt successor to Insight Tracker for Christhood Outfield Ministries International (C.I.O.M.). It is designed as a single-tenant, invite-only internal ministry portal for structured accountability, weekly reporting, meetings, action tracking, and ministry insight reporting across departments.

Unlike the old Insight Tracker model, CAP is not a multi-tenant SaaS. It is focused on one ministry with multiple internal departments and a stronger server-owned data model.

## What CAP Does

### 1. Weekly Department Accountability Records

CAP allows departments to submit recurring records with:

- a service or reporting date
- department-specific fields
- the ministry member who handled the record
- optional visitor details

For the current Phase 1 baseline, Protocol & Admin is seeded with:

- `tithe`
- `offering`
- `expenses`
- `headcount`

Each saved record also generates:

- structured record storage
- visitor rows
- numeric metrics for charting
- audit log entries
- a WhatsApp-style summary for immediate ministry sharing

### 2. Insights and Trend Visibility

CAP separates data entry from reporting so leaders can review trends over time instead of only capturing raw numbers.

The insights layer currently supports:

- metric time-series charts
- visitor count tracking
- net position tracking where revenue/expense fields exist
- anomaly detection against trailing averages
- per-handler accountability summaries
- date-range filtering

### 3. Meetings, Minutes, and Follow-up

CAP also acts as an internal ministry coordination tool by supporting:

- meeting creation and editing
- attendee linking
- action item ownership and status tracking
- attachment metadata linked to Cloudflare R2 uploads
- audit logging for changes

This gives ministry leadership one place to see both operational records and follow-through activity.

### 4. Admin Extensibility

CAP is designed so new departments do not require backend rewrites.

Admins can:

- create departments
- define department fields
- assign department members
- reuse the same dynamic record engine and insight engine

That means the platform can grow from Protocol & Admin into Media, Missions, and other ministry units without re-architecting the product each time.

## How CAP Works

### Application Layer

- Next.js App Router
- Tailwind CSS
- Auth.js for login/session handling

### Data Layer

- CAP now has a D1-capable async database layer
- local development still falls back to SQLite for speed and offline work
- record payloads are stored in `values_json`
- numeric metrics are denormalized into `record_metrics` for fast insight queries

### File Layer

- attachment uploads are designed for Cloudflare R2 using presigned uploads
- metadata is stored in the application database

### Access Model

Global roles:

- `admin`
- `leader`
- `member`

Department membership determines which department-scoped data a user can access or modify.

## Why This Rebuild Matters

CAP is meaningful to relevant parties because it combines:

- ministry accountability
- operational transparency
- leadership reporting
- follow-up discipline
- extensibility for future departments

It turns weekly reporting from an isolated entry workflow into a ministry operating system that supports stewardship, oversight, and decision-making.

## Current Delivery Status

Verified in the current codebase:

- CAP routes, forms, and dashboards are implemented
- role-based access controls are enforced
- dynamic department records are working
- meetings and action items are working
- type-checking passes
- production build passes

Still environment-dependent before final signoff:

- live Cloudflare D1 credentials and production-backed proof
- live Cloudflare R2 credentials and upload proof
- final requirement-by-requirement production environment signoff
