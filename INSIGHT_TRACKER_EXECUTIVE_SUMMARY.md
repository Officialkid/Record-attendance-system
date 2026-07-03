# Insight Tracker Executive Summary

## Purpose

Insight Tracker is a web-based attendance and visitor intelligence platform designed to help organizations record event turnout, capture visitor details, and turn raw attendance data into actionable operational insight.

At its core, the product is trying to answer a simple but important question:

"How do we help organizations move from counting people to understanding growth, engagement, and follow-up needs?"

The current implementation is especially positioned for:

- Churches and ministries
- NGOs and nonprofits
- Community groups
- Event organizers
- Corporate or training-based teams that track participation over time

## What The System Currently Entails

The current product combines five major capabilities:

1. Public marketing and onboarding pages
2. User authentication with Firebase Auth
3. Organization-based access and multi-tenant data separation
4. Attendance and visitor capture workflows
5. Dashboard and analytics views for trend visibility

From the live local run and code review, the system already includes:

- A branded landing page for product positioning
- Sign-up and sign-in flows
- Organization creation during onboarding
- Organization switching for users with access to multiple organizations
- Attendance entry with event date, event type, total attendance, and visitor details
- Bulk visitor import from spreadsheet-style pasted data
- Dashboard summary cards and recent activity
- Analytics/chart components and reporting-oriented UI areas
- Audit logging for selected update and delete actions
- PWA groundwork and mobile-responsive layout patterns

## How It Works Today

### User and organization model

The system is built around organizations. A user signs up, creates an organization, and then operates inside that organization context. The app stores user records, organization records, and a current organization selection for contextual data access.

This means the app is not just an attendance logger for one group. It is structured as a shared platform where each organization should only see its own records.

### Attendance workflow

The main operational workflow is:

1. A signed-in user selects or enters an organization context
2. The user records an event or service date
3. The user enters total attendance
4. The user optionally adds visitors manually or via spreadsheet-style bulk import
5. The data is written into Firestore
6. Dashboard and analytics views use that stored data to summarize recent activity and trends

The underlying data model currently centers on:

- `organizations`
- `users`
- `services`
- `services/{serviceId}/visitors`
- `audit_logs`
- `organization_invites`

### Personalization and terminology

One strong product idea in the current build is dynamic terminology. Churches can see language like "Services" and "Visitors," while other organization types can see more generic labels like "Events" or "Participants." This is important because it makes the same platform feel more native across different sectors.

### Technology stack

The current system is built with:

- Next.js App Router
- React
- TypeScript
- Tailwind CSS
- Firebase Authentication
- Firestore
- Framer Motion
- Recharts

This gives the project a strong base for rapid product iteration, especially on frontend UX and cloud-hosted data workflows.

## What Is Working Well

The current system already has several meaningful strengths:

- The product concept is clear and easy to explain
- The user value is understandable to both technical and non-technical stakeholders
- The onboarding flow is fairly polished visually
- Multi-tenant thinking is present in the architecture
- The attendance capture flow supports both manual entry and bulk visitor import
- The dashboard direction is strong for operational visibility
- The product can serve both ministry and non-ministry contexts
- The codebase already reflects a platform mindset rather than a one-off internal tool

These are good foundations for a revamp. We are not starting from nothing. We are refining a system that already has a credible product shape.

## Key Issues Identified

The live run and code review also show that the system needs consolidation before a full revamp.

### 1. Product scope is ahead of product clarity

The app contains many features and UI surfaces, but the product narrative is still broad. It is not yet sharply defined whether Insight Tracker is:

- an attendance recorder,
- a visitor follow-up tool,
- an analytics platform,
- a church operations product,
- or a multi-sector engagement intelligence platform.

For the revamp, this needs to become explicit.

### 2. Some implementation areas appear inconsistent or incomplete

Examples observed:

- The local app loaded, but the browser console raised a `SyntaxError` from the generated app layout bundle during live testing.
- Next.js warned that `themeColor` metadata is configured in an outdated location.
- There are overlapping analytics routes, and one of them is only a placeholder while navigation points to another route.
- Documentation files describe both older and newer versions of the data model, which can confuse stakeholders and future developers.

### 3. Encoding and content quality issues are visible

Several files contain garbled characters in user-facing text and comments. This affects professionalism, clarity, and stakeholder confidence, especially if demos or screenshots are shared externally.

### 4. Architecture needs a cleaner product map

The current system mixes:

- onboarding,
- organization management,
- attendance capture,
- dashboards,
- analytics,
- notifications,
- docs/help surfaces,
- and update/feedback UI

That may all be valuable, but the information architecture needs to be simplified so the product feels intentional instead of additive.

### 5. Data and reporting model can be more meaningful

Right now, the system captures attendance and visitors well enough for basic tracking. But for senior stakeholders, the more meaningful questions are:

- Are people returning?
- Which events are growing or declining?
- Which visitor sources convert into repeat attendance?
- Which locations, ministries, or departments perform best?
- What follow-up actions should happen next?

The current implementation appears closer to record-keeping than decision intelligence.

## What A Revamp Should Aim To Achieve

The revamp should not be treated as just a visual redesign. It should reposition Insight Tracker as a clearer, more meaningful product for decision-makers.

### Recommended revamp objective

Insight Tracker should evolve into a growth and engagement intelligence platform that helps organizations:

- record participation,
- understand patterns,
- identify opportunities,
- and act on the data.

### Strategic revamp goals

1. Clarify the product identity
   Decide whether the primary story is attendance management, community engagement, ministry growth, event intelligence, or an organization insights platform.

2. Simplify the core journeys
   Make the main workflows obvious:
   onboarding, record event, review trends, follow up, report upward.

3. Redesign around stakeholder value
   Different users need different value:
   administrators want control, leaders want trends, field teams want speed, executives want insight.

4. Strengthen the data model for intelligence
   Move beyond total attendance into repeat attendance, segmentation, source attribution, engagement history, and outcome tracking.

5. Build stronger reporting
   The product should produce outputs meaningful to pastors, executives, board members, operations leads, and donors where relevant.

6. Improve trust and polish
   Fix route inconsistencies, metadata warnings, encoding issues, incomplete views, and documentation drift before or alongside the redesign.

## Suggested Stakeholder Framing

When presenting this system to relevant parties, the most useful framing is:

"Insight Tracker is a digital platform for capturing attendance and visitor activity, organizing that data by team or organization, and translating it into operational and strategic insight."

That framing is stronger than calling it only an attendance system because it speaks to outcomes, not just inputs.

## Recommended Revamp Workstreams

To make the redesign meaningful, the revamp can be organized into these workstreams:

### 1. Product strategy

- Define the primary customer profile
- Define the primary use cases
- Define the executive reporting outcomes the system must support

### 2. Information architecture

- Simplify navigation
- Consolidate overlapping routes and duplicate concepts
- Separate operational pages from leadership insight pages

### 3. Data model redesign

- Define entities more clearly
- Add richer engagement and reporting dimensions
- Align documentation with the actual implementation

### 4. UX redesign

- Improve onboarding clarity
- Make attendance capture faster
- Make analytics more decision-oriented
- Create clearer role-based experiences

### 5. Technical hardening

- Fix live runtime issues
- Remove placeholder routes and outdated metadata usage
- Resolve encoding corruption in source content
- Validate production build stability

## Bottom Line

Insight Tracker already demonstrates a meaningful product direction: it captures attendance, visitor details, organization context, and analytics in one system.

However, the next phase should focus on turning it from a useful tracking tool into a sharper, more credible intelligence platform for leaders and stakeholders.

The revamp should preserve the current strengths:

- multi-organization support,
- simple attendance capture,
- visitor tracking,
- analytics ambition,
- and flexible terminology,

while improving:

- product clarity,
- architecture consistency,
- reporting depth,
- operational polish,
- and stakeholder relevance.

## Immediate Next Recommendation

Before making major UI changes, align stakeholders on three questions:

1. Who is the primary decision-maker this product must serve?
2. What are the top five questions that stakeholder wants answered by the system?
3. Which current features directly support those questions, and which ones distract from them?

Answering those three questions will make the full revamp significantly more meaningful.
