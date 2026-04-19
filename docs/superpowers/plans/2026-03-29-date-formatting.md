# Date Formatting Standardization — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Standardize all date display in the frontend to BR format — `DD/MM/YYYY` for date-only fields and `DD/MM/YYYY HH:mm` for datetime fields.

**Architecture:** Add `formatDateTime` to the existing `utils/date.ts` utility. Update each call site to use the correct formatter. Follow TDD: tests first, implementation second.

**Tech Stack:** TypeScript, React, Jest + Testing Library, native JS `Date`

---

## File Map

| File | Action | Purpose |
|---|---|---|
| `src/__tests__/utils/date.test.ts` | Create | Unit tests for `formatDateTime` |
| `src/utils/date.ts` | Modify | Add `formatDateTime` export |
| `src/views/components/NotificationDropdown.tsx` | Modify | Replace raw `n.createdAt` with `formatDateTime` |
| `src/views/components/JobReportPdf.tsx` | Modify | Remove internal helper, import from utils, use `formatDateTime` for `submittedAt` |
| `src/views/components/NextJobWidget.tsx` | Modify | Replace `formatDate(job.scheduledAt)` with `formatDateTime` |
| `src/views/pages/EmployeeFormPage.tsx` | Modify | Replace `formatDate(adj.adjustedAt)` with `formatDateTime` |
| `src/views/pages/ManagerDashboardPage.tsx` | Modify | Replace `formatDate(job.scheduledAt)` with `formatDateTime` |

---

## Task 1: Write failing tests for `formatDateTime`

**Files:**
- Create: `src/__tests__/utils/date.test.ts`

- [ ] **Step 1: Create the test file**

```ts
// src/__tests__/utils/date.test.ts
import { formatDate, formatDateTime } from '@/utils/date'

describe('formatDate', () => {
  it('formats YYYY-MM-DD to DD/MM/YYYY', () => {
    expect(formatDate('2026-04-01')).toBe('01/04/2026')
  })

  it('returns — for empty string', () => {
    expect(formatDate('')).toBe('—')
  })

  it('ignores time component', () => {
    expect(formatDate('2026-12-25T10:30:00Z')).toBe('25/12/2026')
  })
})

describe('formatDateTime', () => {
  it('formats ISO timestamp (no offset) to DD/MM/YYYY HH:mm', () => {
    // No timezone suffix → parsed as local time
    expect(formatDateTime('2026-04-01T14:30:00')).toBe('01/04/2026 14:30')
  })

  it('returns — for empty string', () => {
    expect(formatDateTime('')).toBe('—')
  })

  it('pads single-digit hours and minutes', () => {
    expect(formatDateTime('2026-04-01T09:05:00')).toBe('01/04/2026 09:05')
  })

  it('returns — for falsy input', () => {
    expect(formatDateTime(undefined as unknown as string)).toBe('—')
  })
})
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npx jest --testPathPattern="__tests__/utils/date" --no-coverage
```

Expected: FAIL — `formatDateTime is not a function` (or similar import error)

---

## Task 2: Implement `formatDateTime` in `utils/date.ts`

**Files:**
- Modify: `src/utils/date.ts`

- [ ] **Step 1: Add `formatDateTime` to the file**

Replace the full content of `src/utils/date.ts` with:

```ts
export function toLocalDateString(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/**
 * Formats an ISO date string (YYYY-MM-DD or full ISO timestamp) to DD/MM/YYYY.
 * Parses the date part directly to avoid timezone offset issues.
 */
export function formatDate(date: string): string {
  if (!date) return '—'
  const [y, m, d] = date.split('T')[0].split('-')
  return `${d}/${m}/${y}`
}

/**
 * Formats an ISO timestamp string to DD/MM/YYYY HH:mm in local timezone.
 * Use for datetime fields (createdAt, adjustedAt, submittedAt, scheduledAt, etc.).
 */
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

- [ ] **Step 2: Run tests to confirm they pass**

```bash
npx jest --testPathPattern="__tests__/utils/date" --no-coverage
```

Expected: PASS — 7 tests pass

- [ ] **Step 3: Commit**

```bash
git add src/__tests__/utils/date.test.ts src/utils/date.ts
git commit -m "feat(utils): add formatDateTime for DD/MM/YYYY HH:mm display"
```

---

## Task 3: Update `NotificationDropdown.tsx`

**Files:**
- Modify: `src/views/components/NotificationDropdown.tsx`

- [ ] **Step 1: Add import and replace raw `n.createdAt`**

At the top of `NotificationDropdown.tsx`, add the import:

```ts
import { formatDateTime } from '@/utils/date'
```

Find line 58:
```tsx
<p className="text-xs text-base-content/40 mt-1">{n.createdAt}</p>
```

Replace with:
```tsx
<p className="text-xs text-base-content/40 mt-1">{formatDateTime(n.createdAt)}</p>
```

- [ ] **Step 2: Run all tests**

```bash
npx jest --no-coverage
```

Expected: PASS (no regression)

- [ ] **Step 3: Commit**

```bash
git add src/views/components/NotificationDropdown.tsx
git commit -m "feat(notifications): format createdAt as DD/MM/YYYY HH:mm"
```

---

## Task 4: Update `JobReportPdf.tsx`

**Files:**
- Modify: `src/views/components/JobReportPdf.tsx`

This file has its own internal `formatDate` helper (line 32) that uses `toLocaleDateString`. Replace it with imports from `@/utils/date` and use `formatDateTime` for `submittedAt`.

- [ ] **Step 1: Replace internal helper with imports**

Find and remove the internal helper:
```ts
function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR')
}
```

Add to the imports at the top of the file:
```ts
import { formatDate, formatDateTime } from '@/utils/date'
```

- [ ] **Step 2: Update `submittedAt` call site**

Find line 88:
```tsx
<Text>{data.employeeName} — {formatDate(data.submittedAt)}</Text>
```

Replace with:
```tsx
<Text>{data.employeeName} — {formatDateTime(data.submittedAt)}</Text>
```

(The `formatDate(data.scheduledDate)` on line 49 remains as-is — it's a date-only field.)

- [ ] **Step 3: Run all tests**

```bash
npx jest --no-coverage
```

Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/views/components/JobReportPdf.tsx
git commit -m "feat(job-report): use shared formatDate/formatDateTime from utils"
```

---

## Task 5: Update `NextJobWidget.tsx`

**Files:**
- Modify: `src/views/components/NextJobWidget.tsx`

- [ ] **Step 1: Replace the import and call**

Find the existing import (line 3):
```ts
import { formatDate } from '@/utils/date'
```

Replace with:
```ts
import { formatDateTime } from '@/utils/date'
```

Find line 45:
```tsx
{formatDate(job.scheduledAt)}
```

Replace with:
```tsx
{formatDateTime(job.scheduledAt)}
```

- [ ] **Step 2: Run all tests**

```bash
npx jest --no-coverage
```

Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/views/components/NextJobWidget.tsx
git commit -m "feat(next-job-widget): show scheduledAt with time as DD/MM/YYYY HH:mm"
```

---

## Task 6: Update `EmployeeFormPage.tsx`

**Files:**
- Modify: `src/views/pages/EmployeeFormPage.tsx`

- [ ] **Step 1: Add `formatDateTime` to import**

Find the existing import (line 6):
```ts
import { formatDate } from '@/utils/date'
```

Replace with:
```ts
import { formatDate, formatDateTime } from '@/utils/date'
```

- [ ] **Step 2: Replace `adjustedAt` call**

Find line 143:
```tsx
{formatDate(adj.adjustedAt)}
```

Replace with:
```tsx
{formatDateTime(adj.adjustedAt)}
```

- [ ] **Step 3: Run all tests**

```bash
npx jest --no-coverage
```

Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/views/pages/EmployeeFormPage.tsx
git commit -m "feat(employee-form): show salary adjustment date with time"
```

---

## Task 7: Update `ManagerDashboardPage.tsx`

**Files:**
- Modify: `src/views/pages/ManagerDashboardPage.tsx`

- [ ] **Step 1: Add `formatDateTime` to import**

Find the existing import (line 9):
```ts
import { formatDate } from '@/utils/date'
```

Replace with:
```ts
import { formatDate, formatDateTime } from '@/utils/date'
```

- [ ] **Step 2: Replace `scheduledAt` call**

Find line 157:
```tsx
<td className="text-base-content/60 num">{formatDate(job.scheduledAt)}</td>
```

Replace with:
```tsx
<td className="text-base-content/60 num">{formatDateTime(job.scheduledAt)}</td>
```

- [ ] **Step 3: Run all tests**

```bash
npx jest --no-coverage
```

Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/views/pages/ManagerDashboardPage.tsx
git commit -m "feat(manager-dashboard): show job scheduledAt with time"
```

---

## Self-Review

**Spec coverage:**
- ✓ `formatDateTime` added to `utils/date.ts` (Task 2)
- ✓ Tests written first (Task 1)
- ✓ `NotificationDropdown` — `n.createdAt` formatted (Task 3)
- ✓ `JobReportPdf` — `submittedAt` formatted + internal helper removed (Task 4)
- ✓ `NextJobWidget` — `scheduledAt` formatted (Task 5)
- ✓ `EmployeeFormPage` — `adjustedAt` formatted (Task 6)
- ✓ `ManagerDashboardPage` — `scheduledAt` formatted (Task 7)
- ✓ `formatDate` untouched for date-only fields

**Out of scope (not touched):**
- Currency formatting — already correct
- `EmployeeDashboardPage` / `ManagerDashboardPage` "today" descriptive display — intentionally excluded
- Calendar internals — intentionally excluded
