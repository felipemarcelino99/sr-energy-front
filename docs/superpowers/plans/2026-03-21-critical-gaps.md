# Critical Gaps Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix 4 critical gaps blocking production readiness: salary adjustment MVVM violation, missing pagination, stubbed PDF generation, and non-responsive mobile layout.

**Architecture:** MVVM — Views call ViewModels (Zustand stores), ViewModels call Services (Axios), never Views→Services directly. All business logic lives in ViewModels or Models, Views are pure rendering.

**Tech Stack:** React 19, TypeScript, Vite, Tailwind CSS v4, DaisyUI v5, Zustand v5, Axios, Zod, `@react-pdf/renderer`, React Router v7, Jest + Testing Library

---

## File Map

### Files to Modify

| File | Change |
|------|--------|
| `src/viewmodels/employee.viewmodel.ts` | Add salary adjustment state + actions |
| `src/views/pages/EmployeeFormPage.tsx` | Remove direct service calls, use viewmodel |
| `src/views/pages/EmployeeListPage.tsx` | Add pagination |
| `src/views/pages/MachineListPage.tsx` | Add pagination |
| `src/views/pages/JobListPage.tsx` | Add pagination |
| `src/views/pages/ContractListPage.tsx` | Add pagination |
| `src/views/pages/ManagerJobDetailPage.tsx` | Replace PDF stub with real download |
| `src/views/layouts/AppLayout.tsx` | Wrap in DaisyUI drawer structure |
| `src/views/components/Sidebar.tsx` | Accept `onClose` prop for drawer mode |
| `src/views/components/Navbar.tsx` | Add hamburger toggle (mobile only) |
| `src/views/pages/ManagerDashboardPage.tsx` | Add `sm:` responsive classes |
| `src/views/pages/EmployeeDashboardPage.tsx` | Add `sm:` responsive classes |

### Files to Create

| File | Purpose |
|------|---------|
| `src/utils/usePagination.ts` | Pure hook: page state + slice logic |
| `src/views/components/Pagination.tsx` | DaisyUI pagination controls |
| `src/views/components/JobReportPdf.tsx` | `@react-pdf/renderer` PDF template |

---

## Task 1: Extend employee.viewmodel.ts with salary adjustment state

**Context:** `EmployeeFormPage.tsx` currently calls `fetchSalaryAdjustments` and `createSalaryAdjustment` directly from the service (MVVM violation). These functions already exist in `employee.service.ts` — a separate `salary-adjustment.service.ts` is not needed and would duplicate them. Likewise, since salary adjustments are always loaded and mutated in the context of a specific employee, the state belongs in `employee.viewmodel.ts` rather than a separate viewmodel. The fix is to expose salary adjustment actions through the existing employee viewmodel.

Also add `remove` so a manager can delete an adjustment entry.

**Files:**
- Modify: `src/viewmodels/employee.viewmodel.ts`
- Test: `src/__tests__/viewmodels/employee.viewmodel.test.ts`

- [ ] **Step 1: Write failing tests for salary adjustment actions**

Open `src/__tests__/viewmodels/employee.viewmodel.test.ts` and add these tests (alongside existing tests):

```typescript
// At the top, add these imports if not present:
import { fetchSalaryAdjustments, createSalaryAdjustment } from '@/services/employee.service'

// Mock the new service functions (add to existing mock block):
jest.mock('@/services/employee.service', () => ({
  ...jest.requireActual('@/services/employee.service'),
  fetchSalaryAdjustments: jest.fn(),
  createSalaryAdjustment: jest.fn(),
}))

// Add these test cases:
describe('salary adjustments', () => {
  beforeEach(() => {
    useEmployeeStore.setState({
      adjustments: [],
      adjustmentsLoading: false,
      adjustmentsError: null,
    })
  })

  it('loadAdjustments populates adjustments state', async () => {
    const mockAdjs = [
      { id: '1', employeeId: 'e1', previousSalary: 3000, newSalary: 3500, reason: 'Aumento anual', adjustedAt: '2024-01-01' },
    ]
    ;(fetchSalaryAdjustments as jest.Mock).mockResolvedValue(mockAdjs)

    await useEmployeeStore.getState().loadAdjustments('e1')

    expect(useEmployeeStore.getState().adjustments).toEqual(mockAdjs)
    expect(useEmployeeStore.getState().adjustmentsLoading).toBe(false)
  })

  it('removeAdjustment removes the entry from state', async () => {
    const adj = { id: '1', employeeId: 'e1', previousSalary: 3000, newSalary: 3500, reason: 'Aumento anual', adjustedAt: '2024-01-01' }
    useEmployeeStore.setState({ adjustments: [adj] })
    // removeEmployee already mocked — add removeSalaryAdjustment mock when implementing

    await useEmployeeStore.getState().removeAdjustment('1')

    expect(useEmployeeStore.getState().adjustments).toHaveLength(0)
  })

  it('addAdjustment prepends new adjustment to state', async () => {
    const newAdj = { id: '2', employeeId: 'e1', previousSalary: 3500, newSalary: 4000, reason: 'Promoção', adjustedAt: '2024-06-01' }
    ;(createSalaryAdjustment as jest.Mock).mockResolvedValue(newAdj)
    useEmployeeStore.setState({ adjustments: [] })

    await useEmployeeStore.getState().addAdjustment('e1', { newSalary: 4000, reason: 'Promoção' })

    expect(useEmployeeStore.getState().adjustments[0]).toEqual(newAdj)
  })
})
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npm test -- --testPathPattern="employee.viewmodel"
```
Expected: FAIL — `loadAdjustments is not a function` and `addAdjustment is not a function`

- [ ] **Step 3: Extend the viewmodel**

In `src/viewmodels/employee.viewmodel.ts`, add to the import and interface, then implement:

```typescript
// Add to imports:
import {
  fetchEmployees,
  createEmployee,
  updateEmployee,
  removeEmployee,
  fetchSalaryAdjustments,
  createSalaryAdjustment,
} from '@/services/employee.service'
import type { SalaryAdjustment, SalaryAdjustmentFormData } from '@/models/salary-adjustment.model'

// Extend the interface — add after `filtered: () => Employee[]`:
  adjustments: SalaryAdjustment[]
  adjustmentsLoading: boolean
  adjustmentsError: string | null
  loadAdjustments: (employeeId: string) => Promise<void>
  addAdjustment: (employeeId: string, data: SalaryAdjustmentFormData) => Promise<void>

// Extend the initial state — add after `search: ''`:
  adjustments: [],
  adjustmentsLoading: false,
  adjustmentsError: null,

// Also add to the service imports:
import { removeSalaryAdjustment } from '@/services/employee.service'
// Note: if removeSalaryAdjustment doesn't exist yet in employee.service.ts, add it:
// export async function removeSalaryAdjustment(id: string): Promise<void> {
//   await api.delete(`/salary-adjustments/${id}`)
// }

// Add these actions after `setSearch`:
  loadAdjustments: async (employeeId) => {
    set({ adjustmentsLoading: true, adjustmentsError: null })
    try {
      const adjustments = await fetchSalaryAdjustments(employeeId)
      set({ adjustments, adjustmentsLoading: false })
    } catch (err) {
      set({ adjustmentsError: (err as Error).message, adjustmentsLoading: false })
    }
  },

  addAdjustment: async (employeeId, data) => {
    const adj = await createSalaryAdjustment(employeeId, data)
    set((s) => ({ adjustments: [adj, ...s.adjustments] }))
  },

  removeAdjustment: async (id) => {
    await removeSalaryAdjustment(id)
    set((s) => ({ adjustments: s.adjustments.filter((a) => a.id !== id) }))
  },
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
npm test -- --testPathPattern="employee.viewmodel"
```
Expected: PASS — all salary adjustment tests green

- [ ] **Step 5: Commit**

```bash
git add src/viewmodels/employee.viewmodel.ts src/__tests__/viewmodels/employee.viewmodel.test.ts
git commit -m "feat: add salary adjustment state and actions to employee viewmodel"
```

---

## Task 2: Fix EmployeeFormPage — remove direct service calls, use viewmodel

**Context:** `EmployeeFormPage.tsx` currently imports and calls `fetchEmployee`, `fetchSalaryAdjustments`, `createSalaryAdjustment` directly from the service. Only `fetchEmployee` is acceptable (it's a one-off fetch for the form's initial data). Salary adjustment calls must go through the viewmodel.

**Files:**
- Modify: `src/views/pages/EmployeeFormPage.tsx`

- [ ] **Step 1: Update imports**

Remove `fetchSalaryAdjustments` and `createSalaryAdjustment` from the service import. Keep `fetchEmployee`. Add viewmodel destructuring for the new actions:

```typescript
// Remove from service import:
import {
  fetchEmployee,
  fetchSalaryAdjustments,  // ← remove
  createSalaryAdjustment,   // ← remove
} from '@/services/employee.service'

// Keep only:
import { fetchEmployee } from '@/services/employee.service'

// Update viewmodel destructuring (add new actions):
const {
  create,
  update,
  loading: storeLoading,
  adjustments,
  adjustmentsLoading,
  loadAdjustments,
  addAdjustment,
} = useEmployeeStore()
```

- [ ] **Step 2: Replace local state with viewmodel state**

Remove:
```typescript
const [adjustments, setAdjustments] = useState<SalaryAdjustment[]>([])
```
(The `adjustments` now comes from the viewmodel.)

Also remove the `SalaryAdjustment` type import from models (it's no longer used directly in this file).

- [ ] **Step 3: Update useEffect to use viewmodel action**

Replace:
```typescript
Promise.all([fetchEmployee(id), fetchSalaryAdjustments(id)])
  .then(([emp, adjs]) => {
    setEmployee(emp)
    setAdjustments(adjs)
  })
```

With:
```typescript
Promise.all([fetchEmployee(id), loadAdjustments(id)])
  .then(([emp]) => {
    setEmployee(emp)
  })
```

- [ ] **Step 4: Update handleAdjustment to use viewmodel action**

Replace:
```typescript
async function handleAdjustment(data: SalaryAdjustmentFormData) {
  if (!id || !employee) return
  const adj = await createSalaryAdjustment(id, data)
  setAdjustments((prev) => [adj, ...prev])
  setEmployee((prev) => prev ? { ...prev, salary: data.newSalary } : prev)
}
```

With:
```typescript
async function handleAdjustment(data: SalaryAdjustmentFormData) {
  if (!id || !employee) return
  await addAdjustment(id, data)
  setEmployee((prev) => prev ? { ...prev, salary: data.newSalary } : prev)
}
```

- [ ] **Step 5: Pass loading state to SalaryAdjustmentForm**

Update the form usage to pass `loading`:
```typescript
<SalaryAdjustmentForm
  currentSalary={employee.salary}
  onSubmit={handleAdjustment}
  loading={adjustmentsLoading}
/>
```

- [ ] **Step 6: Verify the app renders without errors**

```bash
npm run build
```
Expected: Build succeeds with no TypeScript errors

- [ ] **Step 7: Commit**

```bash
git add src/views/pages/EmployeeFormPage.tsx
git commit -m "fix: route salary adjustment calls through viewmodel, not direct service"
```

---

## Task 3: Create usePagination hook

**Files:**
- Create: `src/utils/usePagination.ts`
- Test: `src/__tests__/utils/usePagination.test.ts`

- [ ] **Step 1: Write failing tests**

Create `src/__tests__/utils/usePagination.test.ts`:

```typescript
import { renderHook, act } from '@testing-library/react'
import { usePagination } from '@/utils/usePagination'

describe('usePagination', () => {
  const items = Array.from({ length: 25 }, (_, i) => i + 1)

  it('returns first page by default', () => {
    const { result } = renderHook(() => usePagination(items, 10))
    expect(result.current.page).toBe(1)
    expect(result.current.paginated).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
  })

  it('calculates totalPages correctly', () => {
    const { result } = renderHook(() => usePagination(items, 10))
    expect(result.current.totalPages).toBe(3)
  })

  it('next() advances the page', () => {
    const { result } = renderHook(() => usePagination(items, 10))
    act(() => result.current.next())
    expect(result.current.page).toBe(2)
    expect(result.current.paginated).toEqual([11, 12, 13, 14, 15, 16, 17, 18, 19, 20])
  })

  it('prev() does not go below page 1', () => {
    const { result } = renderHook(() => usePagination(items, 10))
    act(() => result.current.prev())
    expect(result.current.page).toBe(1)
  })

  it('next() does not exceed totalPages', () => {
    const { result } = renderHook(() => usePagination(items, 10))
    act(() => result.current.goTo(3))
    act(() => result.current.next())
    expect(result.current.page).toBe(3)
  })

  it('goTo() jumps to a specific page', () => {
    const { result } = renderHook(() => usePagination(items, 10))
    act(() => result.current.goTo(3))
    expect(result.current.page).toBe(3)
    expect(result.current.paginated).toEqual([21, 22, 23, 24, 25])
  })

  it('resets to page 1 when items change', () => {
    const { result, rerender } = renderHook(
      ({ data }: { data: number[] }) => usePagination(data, 10),
      { initialProps: { data: items } }
    )
    act(() => result.current.goTo(2))
    expect(result.current.page).toBe(2)
    rerender({ data: [1, 2, 3] })
    expect(result.current.page).toBe(1)
  })
})
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npm test -- --testPathPattern="usePagination"
```
Expected: FAIL — `Cannot find module '@/utils/usePagination'`

- [ ] **Step 3: Implement the hook**

Create `src/utils/usePagination.ts`:

```typescript
import { useState, useEffect } from 'react'

export function usePagination<T>(items: T[], pageSize: number = 10) {
  const [page, setPage] = useState(1)

  // Reset to page 1 when the items array changes (e.g. filter applied)
  useEffect(() => {
    setPage(1)
  }, [items])

  const totalPages = Math.max(1, Math.ceil(items.length / pageSize))
  const start = (page - 1) * pageSize
  const paginated = items.slice(start, start + pageSize)

  function goTo(p: number) {
    setPage(Math.min(Math.max(1, p), totalPages))
  }

  return {
    page,
    pageSize,
    totalPages,
    paginated,
    goTo,
    next: () => goTo(page + 1),
    prev: () => goTo(page - 1),
  }
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
npm test -- --testPathPattern="usePagination"
```
Expected: PASS — all 7 tests green

- [ ] **Step 5: Commit**

```bash
git add src/utils/usePagination.ts src/__tests__/utils/usePagination.test.ts
git commit -m "feat: add usePagination hook"
```

---

## Task 4: Create Pagination component

**Files:**
- Create: `src/views/components/Pagination.tsx`
- Test: `src/__tests__/views/components/Pagination.test.tsx`

- [ ] **Step 1: Write failing tests**

Create `src/__tests__/views/components/Pagination.test.tsx`:

```typescript
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Pagination } from '@/views/components/Pagination'

describe('Pagination', () => {
  it('renders page label', () => {
    render(<Pagination page={2} totalPages={5} onGoTo={jest.fn()} />)
    expect(screen.getByText('Página 2 de 5')).toBeInTheDocument()
  })

  it('calls onGoTo with prev page when Anterior clicked', async () => {
    const onGoTo = jest.fn()
    render(<Pagination page={3} totalPages={5} onGoTo={onGoTo} />)
    await userEvent.click(screen.getByText('Anterior'))
    expect(onGoTo).toHaveBeenCalledWith(2)
  })

  it('calls onGoTo with next page when Próxima clicked', async () => {
    const onGoTo = jest.fn()
    render(<Pagination page={3} totalPages={5} onGoTo={onGoTo} />)
    await userEvent.click(screen.getByText('Próxima'))
    expect(onGoTo).toHaveBeenCalledWith(4)
  })

  it('disables Anterior on first page', () => {
    render(<Pagination page={1} totalPages={5} onGoTo={jest.fn()} />)
    expect(screen.getByText('Anterior').closest('button')).toBeDisabled()
  })

  it('disables Próxima on last page', () => {
    render(<Pagination page={5} totalPages={5} onGoTo={jest.fn()} />)
    expect(screen.getByText('Próxima').closest('button')).toBeDisabled()
  })

  it('does not render when totalPages is 1', () => {
    const { container } = render(<Pagination page={1} totalPages={1} onGoTo={jest.fn()} />)
    expect(container.firstChild).toBeNull()
  })
})
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npm test -- --testPathPattern="Pagination.test"
```
Expected: FAIL — `Cannot find module '@/views/components/Pagination'`

- [ ] **Step 3: Implement the component**

Create `src/views/components/Pagination.tsx`:

```typescript
interface PaginationProps {
  page: number
  totalPages: number
  onGoTo: (page: number) => void
}

export function Pagination({ page, totalPages, onGoTo }: PaginationProps) {
  if (totalPages <= 1) return null

  return (
    <div className="flex items-center justify-between mt-4">
      <span className="text-sm text-base-content/50">
        Página {page} de {totalPages}
      </span>
      <div className="join">
        <button
          className="join-item btn btn-sm"
          onClick={() => onGoTo(page - 1)}
          disabled={page === 1}
        >
          Anterior
        </button>
        <button
          className="join-item btn btn-sm"
          onClick={() => onGoTo(page + 1)}
          disabled={page === totalPages}
        >
          Próxima
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
npm test -- --testPathPattern="Pagination.test"
```
Expected: PASS — all 6 tests green

- [ ] **Step 5: Commit**

```bash
git add src/views/components/Pagination.tsx src/__tests__/views/components/Pagination.test.tsx
git commit -m "feat: add Pagination component"
```

---

## Task 5: Add pagination to EmployeeListPage

**Files:**
- Modify: `src/views/pages/EmployeeListPage.tsx`

- [ ] **Step 1: Add imports**

```typescript
import { usePagination } from '@/utils/usePagination'
import { Pagination } from '@/views/components/Pagination'
```

- [ ] **Step 2: Add pagination hook after `const employees = filtered()`**

```typescript
const employees = filtered()
const { paginated, page, totalPages, goTo } = usePagination(employees, 10)
```

- [ ] **Step 3: Replace `employees.map(...)` with `paginated.map(...)`**

In the `<tbody>` section, change:
```typescript
{employees.map((emp) => (
```
to:
```typescript
{paginated.map((emp) => (
```

- [ ] **Step 4: Add Pagination controls after the card**

After the closing `</div>` of the card, add:
```typescript
<Pagination page={page} totalPages={totalPages} onGoTo={goTo} />
```

- [ ] **Step 5: Verify build**

```bash
npm run build
```
Expected: no TypeScript errors

- [ ] **Step 6: Commit**

```bash
git add src/views/pages/EmployeeListPage.tsx
git commit -m "feat: add pagination to EmployeeListPage"
```

---

## Task 6: Add pagination to MachineListPage, JobListPage, ContractListPage

**Context:** Same pattern as Task 5. Read each file first to confirm the variable name holding the filtered list before making changes.

**Files:**
- Modify: `src/views/pages/MachineListPage.tsx`
- Modify: `src/views/pages/JobListPage.tsx`
- Modify: `src/views/pages/ContractListPage.tsx`

- [ ] **Step 1: Add pagination to MachineListPage**

Variable holding the final list: `machines` (from `const machines = filtered()`).

Add imports, apply hook after that line:
```typescript
const { paginated, page, totalPages, goTo } = usePagination(machines, 10)
```
Replace `machines.map(...)` with `paginated.map(...)`. Add `<Pagination page={page} totalPages={totalPages} onGoTo={goTo} />` after the table card.

- [ ] **Step 2: Add pagination to JobListPage**

Variable holding the final list: `jobs` (from `const jobs = filtered()`). JobListPage also has a status filter select — `filtered()` already applies all filters, so pass `jobs` directly to `usePagination`.

```typescript
const { paginated, page, totalPages, goTo } = usePagination(jobs, 10)
```
Replace `jobs.map(...)` with `paginated.map(...)`. Add `<Pagination />` after the table card.

- [ ] **Step 3: Add pagination to ContractListPage**

Variable holding the final list: `contracts` (comes directly from the store, not a `filtered()` call — there are no filters). Apply pagination to it:
```typescript
const { paginated, page, totalPages, goTo } = usePagination(contracts, 10)
```
Replace `contracts.map(...)` with `paginated.map(...)`. Add `<Pagination />` after the table card.

- [ ] **Step 4: Verify build**

```bash
npm run build
```
Expected: no TypeScript errors

- [ ] **Step 5: Commit**

```bash
git add src/views/pages/MachineListPage.tsx src/views/pages/JobListPage.tsx src/views/pages/ContractListPage.tsx
git commit -m "feat: add pagination to Machine, Job, and Contract list pages"
```

---

## Task 7: Install @react-pdf/renderer

- [ ] **Step 1: Install the package**

```bash
npm install @react-pdf/renderer
```

- [ ] **Step 2: Verify installation**

```bash
npm list @react-pdf/renderer
```
Expected: shows version number

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: install @react-pdf/renderer"
```

---

## Task 8: Create JobReportPdf component

**Context:** `PdfData` is defined in `src/models/job-report.model.ts`. Fields: `jobId`, `scheduledDate`, `employeeName`, `machineName`, `city`, `state`, `jobType`, `reportContent` (HTML from TipTap), `evidences[]`, `submittedAt`. The `reportContent` is raw HTML — strip tags before rendering in the PDF.

**Files:**
- Create: `src/views/components/JobReportPdf.tsx`

- [ ] **Step 1: Create the HTML-stripping helper and PDF component**

Create `src/views/components/JobReportPdf.tsx`:

```typescript
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import type { PdfData } from '@/models/job-report.model'

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 11, fontFamily: 'Helvetica', color: '#1a1a1a' },
  header: { marginBottom: 24, borderBottomWidth: 1, borderBottomColor: '#e5e7eb', paddingBottom: 16 },
  title: { fontSize: 18, fontFamily: 'Helvetica-Bold', marginBottom: 8 },
  metaRow: { flexDirection: 'row', gap: 8, marginBottom: 4 },
  label: { fontFamily: 'Helvetica-Bold', minWidth: 100 },
  value: { color: '#4b5563' },
  section: { marginBottom: 16 },
  sectionTitle: { fontSize: 12, fontFamily: 'Helvetica-Bold', marginBottom: 8, color: '#374151' },
  body: { lineHeight: 1.6, color: '#374151' },
  footer: { position: 'absolute', bottom: 30, left: 40, right: 40, flexDirection: 'row', justifyContent: 'space-between', fontSize: 9, color: '#9ca3af', borderTopWidth: 1, borderTopColor: '#e5e7eb', paddingTop: 8 },
  evidenceItem: { marginBottom: 4, color: '#4b5563' },
})

/** Strip HTML tags from TipTap content for plain text PDF rendering */
function stripHtml(html: string): string {
  return html
    .replace(/<\/p>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/h[1-3]>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .trim()
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR')
}

interface JobReportPdfProps {
  data: PdfData
}

export function JobReportPdf({ data }: JobReportPdfProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Relatório de Trabalho</Text>
          <View style={styles.metaRow}>
            <Text style={styles.label}>Data:</Text>
            <Text style={styles.value}>{formatDate(data.scheduledDate)}</Text>
          </View>
          <View style={styles.metaRow}>
            <Text style={styles.label}>Funcionário:</Text>
            <Text style={styles.value}>{data.employeeName}</Text>
          </View>
          <View style={styles.metaRow}>
            <Text style={styles.label}>Máquina:</Text>
            <Text style={styles.value}>{data.machineName}</Text>
          </View>
          <View style={styles.metaRow}>
            <Text style={styles.label}>Local:</Text>
            <Text style={styles.value}>{data.city} / {data.state}</Text>
          </View>
          <View style={styles.metaRow}>
            <Text style={styles.label}>Tipo:</Text>
            <Text style={styles.value}>{data.jobType === 'maintenance' ? 'Manutenção' : 'Implementação'}</Text>
          </View>
        </View>

        {/* Report body */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Relatório</Text>
          <Text style={styles.body}>{stripHtml(data.reportContent)}</Text>
        </View>

        {/* Evidences list */}
        {data.evidences.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Evidências</Text>
            {data.evidences.map((ev, i) => (
              <Text key={i} style={styles.evidenceItem}>• {ev.fileName} ({ev.type})</Text>
            ))}
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text>SR Energy — Relatório #{data.jobId.slice(0, 8)}</Text>
          <Text>{data.employeeName} — {formatDate(data.submittedAt)}</Text>
        </View>
      </Page>
    </Document>
  )
}
```

- [ ] **Step 2: Verify build**

```bash
npm run build
```
Expected: no TypeScript errors

- [ ] **Step 3: Commit**

```bash
git add src/views/components/JobReportPdf.tsx
git commit -m "feat: create JobReportPdf component with @react-pdf/renderer"
```

---

## Task 9: Replace PDF stub in ManagerJobDetailPage

**Files:**
- Modify: `src/views/pages/ManagerJobDetailPage.tsx`

- [ ] **Step 1: Add import**

```typescript
import { pdf } from '@react-pdf/renderer'
import { JobReportPdf } from '@/views/components/JobReportPdf'
import { buildPdfData } from '@/models/job-report.model'
```

- [ ] **Step 2: Add download state**

After `const [error, setError] = useState<string | null>(null)`, add:
```typescript
const [generatingPdf, setGeneratingPdf] = useState(false)
```

- [ ] **Step 3: Replace the stub function**

Replace:
```typescript
function handleGeneratePdf(data: PdfData) {
  console.log('PDF data:', data)
  alert('Funcionalidade de PDF: dados prontos para geração.')
}
```

With:
```typescript
async function handleGeneratePdf(data: PdfData) {
  setGeneratingPdf(true)
  try {
    const blob = await pdf(<JobReportPdf data={data} />).toBlob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `relatorio-${data.jobId.slice(0, 8)}.pdf`
    a.click()
    URL.revokeObjectURL(url)
  } finally {
    setGeneratingPdf(false)
  }
}
```

- [ ] **Step 4: Pass generatingPdf to JobReportView (if it accepts a loading prop)**

Check if `JobReportView` accepts a `pdfLoading` or similar prop. If it does, pass `generatingPdf`. If not, the button will just not show a spinner — acceptable for now.

- [ ] **Step 5: Verify build**

```bash
npm run build
```
Expected: no TypeScript errors

- [ ] **Step 6: Commit**

```bash
git add src/views/pages/ManagerJobDetailPage.tsx
git commit -m "feat: implement PDF download in ManagerJobDetailPage"
```

---

## Task 10: Mobile sidebar — convert to DaisyUI drawer

**Context:** `AppLayout.tsx` uses a simple `<div className="flex min-h-screen">` with `<Sidebar>` always visible. On mobile, the sidebar is 256px wide and pushes content off-screen. DaisyUI's `drawer` component solves this: sidebar is hidden by default on mobile and slides in via toggle.

**Files:**
- Modify: `src/views/layouts/AppLayout.tsx`
- Modify: `src/views/components/Sidebar.tsx`
- Modify: `src/views/components/Navbar.tsx`

- [ ] **Step 1: Update AppLayout to use DaisyUI drawer**

Replace the entire return in `AppLayout.tsx`:

```typescript
import { useState } from 'react'
// ... existing imports

export function AppLayout() {
  const { user, logout } = useAuth()
  const [drawerOpen, setDrawerOpen] = useState(false)

  if (!user) return null

  return (
    <div className="drawer lg:drawer-open min-h-screen">
      <input
        id="app-drawer"
        type="checkbox"
        className="drawer-toggle"
        checked={drawerOpen}
        onChange={(e) => setDrawerOpen(e.target.checked)}
        readOnly
      />

      {/* Page content */}
      <div className="drawer-content flex flex-col">
        <Navbar user={user} onLogout={logout} onMenuClick={() => setDrawerOpen(true)} />
        <main className="flex-1 p-4 sm:p-6 overflow-auto bg-base-100">
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </main>
      </div>

      {/* Sidebar drawer */}
      <div className="drawer-side z-40">
        <label
          htmlFor="app-drawer"
          className="drawer-overlay"
          onClick={() => setDrawerOpen(false)}
        />
        <Sidebar role={user.role} onClose={() => setDrawerOpen(false)} />
      </div>

      <ToastContainer />
    </div>
  )
}
```

- [ ] **Step 2: Update Sidebar to accept onClose prop**

In `src/views/components/Sidebar.tsx`, update the interface and add close behavior on mobile nav clicks:

```typescript
interface SidebarProps {
  role: Role
  onClose?: () => void
}

export function Sidebar({ role, onClose }: SidebarProps) {
  // ... existing code

  // Update the <aside> className — remove min-h-screen (drawer handles height):
  <aside className="w-64 h-full min-h-screen bg-base-200 border-r border-base-300 flex flex-col">

  // Update each NavLink to call onClose on mobile:
  <NavLink
    key={item.path}
    to={item.path}
    end={item.path === '/'}
    onClick={onClose}   // ← add this
    className={...}
  >
```

- [ ] **Step 3: Update Navbar to accept and use onMenuClick**

In `src/views/components/Navbar.tsx`, find the Navbar props interface and add `onMenuClick`:

```typescript
// Add to props interface:
onMenuClick: () => void

// Add hamburger button — visible only on mobile (before the existing content):
<button
  className="btn btn-ghost btn-sm btn-square lg:hidden"
  onClick={onMenuClick}
  aria-label="Abrir menu"
>
  <Menu size={18} />  {/* import Menu from lucide-react */}
</button>
```

- [ ] **Step 4: Verify build**

```bash
npm run build
```
Expected: no TypeScript errors

- [ ] **Step 5: Manual check — resize browser**

Start dev server (`npm run dev`), open at `localhost:5173`, resize window below `lg` breakpoint (1024px). Sidebar should be hidden. Hamburger should appear in navbar. Clicking hamburger should open the sidebar drawer.

- [ ] **Step 6: Commit**

```bash
git add src/views/layouts/AppLayout.tsx src/views/components/Sidebar.tsx src/views/components/Navbar.tsx
git commit -m "feat: convert sidebar to DaisyUI drawer for mobile support"
```

---

## Task 11: Add responsive classes to Dashboard pages

**Files:**
- Modify: `src/views/pages/ManagerDashboardPage.tsx`
- Modify: `src/views/pages/EmployeeDashboardPage.tsx`

- [ ] **Step 1: Update ManagerDashboardPage grid classes**

Find all `grid grid-cols-*` patterns and update:
- `grid grid-cols-3` → `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`
- `grid grid-cols-2` → `grid grid-cols-1 sm:grid-cols-2`
- Any `gap-4` on grids — keep as-is

- [ ] **Step 2: Update EmployeeDashboardPage grid classes**

Same pattern:
- `grid grid-cols-2` → `grid grid-cols-1 sm:grid-cols-2`
- `grid grid-cols-3` → `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`

- [ ] **Step 3: Verify build**

```bash
npm run build
```
Expected: no TypeScript errors

- [ ] **Step 3: Fix filter bar wrapping on EmployeeListPage and JobListPage**

In `EmployeeListPage.tsx`, find the row containing the search input and the "+ New" button. Wrap it in `flex-wrap` so it stacks on small screens:
```typescript
// Change:
<div className="flex items-center justify-between">
// To:
<div className="flex flex-wrap items-center justify-between gap-3">
```

In `JobListPage.tsx`, find the filter row (status select + search input). Add `flex-wrap gap-2` so filters stack vertically on mobile:
```typescript
// Change existing filter container className to include: flex-wrap gap-2
```

- [ ] **Step 4: Ensure form pages have consistent max-w-xl**

Check these files — each should have `max-w-xl` (or `max-w-2xl` for wider forms) on its root content div:
- `src/views/pages/ContractFormPage.tsx`
- `src/views/pages/MachineFormPage.tsx`
- `src/views/pages/JobFormPage.tsx`

`EmployeeFormPage.tsx` already has `max-w-xl` — use it as the reference. Add `max-w-xl mx-auto` to any that are missing it.

- [ ] **Step 5: Fix JobStepper label visibility on mobile**

Open `src/views/components/JobStepper.tsx`. Find where step labels (text next to step indicators) are rendered. Wrap the label text so it hides on very small screens:
```typescript
// Change:
<span>{label}</span>
// To:
<span className="hidden sm:inline">{label}</span>
```
This keeps the numbered circles visible on mobile while preventing label overflow.

- [ ] **Step 6: Verify build**

```bash
npm run build
```
Expected: no TypeScript errors

- [ ] **Step 7: Commit**

```bash
git add src/views/pages/ManagerDashboardPage.tsx src/views/pages/EmployeeDashboardPage.tsx src/views/pages/EmployeeListPage.tsx src/views/pages/JobListPage.tsx src/views/pages/ContractFormPage.tsx src/views/pages/MachineFormPage.tsx src/views/pages/JobFormPage.tsx src/views/components/JobStepper.tsx
git commit -m "fix: mobile responsive polish — grids, filter bars, form widths, stepper labels"
```

---

## Final Verification

- [ ] **Run full test suite**

```bash
npm test
```
Expected: all tests pass

- [ ] **Run production build**

```bash
npm run build
```
Expected: 0 errors, 0 warnings about missing types

- [ ] **Manual smoke test checklist**

1. Open app, resize below 1024px — hamburger appears, sidebar hidden ✓
2. Click hamburger — sidebar slides open ✓
3. Click a nav item — sidebar closes, page loads ✓
4. Go to Employees list — pagination controls appear after 10+ records ✓
5. Filter employees — pagination resets to page 1 ✓
6. Go to employee edit → Reajustes tab → submit form — adjustment appears, no direct service call in devtools ✓
7. Go to a completed job as manager → Finalizado tab → click "Gerar PDF" — PDF downloads ✓
8. Open PDF — header, report body, evidences list, footer visible ✓
