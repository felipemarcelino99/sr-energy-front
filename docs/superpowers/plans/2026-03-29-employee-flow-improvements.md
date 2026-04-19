# Employee Flow Improvements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a read-only employee calendar to the dashboard, wire job-status card clicks to filtered navigation, and remove redundant NextJobWidget/notifications sections.

**Architecture:** Four independent file changes — `DayDetailPanel` gains a `readOnly` prop, `CalendarToolbar` makes employee filter and new-event button optional, a new `EmployeeScheduleWidget` composes the calendar for employees, and `EmployeeDashboardPage`/`EmployeeJobListPage` are wired together via a `?status` query param.

**Tech Stack:** React 19, TypeScript, Zustand, React Router DOM v7, DaisyUI, Jest + Testing Library

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `src/views/components/DayDetailPanel.tsx` | Modify | Add `readOnly` prop — shows link instead of edit/cancel |
| `src/views/components/CalendarToolbar.tsx` | Modify | Make `onNewEvent` and employee filter optional |
| `src/views/components/EmployeeScheduleWidget.tsx` | Create | Read-only calendar auto-filtered to current employee |
| `src/views/pages/EmployeeDashboardPage.tsx` | Modify | Replace NextJobWidget+notifications with EmployeeScheduleWidget; wire status clicks |
| `src/views/pages/EmployeeJobListPage.tsx` | Modify | Read `?status` query param; apply combined filter |
| `src/views/components/ScheduleWidget.tsx` | Modify | Pass `onJobClick` prop that DayDetailPanel now requires |
| `src/__tests__/views/DayDetailPanel.test.tsx` | Create | Tests for readOnly mode |
| `src/__tests__/views/EmployeeScheduleWidget.test.tsx` | Create | Smoke tests for new widget |
| `src/__tests__/views/EmployeeDashboardPage.test.tsx` | Create | Layout and navigation tests |
| `src/__tests__/views/EmployeeJobListPage.test.tsx` | Create | Query param filter tests |

---

## Task 1: DayDetailPanel — readOnly prop

**Files:**
- Modify: `src/views/components/DayDetailPanel.tsx`
- Create: `src/__tests__/views/DayDetailPanel.test.tsx`

- [ ] **Step 1: Write the failing tests**

Create `src/__tests__/views/DayDetailPanel.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { DayDetailPanel } from '@/views/components/DayDetailPanel'
import type { CalendarEntry } from '@/models/schedule.model'

const jobEntry: CalendarEntry = {
  kind: 'job',
  data: {
    id: 'j1',
    description: 'Manutenção Turbina',
    jobType: 'maintenance',
    status: 'scheduled',
    scheduledDate: '2026-03-15',
    city: 'Curitiba',
    state: 'PR',
    startTime: '08:00',
    endTime: '12:00',
    employeeId: 'e1',
    employeeName: 'Ana Silva',
    accommodation: false,
    car: true,
    machineId: 'm1',
  } as any,
}

const eventEntry: CalendarEntry = {
  kind: 'event',
  data: {
    id: 'ev1',
    type: 'vacation',
    status: 'active',
    employeeIds: ['e1'],
    employeeNames: ['Ana Silva'],
    startDate: '2026-03-10',
    endDate: '2026-03-14',
    notes: '',
  },
}

function renderPanel(entries: CalendarEntry[], readOnly = false) {
  return render(
    <MemoryRouter>
      <DayDetailPanel
        date="2026-03-15"
        entries={entries}
        readOnly={readOnly}
        onJobEdit={jest.fn()}
        onJobCancel={jest.fn()}
        onEventCancel={jest.fn()}
      />
    </MemoryRouter>
  )
}

describe('DayDetailPanel — readOnly=false (default)', () => {
  it('exibe botão Editar para job não cancelado', () => {
    renderPanel([jobEntry], false)
    expect(screen.getByRole('button', { name: /editar/i })).toBeInTheDocument()
  })

  it('exibe botão Cancelar para job não cancelado', () => {
    renderPanel([jobEntry], false)
    expect(screen.getByRole('button', { name: /cancelar/i })).toBeInTheDocument()
  })

  it('exibe botão Cancelar para evento', () => {
    renderPanel([eventEntry], false)
    expect(screen.getByRole('button', { name: /cancelar/i })).toBeInTheDocument()
  })
})

describe('DayDetailPanel — readOnly=true', () => {
  it('exibe link "Ver detalhes" para job', () => {
    renderPanel([jobEntry], true)
    const link = screen.getByRole('link', { name: /ver detalhes/i })
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute('href', '/my-jobs/j1')
  })

  it('não exibe botão Editar quando readOnly', () => {
    renderPanel([jobEntry], true)
    expect(screen.queryByRole('button', { name: /editar/i })).not.toBeInTheDocument()
  })

  it('não exibe botão Cancelar para job quando readOnly', () => {
    renderPanel([jobEntry], true)
    // "Cancelar" buttons should not exist (only the "Ver detalhes" link)
    expect(screen.queryByRole('button', { name: /cancelar/i })).not.toBeInTheDocument()
  })

  it('não exibe botão Cancelar para evento quando readOnly', () => {
    renderPanel([eventEntry], true)
    expect(screen.queryByRole('button', { name: /cancelar/i })).not.toBeInTheDocument()
  })

  it('exibe detalhes do evento normalmente quando readOnly', () => {
    renderPanel([eventEntry], true)
    expect(screen.getByText('Ana Silva')).toBeInTheDocument()
  })
})

describe('DayDetailPanel — sem entradas', () => {
  it('não renderiza nada quando entries está vazio', () => {
    const { container } = renderPanel([], false)
    expect(container).toBeEmptyDOMElement()
  })
})
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
cd "C:/Material Programação/projetos/sr-energy-front"
npm test -- --testPathPatterns=DayDetailPanel --no-coverage
```

Expected: FAIL — `DayDetailPanel` doesn't accept `readOnly` prop yet.

- [ ] **Step 3: Update DayDetailPanel with readOnly prop**

Replace the entire content of `src/views/components/DayDetailPanel.tsx`:

```tsx
import { useState } from 'react'
import { Link } from 'react-router-dom'
import type { CalendarEntry } from '@/models/schedule.model'
import { EVENT_TYPE_COLORS, EVENT_TYPE_LABELS, JOB_COLOR } from '@/models/schedule.model'
import type { Job } from '@/models/job.model'
import type { ScheduleEvent } from '@/models/schedule.model'
import { formatDate } from '@/utils/date'

interface Props {
  date: string | null
  entries: CalendarEntry[]
  readOnly?: boolean
  onJobEdit?: (id: string) => void
  onJobCancel?: (id: string) => Promise<void>
  onEventCancel?: (id: string) => Promise<void>
}

function JobRow({ job, onEdit, onCancel, readOnly = false }: {
  job: Job
  onEdit?: (id: string) => void
  onCancel?: (id: string) => Promise<void>
  readOnly?: boolean
}) {
  const [expanded, setExpanded] = useState(true)
  const [confirming, setConfirming] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const jobTypeLabel = job.jobType === 'maintenance' ? 'Manutenção' : 'Implementação'
  const isCancelled = job.status === 'cancelled'

  const handleConfirmCancel = async () => {
    setCancelling(true)
    try {
      await onCancel!(job.id)
    } finally {
      setCancelling(false)
      setConfirming(false)
    }
  }

  return (
    <>
      <div className="rounded-md bg-base-300 overflow-hidden">
        <div
          className="flex gap-3 items-start p-2 cursor-pointer hover:bg-base-100 transition-colors"
          onClick={() => setExpanded((v) => !v)}
        >
          <span className="w-2.5 h-2.5 rounded-sm mt-0.5 flex-shrink-0" style={{ backgroundColor: JOB_COLOR }} />
          <div className="min-w-0">
            <p className="text-xs font-semibold truncate">{job.description} · {job.city}/{job.state}</p>
            <p className="text-[11px] text-base-content/50">{jobTypeLabel} — {job.employeeName}</p>
          </div>
        </div>

        {expanded && (
          <div className="px-3 pb-3 pt-1 border-t border-base-200 flex flex-col gap-1 text-sm">
            <p><span className="font-medium">Descrição:</span> {job.description}</p>
            <p><span className="font-medium">Local:</span> {job.city}/{job.state}</p>
            <p><span className="font-medium">Horário:</span> {job.startTime} – {job.endTime}</p>
            <p>
              <span className="font-medium">Hospedagem:</span> {job.accommodation ? 'Sim' : 'Não'}
              {' · '}
              <span className="font-medium">Carro:</span> {job.car ? 'Sim' : 'Não'}
            </p>
            <div className="mt-2 flex gap-2">
              {readOnly ? (
                <Link
                  to={`/my-jobs/${job.id}`}
                  className="btn btn-xs btn-ghost"
                >
                  Ver detalhes →
                </Link>
              ) : !isCancelled && (
                <>
                  <button
                    type="button"
                    className="btn btn-xs btn-outline"
                    onClick={(e) => { e.stopPropagation(); onEdit!(job.id) }}
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    className="btn btn-xs btn-error btn-outline"
                    onClick={(e) => { e.stopPropagation(); setConfirming(true) }}
                  >
                    Cancelar
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {!readOnly && confirming && (
        <div className="modal modal-open" role="dialog" aria-modal="true">
          <div className="modal-box max-w-sm">
            <h3 className="font-bold text-base mb-2">Cancelar trabalho</h3>
            <p className="text-sm text-base-content/70">
              Tem certeza que deseja cancelar <span className="font-semibold">{job.description}</span>? Esta ação não pode ser desfeita.
            </p>
            <div className="modal-action">
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => setConfirming(false)}
                disabled={cancelling}
              >
                Voltar
              </button>
              <button
                type="button"
                className="btn btn-error btn-sm"
                onClick={handleConfirmCancel}
                disabled={cancelling}
              >
                {cancelling ? <span className="loading loading-spinner loading-xs" /> : 'Confirmar cancelamento'}
              </button>
            </div>
          </div>
          <div className="modal-backdrop" onClick={() => !cancelling && setConfirming(false)} />
        </div>
      )}
    </>
  )
}

function EventRow({ event, onCancel, readOnly = false }: {
  event: ScheduleEvent
  onCancel?: (id: string) => Promise<void>
  readOnly?: boolean
}) {
  const [expanded, setExpanded] = useState(true)
  const [confirming, setConfirming] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const color = EVENT_TYPE_COLORS[event.type]
  const label = EVENT_TYPE_LABELS[event.type]

  const handleConfirmCancel = async () => {
    setCancelling(true)
    try {
      await onCancel!(event.id)
    } finally {
      setCancelling(false)
      setConfirming(false)
    }
  }

  return (
    <>
      <div className="rounded-md bg-base-300 overflow-hidden">
        <div
          className="flex gap-3 items-start p-2 cursor-pointer hover:bg-base-100 transition-colors"
          onClick={() => setExpanded((v) => !v)}
        >
          <span className="w-2.5 h-2.5 rounded-sm mt-0.5 flex-shrink-0" style={{ backgroundColor: color }} />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold">{label}</p>
            <p className="text-[11px] text-base-content/50">{event.employeeNames.join(', ')}</p>
          </div>
        </div>

        {expanded && (
          <div className="px-3 pb-3 pt-1 border-t border-base-200 flex flex-col gap-1 text-sm">
            <p><span className="font-medium">Período:</span> {formatDate(event.startDate)}{event.endDate !== event.startDate ? ` – ${formatDate(event.endDate)}` : ''}</p>
            <p><span className="font-medium">Funcionários:</span> {event.employeeNames.join(', ')}</p>
            {event.notes && <p><span className="font-medium">Observações:</span> {event.notes}</p>}
            {!readOnly && (
              <div className="mt-2">
                <button
                  type="button"
                  className="btn btn-xs btn-error btn-outline"
                  onClick={(e) => { e.stopPropagation(); setConfirming(true) }}
                >
                  Cancelar
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {!readOnly && confirming && (
        <div className="modal modal-open" role="dialog" aria-modal="true">
          <div className="modal-box max-w-sm">
            <h3 className="font-bold text-base mb-2">Cancelar evento</h3>
            <p className="text-sm text-base-content/70">
              Tem certeza que deseja cancelar <span className="font-semibold">{label}</span> de <span className="font-semibold">{event.employeeNames.join(', ')}</span>?
            </p>
            <div className="modal-action">
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setConfirming(false)} disabled={cancelling}>
                Voltar
              </button>
              <button type="button" className="btn btn-error btn-sm" onClick={handleConfirmCancel} disabled={cancelling}>
                {cancelling ? <span className="loading loading-spinner loading-xs" /> : 'Confirmar cancelamento'}
              </button>
            </div>
          </div>
          <div className="modal-backdrop" onClick={() => !cancelling && setConfirming(false)} />
        </div>
      )}
    </>
  )
}

export function DayDetailPanel({ date, entries, readOnly = false, onJobEdit, onJobCancel, onEventCancel }: Props) {
  if (!date || entries.length === 0) return null

  return (
    <div className="mt-4 bg-base-200 rounded-lg p-3">
      <p className="text-xs font-semibold text-base-content/50 mb-2">{formatDate(date)} — Detalhes</p>
      <div className="flex flex-col gap-1.5">
        {entries.map((entry) =>
          entry.kind === 'job'
            ? <JobRow key={entry.kind + '-' + entry.data.id} job={entry.data} onEdit={onJobEdit} onCancel={onJobCancel} readOnly={readOnly} />
            : <EventRow key={entry.kind + '-' + entry.data.id} event={entry.data} onCancel={onEventCancel} readOnly={readOnly} />
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Update ScheduleWidget — fix DayDetailPanel call (props are now optional)**

`ScheduleWidget` currently passes `onJobClick` which no longer exists. Open `src/views/components/ScheduleWidget.tsx` and update the `DayDetailPanel` call — remove `onJobClick` and confirm `onJobEdit`, `onJobCancel`, `onEventCancel` are still passed:

```tsx
{selectedDate && (
  <DayDetailPanel
    date={selectedDate}
    entries={grouped.get(selectedDate) ?? []}
    onJobEdit={(id) => navigate(`/jobs/${id}/edit`)}
    onJobCancel={async (id) => { await cancelJob(id); await load() }}
    onEventCancel={async (id) => { await cancelScheduleEvent(id); await loadEvents() }}
  />
)}
```

- [ ] **Step 5: Run tests — confirm all pass**

```bash
npm test -- --testPathPatterns=DayDetailPanel --no-coverage
```

Expected: all tests PASS.

- [ ] **Step 6: Commit**

```bash
git add src/views/components/DayDetailPanel.tsx src/views/components/ScheduleWidget.tsx src/__tests__/views/DayDetailPanel.test.tsx
git commit -m "feat(calendar): add readOnly mode to DayDetailPanel"
```

---

## Task 2: CalendarToolbar — make employee filter and new-event button optional

**Files:**
- Modify: `src/views/components/CalendarToolbar.tsx`

- [ ] **Step 1: Update the Props interface and conditional rendering**

In `src/views/components/CalendarToolbar.tsx`, change the `Props` interface and the render section:

```tsx
interface Props {
  year: number
  month: number
  employees: Employee[]
  employeeFilter: string | null
  onPrev: () => void
  onNext: () => void
  onToday: () => void
  onMonthSelect: (year: number, month: number) => void
  onEmployeeFilter: (id: string | null) => void
  onNewEvent?: () => void  // optional — omit to hide the button
}
```

In the render, change the right side of the toolbar:

```tsx
<div className="flex items-center gap-2">
  {employees.length > 0 && (
    <select
      className="select select-sm select-bordered w-44"
      value={employeeFilter ?? ''}
      onChange={(e) => onEmployeeFilter(e.target.value || null)}
    >
      <option value="">Todos os funcionários</option>
      {employees.map((emp) => (
        <option key={emp.id} value={emp.id}>{emp.name}</option>
      ))}
    </select>
  )}
  {onNewEvent && (
    <button className="btn btn-sm btn-primary gap-1" onClick={onNewEvent}>
      <Plus size={13} /> Novo Evento
    </button>
  )}
</div>
```

- [ ] **Step 2: Run existing tests to confirm nothing broke**

```bash
npm test -- --no-coverage
```

Expected: all previously passing tests still PASS. No CalendarToolbar-specific test suite exists yet, so this is a regression check.

- [ ] **Step 3: Commit**

```bash
git add src/views/components/CalendarToolbar.tsx
git commit -m "feat(calendar): make employee filter and new-event button optional in CalendarToolbar"
```

---

## Task 3: EmployeeScheduleWidget — new read-only calendar component

**Files:**
- Create: `src/views/components/EmployeeScheduleWidget.tsx`
- Create: `src/__tests__/views/EmployeeScheduleWidget.test.tsx`

- [ ] **Step 1: Write the failing tests**

Create `src/__tests__/views/EmployeeScheduleWidget.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { EmployeeScheduleWidget } from '@/views/components/EmployeeScheduleWidget'

jest.mock('@/viewmodels/auth.context', () => ({
  useAuth: () => ({ user: { id: 'u1', employeeId: 'e1', role: 'employee' } }),
}))

jest.mock('@/viewmodels/schedule.viewmodel', () => ({
  useScheduleStore: () => ({
    load: jest.fn(),
    loading: false,
    currentMonth: { year: 2026, month: 3 },
    setCurrentMonth: jest.fn(),
    selectedDate: null,
    setSelectedDate: jest.fn(),
    setEmployeeFilter: jest.fn(),
    groupedByDate: () => new Map(),
  }),
}))

jest.mock('@/views/components/CalendarToolbar', () => ({
  CalendarToolbar: () => <div data-testid="calendar-toolbar" />,
}))

jest.mock('@/views/components/CalendarLegend', () => ({
  CalendarLegend: () => <div data-testid="calendar-legend" />,
}))

jest.mock('@/views/components/CalendarGrid', () => ({
  CalendarGrid: () => <div data-testid="calendar-grid" />,
}))

jest.mock('@/views/components/DayDetailPanel', () => ({
  DayDetailPanel: () => null,
}))

function renderWidget() {
  return render(
    <MemoryRouter>
      <EmployeeScheduleWidget />
    </MemoryRouter>
  )
}

describe('EmployeeScheduleWidget', () => {
  it('exibe o título "Minha Agenda"', () => {
    renderWidget()
    expect(screen.getByText('Minha Agenda')).toBeInTheDocument()
  })

  it('renderiza CalendarToolbar, CalendarLegend e CalendarGrid', () => {
    renderWidget()
    expect(screen.getByTestId('calendar-toolbar')).toBeInTheDocument()
    expect(screen.getByTestId('calendar-legend')).toBeInTheDocument()
    expect(screen.getByTestId('calendar-grid')).toBeInTheDocument()
  })

  it('não exibe o grid quando loading=true', () => {
    jest.mocked(require('@/viewmodels/schedule.viewmodel').useScheduleStore).mockReturnValueOnce({
      load: jest.fn(),
      loading: true,
      currentMonth: { year: 2026, month: 3 },
      setCurrentMonth: jest.fn(),
      selectedDate: null,
      setSelectedDate: jest.fn(),
      setEmployeeFilter: jest.fn(),
      groupedByDate: () => new Map(),
    })
    renderWidget()
    expect(screen.queryByTestId('calendar-grid')).not.toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npm test -- --testPathPatterns=EmployeeScheduleWidget --no-coverage
```

Expected: FAIL — component file doesn't exist yet.

- [ ] **Step 3: Create EmployeeScheduleWidget**

Create `src/views/components/EmployeeScheduleWidget.tsx`:

```tsx
import { useEffect } from 'react'
import { useAuth } from '@/viewmodels/auth.context'
import { useScheduleStore } from '@/viewmodels/schedule.viewmodel'
import { CalendarToolbar } from '@/views/components/CalendarToolbar'
import { CalendarLegend } from '@/views/components/CalendarLegend'
import { CalendarGrid } from '@/views/components/CalendarGrid'
import { DayDetailPanel } from '@/views/components/DayDetailPanel'

export function EmployeeScheduleWidget() {
  const { user } = useAuth()
  const {
    load,
    loading,
    currentMonth,
    setCurrentMonth,
    selectedDate,
    setSelectedDate,
    setEmployeeFilter,
    groupedByDate,
  } = useScheduleStore()

  const employeeId = user?.employeeId ?? user?.id ?? null

  useEffect(() => {
    if (employeeId) setEmployeeFilter(employeeId)
    load()
    return () => { setEmployeeFilter(null) }
  }, [employeeId, load, setEmployeeFilter])

  const grouped = groupedByDate()
  const { year, month } = currentMonth

  const goToPrev = () =>
    setCurrentMonth({ year, month: month === 1 ? 12 : month - 1 })
  const goToNext = () =>
    setCurrentMonth({ year, month: month === 12 ? 1 : month + 1 })
  const goToToday = () => {
    const d = new Date()
    setCurrentMonth({ year: d.getFullYear(), month: d.getMonth() + 1 })
  }

  if (loading) {
    return <div className="animate-pulse h-64 bg-base-300 rounded-xl" />
  }

  return (
    <div className="card bg-base-200 border border-base-300">
      <div className="card-body gap-3">
        <h2 className="text-xs font-semibold text-base-content/40 uppercase tracking-wider">
          Minha Agenda
        </h2>

        <CalendarToolbar
          year={year}
          month={month}
          employees={[]}
          employeeFilter={null}
          onPrev={goToPrev}
          onNext={goToNext}
          onToday={goToToday}
          onMonthSelect={(y, m) => setCurrentMonth({ year: y, month: m })}
          onEmployeeFilter={() => {}}
        />

        <CalendarLegend />

        <CalendarGrid
          grouped={grouped}
          selectedDate={selectedDate}
          onDateSelect={setSelectedDate}
        />

        {selectedDate && (
          <DayDetailPanel
            date={selectedDate}
            entries={grouped.get(selectedDate) ?? []}
            readOnly={true}
          />
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Run tests — confirm they pass**

```bash
npm test -- --testPathPatterns=EmployeeScheduleWidget --no-coverage
```

Expected: all tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/views/components/EmployeeScheduleWidget.tsx src/__tests__/views/EmployeeScheduleWidget.test.tsx
git commit -m "feat(employee): add EmployeeScheduleWidget — read-only calendar filtered to current employee"
```

---

## Task 4: EmployeeDashboardPage — new layout and status click navigation

**Files:**
- Modify: `src/views/pages/EmployeeDashboardPage.tsx`
- Create: `src/__tests__/views/EmployeeDashboardPage.test.tsx`

- [ ] **Step 1: Write the failing tests**

Create `src/__tests__/views/EmployeeDashboardPage.test.tsx`:

```tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { EmployeeDashboardPage } from '@/views/pages/EmployeeDashboardPage'

const mockNavigate = jest.fn()
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}))

jest.mock('@/viewmodels/auth.context', () => ({
  useAuth: () => ({ user: { id: 'u1', employeeId: 'e1', role: 'employee' } }),
}))

jest.mock('@/viewmodels/employee.dashboard.viewmodel', () => ({
  useEmployeeDashboardStore: () => ({
    loading: false,
    error: null,
    loadMyJobs: jest.fn(),
    myJobsByStatus: () => [
      { status: 'scheduled', count: 2 },
      { status: 'in_progress', count: 1 },
      { status: 'completed', count: 5 },
      { status: 'cancelled', count: 0 },
    ],
    nextJob: () => null,
  }),
}))

jest.mock('@/views/components/JobStatusCard', () => ({
  JobStatusCard: ({ onStatusClick }: { onStatusClick: (s: string) => void }) => (
    <div>
      <button onClick={() => onStatusClick('scheduled')}>scheduled</button>
      <button onClick={() => onStatusClick('completed')}>completed</button>
    </div>
  ),
}))

jest.mock('@/views/components/EmployeeScheduleWidget', () => ({
  EmployeeScheduleWidget: () => <div data-testid="employee-schedule-widget" />,
}))

function renderPage() {
  return render(
    <MemoryRouter>
      <EmployeeDashboardPage />
    </MemoryRouter>
  )
}

describe('EmployeeDashboardPage', () => {
  beforeEach(() => { mockNavigate.mockClear() })

  it('exibe o título "Meu Dashboard"', () => {
    renderPage()
    expect(screen.getByText('Meu Dashboard')).toBeInTheDocument()
  })

  it('renderiza o EmployeeScheduleWidget', () => {
    renderPage()
    expect(screen.getByTestId('employee-schedule-widget')).toBeInTheDocument()
  })

  it('não renderiza NextJobWidget', () => {
    renderPage()
    expect(screen.queryByText('Próximo Trabalho')).not.toBeInTheDocument()
  })

  it('não renderiza o placeholder de notificações', () => {
    renderPage()
    expect(screen.queryByText('Últimas Notificações')).not.toBeInTheDocument()
  })

  it('navega para /my-jobs?status=scheduled ao clicar no card', () => {
    renderPage()
    fireEvent.click(screen.getByRole('button', { name: 'scheduled' }))
    expect(mockNavigate).toHaveBeenCalledWith('/my-jobs?status=scheduled')
  })

  it('navega para /my-jobs?status=completed ao clicar no card', () => {
    renderPage()
    fireEvent.click(screen.getByRole('button', { name: 'completed' }))
    expect(mockNavigate).toHaveBeenCalledWith('/my-jobs?status=completed')
  })
})
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npm test -- --testPathPatterns=EmployeeDashboardPage --no-coverage
```

Expected: FAIL — `EmployeeScheduleWidget` isn't imported yet, status click doesn't navigate.

- [ ] **Step 3: Update EmployeeDashboardPage**

Replace the content of `src/views/pages/EmployeeDashboardPage.tsx`:

```tsx
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/viewmodels/auth.context'
import { useEmployeeDashboardStore } from '@/viewmodels/employee.dashboard.viewmodel'
import { JobStatusCard } from '@/views/components/JobStatusCard'
import { EmployeeScheduleWidget } from '@/views/components/EmployeeScheduleWidget'

function todayLabel(): string {
  return new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
}

export function EmployeeDashboardPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { loading, error, loadMyJobs, myJobsByStatus } = useEmployeeDashboardStore()

  useEffect(() => {
    const id = user?.employeeId ?? user?.id
    if (id) loadMyJobs(id)
  }, [user?.employeeId, user?.id, loadMyJobs])

  if (loading) {
    return (
      <div className="flex flex-col gap-4 animate-pulse">
        <div className="h-10 w-48 bg-base-300 rounded-lg" />
        <div className="h-24 bg-base-300 rounded-xl" />
        <div className="h-64 bg-base-300 rounded-xl" />
      </div>
    )
  }

  if (error) {
    return <div role="alert" className="alert alert-error">{error}</div>
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Page header */}
      <div>
        <h1 className="text-xl font-bold tracking-tight">Meu Dashboard</h1>
        <p className="text-sm text-base-content/40 mt-0.5 capitalize">{todayLabel()}</p>
      </div>

      {/* Job status summary */}
      <JobStatusCard
        summary={myJobsByStatus()}
        onStatusClick={(status) => navigate(`/my-jobs?status=${status}`)}
      />

      {/* Personal schedule calendar */}
      <EmployeeScheduleWidget />
    </div>
  )
}
```

- [ ] **Step 4: Run tests — confirm they pass**

```bash
npm test -- --testPathPatterns=EmployeeDashboardPage --no-coverage
```

Expected: all tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/views/pages/EmployeeDashboardPage.tsx src/__tests__/views/EmployeeDashboardPage.test.tsx
git commit -m "feat(employee): replace NextJobWidget+notifications with EmployeeScheduleWidget; wire status click"
```

---

## Task 5: EmployeeJobListPage — read ?status query param

**Files:**
- Modify: `src/views/pages/EmployeeJobListPage.tsx`
- Create: `src/__tests__/views/EmployeeJobListPage.test.tsx`

- [ ] **Step 1: Write the failing tests**

Create `src/__tests__/views/EmployeeJobListPage.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { EmployeeJobListPage } from '@/views/pages/EmployeeJobListPage'

const mockSetFilters = jest.fn()
const mockLoad = jest.fn()

jest.mock('@/viewmodels/job.viewmodel', () => ({
  useJobStore: () => ({
    load: mockLoad,
    filtered: () => [],
    loading: false,
    error: null,
    setFilters: mockSetFilters,
  }),
}))

jest.mock('@/viewmodels/auth.context', () => ({
  useAuth: () => ({ user: { id: 'u1', employeeId: 'e1', role: 'employee' } }),
}))

function renderWithRoute(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/my-jobs" element={<EmployeeJobListPage />} />
      </Routes>
    </MemoryRouter>
  )
}

describe('EmployeeJobListPage', () => {
  beforeEach(() => {
    mockSetFilters.mockClear()
    mockLoad.mockClear()
  })

  it('aplica apenas o filtro de employeeId quando não há ?status', () => {
    renderWithRoute('/my-jobs')
    expect(mockSetFilters).toHaveBeenCalledWith({ employeeId: 'e1' })
    expect(mockSetFilters).not.toHaveBeenCalledWith(
      expect.objectContaining({ status: expect.anything() })
    )
  })

  it('aplica filtro combinado employeeId + status quando ?status está na URL', () => {
    renderWithRoute('/my-jobs?status=scheduled')
    expect(mockSetFilters).toHaveBeenCalledWith({ employeeId: 'e1', status: 'scheduled' })
  })

  it('aplica filtro de status completed quando ?status=completed', () => {
    renderWithRoute('/my-jobs?status=completed')
    expect(mockSetFilters).toHaveBeenCalledWith({ employeeId: 'e1', status: 'completed' })
  })

  it('exibe cabeçalho "Meus Trabalhos"', () => {
    renderWithRoute('/my-jobs')
    expect(screen.getByText('Meus Trabalhos')).toBeInTheDocument()
  })

  it('exibe mensagem quando não há trabalhos', () => {
    renderWithRoute('/my-jobs')
    expect(screen.getByText('Nenhum trabalho encontrado.')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npm test -- --testPathPatterns=EmployeeJobListPage --no-coverage
```

Expected: FAIL — `setFilters` is called without `status` currently and `useSearchParams` isn't used.

- [ ] **Step 3: Update EmployeeJobListPage**

Note: `useJobStore.setFilters` accepts `Partial<{ employeeId: string; status: JobStatus }>` — confirm by checking `src/viewmodels/job.viewmodel.ts` before proceeding. The existing call `setFilters({ employeeId: id })` demonstrates partial application is supported.

Replace the content of `src/views/pages/EmployeeJobListPage.tsx`:

```tsx
import { useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useJobStore } from '@/viewmodels/job.viewmodel'
import { useAuth } from '@/viewmodels/auth.context'
import type { JobStatus } from '@/models/job.model'
import { formatDate } from '@/utils/date'

const statusLabel: Record<JobStatus, string> = {
  scheduled: 'Agendado',
  in_progress: 'Em andamento',
  completed: 'Concluído',
  cancelled: 'Cancelado',
}

const statusClass: Record<JobStatus, string> = {
  scheduled: 'badge badge-warning',
  in_progress: 'badge badge-info',
  completed: 'badge badge-success',
  cancelled: 'badge badge-error badge-outline',
}

export function EmployeeJobListPage() {
  const { user } = useAuth()
  const { load, filtered, loading, error, setFilters } = useJobStore()
  const [searchParams] = useSearchParams()
  const statusParam = searchParams.get('status') as JobStatus | null

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    const id = user?.employeeId ?? user?.id
    if (!id) return
    setFilters(statusParam ? { employeeId: id, status: statusParam } : { employeeId: id })
  }, [user?.employeeId, user?.id, statusParam, setFilters])

  const jobs = filtered()

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Meus Trabalhos</h1>

      {loading && <div className="flex justify-center py-12"><span className="loading loading-spinner loading-lg" /></div>}
      {error && <div className="alert alert-error mb-4">{error}</div>}

      {!loading && jobs.length === 0 && (
        <div className="text-center text-base-content/50 py-16">Nenhum trabalho encontrado.</div>
      )}

      {!loading && jobs.length > 0 && (
        <div className="flex flex-col gap-3">
          {jobs.map((j) => (
            <Link
              key={j.id}
              to={`/my-jobs/${j.id}`}
              className="card bg-base-200 hover:bg-base-300 transition-colors p-4 flex-row items-center justify-between"
            >
              <div>
                <p className="font-semibold">{j.machineName ?? j.machineId}</p>
                <p className="text-sm text-base-content/60">{formatDate(j.scheduledDate)} — {j.city}/{j.state}</p>
                <p className="text-xs text-base-content/50">
                  {j.jobType === 'maintenance' ? 'Manutenção' : 'Implementação'}
                </p>
              </div>
              <span className={statusClass[j.status]}>{statusLabel[j.status]}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 4: Run tests — confirm they pass**

```bash
npm test -- --testPathPatterns=EmployeeJobListPage --no-coverage
```

Expected: all tests PASS.

- [ ] **Step 5: Run the full test suite**

```bash
npm test -- --no-coverage
```

Expected: all suites pass. If any existing test breaks due to `DayDetailPanel` prop changes (e.g., `onJobClick` removed), fix by removing the now-deleted prop from those test calls.

- [ ] **Step 6: Commit**

```bash
git add src/views/pages/EmployeeJobListPage.tsx src/__tests__/views/EmployeeJobListPage.test.tsx
git commit -m "feat(employee): filter job list by ?status query param from dashboard navigation"
```
