# Date Formatting Standardization — Design Spec

**Date:** 2026-03-29
**Status:** Approved

## Goal

All dates displayed in the frontend must follow Brazilian format:
- **Date-only fields:** `DD/MM/YYYY`
- **Datetime fields (with time component):** `DD/MM/YYYY HH:mm`

## Current State

`utils/date.ts` already exports:
- `formatDate(date: string): string` → `DD/MM/YYYY` (parses ISO string directly, timezone-safe for date-only)
- `toLocalDateString(d: Date): string` → `YYYY-MM-DD` (internal use, not for display)

Several datetime fields are being formatted with `formatDate` (losing the time component) or displayed as raw strings.

## Design

### 1. New utility: `formatDateTime`

Add `formatDateTime(date: string): string` to `utils/date.ts`.

- **Input:** ISO timestamp string (e.g., `"2026-04-01T14:30:00Z"`)
- **Output:** `DD/MM/YYYY HH:mm` in the browser's local timezone (correct for Brazil)
- **Empty/falsy input:** returns `'—'`

```ts
export function formatDateTime(date: string): string {
  if (!date) return '—'
  const d = new Date(date)
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const year = d.getFullYear()
  const hours = String(d.getHours()).padStart(2, '0')
  const minutes = String(d.getMinutes()).padStart(2, '0')
  return `${day}/${month}/${year} ${hours}:${minutes}`
}
```

`formatDate` remains unchanged — used for date-only fields (`scheduledDate`, `startDate`, `endDate`).

### 2. Call site changes

| File | Field | Before | After |
|---|---|---|---|
| `NotificationDropdown.tsx` | `n.createdAt` | raw string | `formatDateTime(n.createdAt)` |
| `EmployeeFormPage.tsx` | `adj.adjustedAt` | `formatDate()` | `formatDateTime()` |
| `JobReportPdf.tsx` | `data.submittedAt` | `formatDate()` | `formatDateTime()` |
| `NextJobWidget.tsx` | `job.scheduledAt` | `formatDate()` | `formatDateTime()` |
| `ManagerDashboardPage.tsx` | `job.scheduledAt` | `formatDate()` | `formatDateTime()` |
| `JobReportPdf.tsx` | internal helper | `toLocaleDateString('pt-BR')` | `formatDate()` |

### 3. Testing (TDD — tests before implementation)

Tests written in `src/__tests__/utils/date.test.ts` before any implementation:

- ISO string with timestamp → `DD/MM/YYYY HH:mm` in local timezone
- Empty string → `'—'`
- Null/undefined-like value → `'—'`
- Date-only ISO string → correct date with `00:00`

## Out of Scope

- Currency formatting (`toLocaleString('pt-BR', { currency: 'BRL' })`) — already correct, no changes needed
- "Today" display in `EmployeeDashboardPage` and `ManagerDashboardPage` — uses `toLocaleDateString` with custom options for a descriptive format (e.g., "Domingo, 29 de março"), not a table/list date — no change needed
- Calendar internals (`CalendarGrid`, `DayCell`) — use `toLocalDateString` for logic, not display

## Constraints

- No new libraries — native JS `Date` only
- Follow TDD: tests first, then implementation
