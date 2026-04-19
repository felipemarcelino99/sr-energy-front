# Employee Flow Improvements — Design Spec

**Date:** 2026-03-29
**Branch:** feat/ui-improvements
**Scope:** Employee dashboard, calendar, job detail read-only mode, status filter navigation

---

## Overview

Four coordinated improvements to the employee-facing flow:

1. Replace dashboard placeholder sections with a calendar filtered to the employee's own events/jobs
2. Make the calendar day-detail panel read-only for employees (link to detail page instead of edit/cancel)
3. Wire job-status card clicks to navigate to `/my-jobs` with the selected filter active
4. Confirm API integration is real (no mocked stubs remaining)

---

## 1. Employee Dashboard Layout

**Current:** Status cards → NextJobWidget → Notifications placeholder
**New:** Status cards (clickable) → EmployeeScheduleWidget

`NextJobWidget` and the notifications placeholder card are removed. The calendar makes "next job" visible directly on the grid, so the dedicated widget is redundant.

---

## 2. New Component: `EmployeeScheduleWidget`

**File:** `src/views/components/EmployeeScheduleWidget.tsx`

### Responsibilities
- Load schedule data for the current month filtered to the authenticated employee
- Render the full calendar UI in read-only mode
- Allow month navigation (prev/next/today + month picker popover)

### Implementation
- Reads `user.employeeId ?? user.id` from `useAuth()`
- Uses `useScheduleStore`: sets `employeeFilter` to the current user's ID on mount and resets it on unmount
- Renders:
  - `CalendarToolbar` — no employee filter select, no "+ New Event" button; `onNewEvent` not passed
  - `CalendarLegend`
  - `CalendarGrid`
  - `DayDetailPanel` with `readOnly={true}`
- Title: **"Minha Agenda"**
- Month navigation and month-picker popover work identically to `ScheduleWidget`

### Props
None — self-contained via `useAuth` and `useScheduleStore`.

---

## 3. DayDetailPanel — Read-Only Mode

**File:** `src/views/components/DayDetailPanel.tsx`

### Change
Add `readOnly?: boolean` prop (default `false`).

When `readOnly={true}`:

**JobRow:**
- Hide "Editar" and "Cancelar" buttons
- Show `<Link to={`/my-jobs/${job.id}`}>Ver detalhes →</Link>` (DaisyUI `btn btn-xs btn-ghost`)
- Remove confirmation modal (not reachable)

**EventRow:**
- Hide "Cancelar" button and confirmation modal entirely
- Event details remain visible (period, employees, notes)

`onJobEdit`, `onJobCancel`, `onEventCancel` become optional props — required only when `readOnly` is false or absent. TypeScript signature uses conditional/optional typing.

---

## 4. Job Status Cards → Navigate with Filter

**File:** `src/views/pages/EmployeeDashboardPage.tsx`

Pass `onStatusClick` to `JobStatusCard`:

```ts
(status: string) => {
  navigate(`/my-jobs?status=${status}`)
}
```

- Uses query params — avoids Zustand timing races and makes the URL shareable/bookmarkable
- `EmployeeJobListPage` reads `useSearchParams` on mount and calls `setFilters({ employeeId, status })` combining both values together

---

## 5. API Integration Audit

| Service | Status |
|---|---|
| `dashboard.service.fetchJobs` | Real API — hits `GET /jobs`, maps to `JobSummary[]` ✓ |
| `schedule.service.fetchScheduleEvents` | Real API — `GET /schedule-events?month=YYYY-MM` ✓ |
| `job.service.fetchJob` / `fetchJobs` | Real API ✓ |
| `employee.dashboard.viewmodel.loadMyJobs` | Real API — fetches all jobs, filters client-side by `employeeId` ✓ |

No mock stubs found in the employee flow. The client-side filter in `loadMyJobs` is acceptable given the API has no `?employeeId=` filter param documented.

---

## Affected Files

| File | Change |
|---|---|
| `src/views/components/EmployeeScheduleWidget.tsx` | **New** — read-only calendar for employees |
| `src/views/components/DayDetailPanel.tsx` | Add `readOnly` prop; conditional buttons/links |
| `src/views/pages/EmployeeDashboardPage.tsx` | Remove NextJobWidget + notifications; add EmployeeScheduleWidget; wire status click |
| `src/views/pages/EmployeeJobListPage.tsx` | Read `?status` query param on mount; apply combined filter |

---

## Out of Scope

- Manager calendar (`ScheduleWidget`) — unchanged
- Job finalization flow (`JobFinalizationPage`) — unchanged
- Creating or editing schedule events as employee — not allowed per role
- Adding notifications — placeholder removed, not replaced with real data
