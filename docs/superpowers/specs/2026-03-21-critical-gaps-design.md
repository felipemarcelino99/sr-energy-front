# Design Spec — SR Energy Front: Critical Gaps

**Date:** 2026-03-21
**Status:** Approved
**Scope:** Missing features and UX polish — pre-launch improvements

---

## Context

SR Energy Front is a mature enterprise management application (React 19 + TypeScript + Vite, MVVM pattern) covering employees, machines, contracts, jobs, financials, and AI chat. All 17 planned sessions are marked complete, but code inspection revealed 4 critical gaps blocking production readiness.

---

## Gap 1 — PDF Generation

### Problem
`ManagerJobDetailPage.tsx` has a "Gerar PDF" button wired to `handleGeneratePdf()`, which is stubbed:
```typescript
function handleGeneratePdf(data: PdfData) {
  console.log('PDF data:', data)
  alert('Funcionalidade de PDF: dados prontos para geração.')
}
```
No PDF library is installed. The feature is non-functional.

### Solution
- Install `@react-pdf/renderer`
- Create `src/views/components/JobReportPdf.tsx` using `@react-pdf/renderer` primitives (`Document`, `Page`, `Text`, `View`)
- Receives `PdfData` from the existing `buildPdfData()` helper in `job-report.model.ts` (no model changes needed)
- Replace the stub in `ManagerJobDetailPage.tsx` with a download trigger using `pdf().toBlob()` + `URL.createObjectURL()`
- PDF structure: header (job data), body (TipTap HTML content — strip HTML tags and map basic formatting: `<strong>` → bold, `<em>` → italic, `<p>` → paragraph break, `<h1>`/`<h2>`/`<h3>` → text with larger font size), footer (date + employee name)

### Constraints
- All PDF structure logic stays in the model layer (MVVM)
- The component is pure — receives data, renders PDF, no business logic

---

## Gap 2 — Salary Adjustment Service & ViewModel

### Problem
`salary-adjustment.model.ts` and `SalaryAdjustmentForm.tsx` exist, but:
- `salary-adjustment.service.ts` — does not exist
- `salary-adjustment.viewmodel.ts` — does not exist

The form renders but cannot save or load data. The CRUD loop from Session 6 is incomplete.

### Solution
**`src/services/salary-adjustment.service.ts`**
- `fetchByEmployee(employeeId: string): Promise<SalaryAdjustment[]>`
- `create(data: SalaryAdjustmentInput): Promise<SalaryAdjustment>`
- `remove(id: string): Promise<void>` — salary adjustments are append-only (no edit), but deletion by managers is supported

**`src/viewmodels/salary-adjustment.viewmodel.ts`** (Zustand)
- State: `adjustments: SalaryAdjustment[]`, `loading: boolean`, `error: string | null`
- Actions: `loadAdjustments(employeeId)`, `addAdjustment(data)`

**`SalaryAdjustmentForm.tsx`**
- Wire to the new viewmodel (currently unconnected)
- Show loading state on submit, toast on success/error

### Constraints
- Follows existing MVVM pattern (view → viewmodel → service)
- No direct service calls from the form component

---

## Gap 3 — Pagination

### Problem
All list pages (`EmployeeListPage`, `MachineListPage`, `JobListPage`, `ContractListPage`) load and display all records with no pagination. This will break under real production data volumes.

### Solution
**`src/utils/usePagination.ts`** — reusable hook
```typescript
// Returns: { page, pageSize, totalPages, paginated(items), goTo, next, prev }
```

**`src/views/components/Pagination.tsx`** — DaisyUI `join` button group
- Shows page numbers, prev/next controls
- Displays "Página X de Y" label

**Apply to all 4 list pages:**
- Client-side pagination (data already fetched — no service layer changes)
- Default page size: 10 rows
- Resets to page 1 on filter change
- **Follow-up:** verify Supabase queries in each service have a `.limit()` cap to avoid unbounded fetches; if not, add a reasonable server-side limit (e.g., 200 records) as a safety net

### Constraints
- `usePagination` is a pure utility — no Zustand, no side effects
- `Pagination` component is purely presentational — receives props, emits callbacks

---

## Gap 4 — Mobile Polish

### Problem
- No `sm:` breakpoint usage anywhere in the codebase
- Sidebar behavior on mobile is unknown — likely overlaps content
- Forms lack consistent width constraints on small screens
- Job stepper may be difficult to navigate on mobile

### Solution
**Sidebar (mobile):**
- First, verify `AppLayout.tsx` — if it already uses DaisyUI `drawer`, only the hamburger toggle may be missing
- If not using drawer, convert sidebar to DaisyUI `drawer` component
- Add hamburger toggle button in `Navbar` visible only on mobile (`lg:hidden`)
- Sidebar becomes an overlay drawer below `lg:` breakpoint

**Responsive grid fixes (most-used pages):**
- `ManagerDashboardPage`: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`
- `EmployeeDashboardPage`: `grid-cols-1 sm:grid-cols-2`
- `JobListPage` / `EmployeeListPage`: filter bar wraps properly on small screens

**Form pages:**
- Apply `max-w-xl mx-auto` consistently across all form pages (some already have it)

**Job Stepper:**
- Step labels truncate or stack on small screens using `hidden sm:inline` on label text

### Constraints
- Mobile-first: start from small and add breakpoints upward
- No layout rewrites — only additive responsive classes and the sidebar refactor

---

## Implementation Order

1. **Salary Adjustment** (service + viewmodel + wire form) — completes broken CRUD
2. **Pagination** (hook + component + apply to lists) — prevents data loading problems
3. **PDF Generation** (library + component + replace stub) — unblocks manager workflow
4. **Mobile Polish** (sidebar drawer + responsive classes) — improves daily usability

---

## Files To Create

| File | Purpose |
|------|---------|
| `src/services/salary-adjustment.service.ts` | Axios CRUD for salary adjustments |
| `src/viewmodels/salary-adjustment.viewmodel.ts` | Zustand store for salary adjustments |
| `src/utils/usePagination.ts` | Reusable pagination hook |
| `src/views/components/Pagination.tsx` | DaisyUI pagination UI component |
| `src/views/components/JobReportPdf.tsx` | react-pdf PDF template |

## Files To Modify

| File | Change |
|------|--------|
| `src/views/components/SalaryAdjustmentForm.tsx` | Wire to viewmodel |
| `src/views/pages/ManagerJobDetailPage.tsx` | Replace PDF stub with real implementation |
| `src/views/pages/EmployeeListPage.tsx` | Add pagination |
| `src/views/pages/MachineListPage.tsx` | Add pagination |
| `src/views/pages/JobListPage.tsx` | Add pagination |
| `src/views/pages/ContractListPage.tsx` | Add pagination |
| `src/views/layouts/AppLayout.tsx` | Convert sidebar to DaisyUI drawer |
| `src/views/components/Navbar.tsx` | Add hamburger toggle |
| `src/views/pages/ManagerDashboardPage.tsx` | Add `sm:` breakpoints |
| `src/views/pages/EmployeeDashboardPage.tsx` | Add `sm:` breakpoints |
