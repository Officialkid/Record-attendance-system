# Mobile UX Simplification Plan

## Goal
Keep the portal usable on phones by showing only the current task, hiding admin-heavy controls until needed, and reducing long stacked pages.

## Core principles
- Show one main action per screen.
- Collapse advanced controls behind `More`, `Admin tools`, or `View all`.
- Prefer focused pages over long mixed dashboards.
- Keep summary cards short and send detailed analysis to a dedicated page.
- Reduce repeated helper text once the flow is already clear.

## Dashboard
- Keep the greeting block only on the main dashboard.
- Show the most important department cards first.
- Move secondary items such as detailed status capsules into a `More` drawer or disclosure.
- Limit recent-record previews to 2 items with a `View all` link.

## Admin
- Keep invite generation visible.
- Collapse rare setup actions like `Create department`, `Add field definition`, and `Admin-add user` by default.
- Avoid showing system-expansion tools to normal department admins.

## Programs
- Keep `Event home` separate from the actual working pages.
- Open `Organizer` and `Expenses` as focused workspaces with a clear `Back to event home` action.
- Keep form hints short.
- Group long participant and expense lists inside disclosures or dedicated listing pages.
- Let planning flows accept partial data so users are not blocked on mobile.

## Leadership and Insights
- Keep `/insights` as a summary page.
- Open full charts in one dedicated full-analysis page.
- Stack each metric section clearly with a chart first and a table second.
- Avoid mixing too many unrelated decision blocks in one viewport.

## Meetings and Records
- Keep creation forms short at the top.
- Move instructional cards below the main form or behind a help disclosure.
- Keep export/report actions together in one compact action row.

## Navigation
- Keep the side navigation compact on mobile.
- Prefer a top-level department switcher plus the current page title.
- Avoid showing every possible shortcut at once.

## Recommended next implementation passes
1. Add a stronger mobile header pattern with page title, back action, and one `More` button.
2. Convert more long cards into collapsible sections.
3. Create dedicated mobile list pages for participants, expenses, records, and reports.
4. Audit every page at narrow widths and remove duplicate helper text.
5. Standardize a single `focused workspace` layout for Programs, Meetings, Records, and Insights.
