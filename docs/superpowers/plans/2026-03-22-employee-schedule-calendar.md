# Employee Schedule Calendar Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a monthly calendar page (`/schedule`) that lets admins view and manage employee schedules — work assignments, days off, vacations, training, and medical leave.

**Architecture:** A new `ScheduleEvent` model (separate from the existing `Job` model) stores non-job events. A Zustand viewmodel fetches both Jobs and ScheduleEvents, merges them into a `CalendarEntry[]`, expands multi-day events across their date range (clipped to the current month), and groups them by date. The calendar renders this `Map<string, CalendarEntry[]>` in a monthly grid; clicking a day shows a read-only detail panel. A separate form page handles event creation. The backend does not exist yet — a mock service with deterministic seed data is used.

**Tech Stack:** React 19, TypeScript, Zustand, Zod, React Router DOM v7, Tailwind CSS v4 + DaisyUI, Jest + Testing Library

**Spec:** `docs/superpowers/specs/2026-03-22-employee-schedule-calendar-design.md`

---

## File Map

### New files

| File | Responsibility |
|------|---------------|
| `src/models/schedule-event.model.ts` | `ScheduleEvent` interface, `ScheduleEventType`, `CalendarEntry` union, Zod schemas |
| `src/services/schedule-event.service.ts` | Mock CRUD: `fetchScheduleEvents`, `fetchScheduleEvent`, `createScheduleEvent` with seed data |
| `src/viewmodels/schedule.viewmodel.ts` | Zustand store: load, create, merge with Jobs, expand multi-day, filter, group by date |
| `src/views/components/CalendarLegend.tsx` | Horizontal row of color chips, one per event type |
| `src/views/components/EventChip.tsx` | Single colored pill displaying a CalendarEntry label |
| `src/views/components/DayCell.tsx` | One cell in the calendar grid; renders EventChips, highlights today |
| `src/views/components/CalendarGrid.tsx` | Full monthly 7-column grid, handles blank leading/trailing cells |
| `src/views/components/DayDetailPanel.tsx` | Read-only panel showing entries for the selected date |
| `src/views/components/CalendarToolbar.tsx` | Month navigation, employee filter select, "+ Novo Evento" button |
| `src/views/pages/SchedulePage.tsx` | Composes all calendar components; owns `currentMonth`, `selectedDate`, `employeeFilter` state |
| `src/views/pages/ScheduleEventFormPage.tsx` | Create form for ScheduleEvent (type, employees, dates, notes) |
| `src/views/pages/ScheduleEventDetailPage.tsx` | Read-only detail view for a single ScheduleEvent |

### Files to modify

| File | Change |
|------|--------|
| `src/App.tsx` | Add 3 routes: `/schedule`, `/schedule/new`, `/schedule/:id` inside RoleGuard admin/manager |
| `src/models/navigation.model.ts` | Add `{ label: 'Agenda', path: '/schedule', icon: 'calendar', allowedRoles: ['admin', 'manager'] }` |
| `src/views/components/Sidebar.tsx` | Add `calendar: Calendar` to `ICON_MAP` (import `Calendar` from lucide-react) |

### New test files

| File | Tests |
|------|-------|
| `src/__tests__/models/schedule-event.model.test.ts` | Zod schema: valid payloads, missing fields, endDate < startDate |
| `src/__tests__/viewmodels/schedule.viewmodel.test.ts` | merge, expand multi-day, cross-month clipping, employee filter (ANY match), groupByDate |
| `src/__tests__/views/SchedulePage.test.tsx` | Renders toolbar + grid, day click updates panel, employee filter |
| `src/__tests__/views/ScheduleEventFormPage.test.tsx` | Field validation, multi-employee select, submit redirects |
| `src/__tests__/views/ScheduleEventDetailPage.test.tsx` | Renders event fields, omits endDate when equal to startDate |

---

## Task 1: ScheduleEvent Model

**Files:**
- Create: `src/models/schedule-event.model.ts`
- Create: `src/__tests__/models/schedule-event.model.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// src/__tests__/models/schedule-event.model.test.ts
import { scheduleEventSchema } from '@/models/schedule-event.model'

const valid = {
  type: 'day_off' as const,
  employeeIds: ['emp-1'],
  startDate: '2026-04-06',
  endDate: '2026-04-06',
}

describe('scheduleEventSchema', () => {
  it('aceita payload válido de dia único', () => {
    expect(scheduleEventSchema.safeParse(valid).success).toBe(true)
  })

  it('aceita payload multi-dia válido', () => {
    expect(
      scheduleEventSchema.safeParse({ ...valid, type: 'vacation', startDate: '2026-04-10', endDate: '2026-04-14' }).success
    ).toBe(true)
  })

  it('aceita multi-funcionários', () => {
    expect(
      scheduleEventSchema.safeParse({ ...valid, type: 'training', employeeIds: ['emp-1', 'emp-2'] }).success
    ).toBe(true)
  })

  it('rejeita type inválido', () => {
    expect(scheduleEventSchema.safeParse({ ...valid, type: 'invalid' }).success).toBe(false)
  })

  it('rejeita employeeIds vazio', () => {
    expect(scheduleEventSchema.safeParse({ ...valid, employeeIds: [] }).success).toBe(false)
  })

  it('rejeita startDate ausente', () => {
    expect(scheduleEventSchema.safeParse({ ...valid, startDate: '' }).success).toBe(false)
  })

  it('rejeita endDate ausente', () => {
    expect(scheduleEventSchema.safeParse({ ...valid, endDate: '' }).success).toBe(false)
  })

  it('rejeita endDate anterior a startDate', () => {
    expect(
      scheduleEventSchema.safeParse({ ...valid, startDate: '2026-04-10', endDate: '2026-04-05' }).success
    ).toBe(false)
  })

  it('aceita notes opcionais', () => {
    expect(scheduleEventSchema.safeParse({ ...valid, notes: 'Observação' }).success).toBe(true)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx jest src/__tests__/models/schedule-event.model.test.ts --no-coverage
```

Expected: FAIL — `Cannot find module '@/models/schedule-event.model'`

- [ ] **Step 3: Implement the model**

```typescript
// src/models/schedule-event.model.ts
import { z } from 'zod'
import type { Job } from '@/models/job.model'

export type ScheduleEventType = 'day_off' | 'vacation' | 'training' | 'medical_leave'

export interface ScheduleEvent {
  id: string
  type: ScheduleEventType
  employeeIds: string[]
  employeeNames: string[]
  startDate: string   // YYYY-MM-DD
  endDate: string     // YYYY-MM-DD; equals startDate for single-day events
  notes?: string
  createdAt: string
  updatedAt: string
}

export const scheduleEventSchema = z
  .object({
    type: z.enum(['day_off', 'vacation', 'training', 'medical_leave']),
    employeeIds: z.array(z.string().min(1)).min(1, 'Selecione ao menos um funcionário'),
    startDate: z.string().min(1, 'Data de início é obrigatória'),
    endDate: z.string().min(1, 'Data de término é obrigatória'),
    notes: z.string().optional(),
  })
  .refine((data) => data.endDate >= data.startDate, {
    message: 'Data de término deve ser igual ou posterior à data de início',
    path: ['endDate'],
  })

export type ScheduleEventFormData = z.infer<typeof scheduleEventSchema>

export type CalendarEntry =
  | { kind: 'job'; data: Job }
  | { kind: 'event'; data: ScheduleEvent }
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx jest src/__tests__/models/schedule-event.model.test.ts --no-coverage
```

Expected: 9 tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/models/schedule-event.model.ts src/__tests__/models/schedule-event.model.test.ts
git commit -m "feat(schedule): add ScheduleEvent model and Zod schema"
```

---

## Task 2: ScheduleEvent Mock Service

**Files:**
- Create: `src/services/schedule-event.service.ts`
- Add mock: `src/__tests__/__mocks__/schedule-event.service.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// src/__tests__/services/schedule-event.service.test.ts
// Tests the REAL service (no mocks) to verify seed data and mock CRUD behavior
import { fetchScheduleEvents, fetchScheduleEvent, createScheduleEvent } from '@/services/schedule-event.service'

describe('schedule-event.service (mock)', () => {
  it('fetchScheduleEvents retorna 3 eventos seed', async () => {
    const events = await fetchScheduleEvents()
    expect(events).toHaveLength(3)
  })

  it('fetchScheduleEvent retorna evento por id', async () => {
    const event = await fetchScheduleEvent('evt-1')
    expect(event.id).toBe('evt-1')
    expect(event.type).toBe('training')
  })

  it('fetchScheduleEvent lança erro para id inexistente', async () => {
    await expect(fetchScheduleEvent('not-found')).rejects.toThrow()
  })

  it('createScheduleEvent adiciona evento e retorna com id', async () => {
    const events = await fetchScheduleEvents()
    const before = events.length
    const created = await createScheduleEvent({
      type: 'day_off',
      employeeIds: ['emp-1'],
      startDate: '2026-05-01',
      endDate: '2026-05-01',
    })
    expect(created.id).toBeDefined()
    expect(created.type).toBe('day_off')
    const after = await fetchScheduleEvents()
    expect(after).toHaveLength(before + 1)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx jest src/__tests__/services/schedule-event.service.test.ts --no-coverage
```

Expected: FAIL — `Cannot find module '@/services/schedule-event.service'`

- [ ] **Step 3: Implement the service**

```typescript
// src/services/schedule-event.service.ts
import type { ScheduleEvent, ScheduleEventFormData } from '@/models/schedule-event.model'

const NOW = new Date().toISOString()

let MOCK_EVENTS: ScheduleEvent[] = [
  {
    id: 'evt-1',
    type: 'training',
    employeeIds: ['emp-1', 'emp-2'],
    employeeNames: ['João Silva', 'Ana Souza'],
    startDate: '2026-04-02',
    endDate: '2026-04-03',
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: 'evt-2',
    type: 'day_off',
    employeeIds: ['emp-3'],
    employeeNames: ['Carlos Lima'],
    startDate: '2026-04-06',
    endDate: '2026-04-06',
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: 'evt-3',
    type: 'vacation',
    employeeIds: ['emp-2'],
    employeeNames: ['Ana Souza'],
    startDate: '2026-04-10',
    endDate: '2026-04-14',
    createdAt: NOW,
    updatedAt: NOW,
  },
]

let nextId = 4

export async function fetchScheduleEvents(): Promise<ScheduleEvent[]> {
  return [...MOCK_EVENTS]
}

export async function fetchScheduleEvent(id: string): Promise<ScheduleEvent> {
  const event = MOCK_EVENTS.find((e) => e.id === id)
  if (!event) throw new Error(`ScheduleEvent not found: ${id}`)
  return { ...event }
}

export async function createScheduleEvent(
  data: ScheduleEventFormData & { employeeNames?: string[] }
): Promise<ScheduleEvent> {
  const event: ScheduleEvent = {
    id: `evt-${nextId++}`,
    type: data.type,
    employeeIds: data.employeeIds,
    employeeNames: data.employeeNames ?? [],
    startDate: data.startDate,
    endDate: data.endDate,
    notes: data.notes,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
  MOCK_EVENTS = [...MOCK_EVENTS, event]
  return { ...event }
}
```

- [ ] **Step 4: Create the `__mocks__` file** (so viewmodel tests can mock the service)

```typescript
// src/__tests__/__mocks__/schedule-event.service.ts
export const fetchScheduleEvents = jest.fn()
export const fetchScheduleEvent = jest.fn()
export const createScheduleEvent = jest.fn()
```

- [ ] **Step 5: Run tests to verify they pass**

```bash
npx jest src/__tests__/services/schedule-event.service.test.ts --no-coverage
```

Expected: 4 tests PASS

- [ ] **Step 6: Commit**

```bash
git add src/services/schedule-event.service.ts src/__tests__/services/schedule-event.service.test.ts src/__tests__/__mocks__/schedule-event.service.ts
git commit -m "feat(schedule): add ScheduleEvent mock service with seed data"
```

---

## Task 3: Schedule Viewmodel

**Files:**
- Create: `src/viewmodels/schedule.viewmodel.ts`
- Extend: `src/__tests__/viewmodels/schedule.viewmodel.test.ts`

The viewmodel is a Zustand store that:
1. Loads Jobs and ScheduleEvents in parallel
2. Merges them into `CalendarEntry[]`
3. Filters by employeeId (ANY match for multi-employee events)
4. Expands multi-day events to cover each date in their range, clipped to `currentMonth`
5. Groups by date into `Map<string, CalendarEntry[]>`

- [ ] **Step 1: Write the failing viewmodel tests** (append to existing test file, clear previous service tests into a `describe` block)

```typescript
// src/__tests__/viewmodels/schedule.viewmodel.test.ts
// Replace entire file with this:
import { useScheduleStore } from '@/viewmodels/schedule.viewmodel'
import type { Job } from '@/models/job.model'
import type { ScheduleEvent } from '@/models/schedule-event.model'

jest.mock('@/services/job.service', () => ({ fetchJobs: jest.fn() }))
jest.mock('@/services/schedule-event.service', () => ({
  fetchScheduleEvents: jest.fn(),
  fetchScheduleEvent: jest.fn(),
  createScheduleEvent: jest.fn(),
}))

import * as jobService from '@/services/job.service'
import * as eventService from '@/services/schedule-event.service'

const makeJob = (overrides: Partial<Job> = {}): Job => ({
  id: 'job-1',
  employeeId: 'emp-1',
  employeeName: 'João Silva',
  machineId: 'mach-1',
  machineName: 'Máquina X',
  jobType: 'maintenance',
  status: 'scheduled',
  description: 'Revisão',
  scheduledDate: '2026-04-01',
  city: 'SP',
  state: 'SP',
  accommodation: false,
  car: false,
  startTime: '08:00',
  endTime: '17:00',
  createdAt: '2026-01-01',
  updatedAt: '2026-01-01',
  ...overrides,
})

const makeEvent = (overrides: Partial<ScheduleEvent> = {}): ScheduleEvent => ({
  id: 'evt-1',
  type: 'day_off',
  employeeIds: ['emp-2'],
  employeeNames: ['Ana Souza'],
  startDate: '2026-04-06',
  endDate: '2026-04-06',
  createdAt: '2026-01-01',
  updatedAt: '2026-01-01',
  ...overrides,
})

beforeEach(() => {
  useScheduleStore.setState({
    jobs: [],
    events: [],
    loading: false,
    error: null,
    currentMonth: { year: 2026, month: 4 },
    employeeFilter: null,
  })
  jest.clearAllMocks()
})

describe('useScheduleStore — load', () => {
  it('carrega jobs e events em paralelo', async () => {
    const job = makeJob()
    const event = makeEvent()
    ;(jobService.fetchJobs as jest.Mock).mockResolvedValue([job])
    ;(eventService.fetchScheduleEvents as jest.Mock).mockResolvedValue([event])

    await useScheduleStore.getState().load()

    expect(useScheduleStore.getState().jobs).toHaveLength(1)
    expect(useScheduleStore.getState().events).toHaveLength(1)
    expect(useScheduleStore.getState().loading).toBe(false)
  })

  it('define error ao falhar', async () => {
    ;(jobService.fetchJobs as jest.Mock).mockRejectedValue(new Error('Network error'))
    ;(eventService.fetchScheduleEvents as jest.Mock).mockResolvedValue([])

    await useScheduleStore.getState().load()

    expect(useScheduleStore.getState().error).toBeTruthy()
  })
})

describe('useScheduleStore — groupedByDate', () => {
  it('agrupa job e event na data correta', () => {
    const job = makeJob({ scheduledDate: '2026-04-01' })
    const event = makeEvent({ startDate: '2026-04-06', endDate: '2026-04-06' })
    useScheduleStore.setState({ jobs: [job], events: [event], currentMonth: { year: 2026, month: 4 } })

    const grouped = useScheduleStore.getState().groupedByDate()

    expect(grouped.get('2026-04-01')).toHaveLength(1)
    expect(grouped.get('2026-04-01')![0].kind).toBe('job')
    expect(grouped.get('2026-04-06')).toHaveLength(1)
    expect(grouped.get('2026-04-06')![0].kind).toBe('event')
  })

  it('expande evento multi-dia em cada data do intervalo', () => {
    const event = makeEvent({ startDate: '2026-04-10', endDate: '2026-04-12' })
    useScheduleStore.setState({ events: [event], jobs: [], currentMonth: { year: 2026, month: 4 } })

    const grouped = useScheduleStore.getState().groupedByDate()

    expect(grouped.get('2026-04-10')).toHaveLength(1)
    expect(grouped.get('2026-04-11')).toHaveLength(1)
    expect(grouped.get('2026-04-12')).toHaveLength(1)
    expect(grouped.get('2026-04-13')).toBeUndefined()
  })

  it('recorta evento multi-dia na borda do mês (não vaza para mês seguinte)', () => {
    const event = makeEvent({ startDate: '2026-04-28', endDate: '2026-05-03' })
    useScheduleStore.setState({ events: [event], jobs: [], currentMonth: { year: 2026, month: 4 } })

    const grouped = useScheduleStore.getState().groupedByDate()

    expect(grouped.get('2026-04-28')).toHaveLength(1)
    expect(grouped.get('2026-04-30')).toHaveLength(1)
    expect(grouped.get('2026-05-01')).toBeUndefined()
  })

  it('não inclui jobs de outro mês', () => {
    const job = makeJob({ scheduledDate: '2026-03-15' })
    useScheduleStore.setState({ jobs: [job], events: [], currentMonth: { year: 2026, month: 4 } })

    const grouped = useScheduleStore.getState().groupedByDate()

    expect(grouped.size).toBe(0)
  })
})

describe('useScheduleStore — filtro de funcionário', () => {
  it('filtra job pelo employeeId exato', () => {
    const job1 = makeJob({ id: 'j1', employeeId: 'emp-1', scheduledDate: '2026-04-01' })
    const job2 = makeJob({ id: 'j2', employeeId: 'emp-2', scheduledDate: '2026-04-01' })
    useScheduleStore.setState({ jobs: [job1, job2], events: [], currentMonth: { year: 2026, month: 4 }, employeeFilter: 'emp-1' })

    const grouped = useScheduleStore.getState().groupedByDate()
    const entries = grouped.get('2026-04-01')!

    expect(entries).toHaveLength(1)
    expect((entries[0].data as Job).employeeId).toBe('emp-1')
  })

  it('inclui evento multi-funcionário se filtro corresponde a qualquer participante', () => {
    const event = makeEvent({
      employeeIds: ['emp-1', 'emp-2'],
      startDate: '2026-04-02',
      endDate: '2026-04-02',
    })
    useScheduleStore.setState({ events: [event], jobs: [], currentMonth: { year: 2026, month: 4 }, employeeFilter: 'emp-2' })

    const grouped = useScheduleStore.getState().groupedByDate()

    expect(grouped.get('2026-04-02')).toHaveLength(1)
  })

  it('exclui evento se filtro não corresponde a nenhum participante', () => {
    const event = makeEvent({ employeeIds: ['emp-3'], startDate: '2026-04-02', endDate: '2026-04-02' })
    useScheduleStore.setState({ events: [event], jobs: [], currentMonth: { year: 2026, month: 4 }, employeeFilter: 'emp-1' })

    const grouped = useScheduleStore.getState().groupedByDate()

    expect(grouped.get('2026-04-02')).toBeUndefined()
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx jest src/__tests__/viewmodels/schedule.viewmodel.test.ts --no-coverage
```

Expected: FAIL — `Cannot find module '@/viewmodels/schedule.viewmodel'`

- [ ] **Step 3: Implement the viewmodel**

```typescript
// src/viewmodels/schedule.viewmodel.ts
import { create } from 'zustand'
import type { Job } from '@/models/job.model'
import type { CalendarEntry, ScheduleEvent, ScheduleEventFormData } from '@/models/schedule-event.model'
import { fetchJobs } from '@/services/job.service'
import {
  fetchScheduleEvents,
  fetchScheduleEvent,
  createScheduleEvent,
} from '@/services/schedule-event.service'

interface CurrentMonth {
  year: number
  month: number // 1-12
}

interface ScheduleState {
  jobs: Job[]
  events: ScheduleEvent[]
  loading: boolean
  error: string | null
  currentMonth: CurrentMonth
  employeeFilter: string | null

  load: () => Promise<void>
  create: (data: ScheduleEventFormData & { employeeNames: string[] }) => Promise<ScheduleEvent>
  getById: (id: string) => Promise<ScheduleEvent>
  setCurrentMonth: (month: CurrentMonth) => void
  setEmployeeFilter: (id: string | null) => void
  groupedByDate: () => Map<string, CalendarEntry[]>
}

function datesInMonth(year: number, month: number): string[] {
  const days: string[] = []
  const daysInMonth = new Date(year, month, 0).getDate()
  for (let d = 1; d <= daysInMonth; d++) {
    const mm = String(month).padStart(2, '0')
    const dd = String(d).padStart(2, '0')
    days.push(`${year}-${mm}-${dd}`)
  }
  return days
}

export const useScheduleStore = create<ScheduleState>((set, get) => ({
  jobs: [],
  events: [],
  loading: false,
  error: null,
  currentMonth: {
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
  },
  employeeFilter: null,

  load: async () => {
    set({ loading: true, error: null })
    try {
      const [jobs, events] = await Promise.all([fetchJobs(), fetchScheduleEvents()])
      set({ jobs, events, loading: false })
    } catch (err) {
      set({ error: (err as Error).message, loading: false })
    }
  },

  create: async (data) => {
    const event = await createScheduleEvent(data)
    set((s) => ({ events: [...s.events, event] }))
    return event
  },

  getById: async (id) => {
    return fetchScheduleEvent(id)
  },

  setCurrentMonth: (currentMonth) => set({ currentMonth }),
  setEmployeeFilter: (employeeFilter) => set({ employeeFilter }),

  groupedByDate: () => {
    const { jobs, events, currentMonth, employeeFilter } = get()
    const { year, month } = currentMonth
    const monthDates = new Set(datesInMonth(year, month))
    const map = new Map<string, CalendarEntry[]>()

    const addEntry = (date: string, entry: CalendarEntry) => {
      if (!monthDates.has(date)) return
      const list = map.get(date) ?? []
      list.push(entry)
      map.set(date, list)
    }

    // Jobs
    for (const job of jobs) {
      if (employeeFilter && job.employeeId !== employeeFilter) continue
      addEntry(job.scheduledDate, { kind: 'job', data: job })
    }

    // ScheduleEvents (expand multi-day, clip to month)
    for (const event of events) {
      if (employeeFilter && !event.employeeIds.includes(employeeFilter)) continue
      const start = event.startDate
      const end = event.endDate
      // iterate each date in [start, end] that falls in the current month
      const dates = Array.from(monthDates).filter((d) => d >= start && d <= end)
      for (const date of dates) {
        addEntry(date, { kind: 'event', data: event })
      }
    }

    return map
  },
}))
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx jest src/__tests__/viewmodels/schedule.viewmodel.test.ts --no-coverage
```

Expected: all tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/viewmodels/schedule.viewmodel.ts src/__tests__/viewmodels/schedule.viewmodel.test.ts
git commit -m "feat(schedule): add schedule viewmodel with merge, expand, filter, and group logic"
```

---

## Task 4: CalendarLegend Component

**Files:**
- Create: `src/views/components/CalendarLegend.tsx`

This is a pure presentational component — no props, no state. Renders a legend row showing a colored chip for each event type.

- [ ] **Step 1: Write the test**

```typescript
// src/__tests__/views/CalendarLegend.test.tsx
import { render, screen } from '@testing-library/react'
import { CalendarLegend } from '@/views/components/CalendarLegend'

it('exibe todos os 5 tipos de evento', () => {
  render(<CalendarLegend />)
  expect(screen.getByText(/trabalho/i)).toBeInTheDocument()
  expect(screen.getByText(/folga/i)).toBeInTheDocument()
  expect(screen.getByText(/férias/i)).toBeInTheDocument()
  expect(screen.getByText(/treinamento/i)).toBeInTheDocument()
  expect(screen.getByText(/afastamento/i)).toBeInTheDocument()
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx jest src/__tests__/views/CalendarLegend.test.tsx --no-coverage
```

- [ ] **Step 3: Implement**

```typescript
// src/views/components/CalendarLegend.tsx
const LEGEND = [
  { label: 'Trabalho', color: 'bg-blue-500' },
  { label: 'Folga', color: 'bg-red-400' },
  { label: 'Férias', color: 'bg-orange-400' },
  { label: 'Treinamento', color: 'bg-violet-400' },
  { label: 'Afastamento', color: 'bg-slate-400' },
] as const

export function CalendarLegend() {
  return (
    <div className="flex flex-wrap gap-4 px-4 py-2 border-b border-base-300 text-xs">
      {LEGEND.map(({ label, color }) => (
        <span key={label} className="flex items-center gap-1.5">
          <span className={`w-2.5 h-2.5 rounded-sm ${color}`} />
          {label}
        </span>
      ))}
    </div>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx jest src/__tests__/views/CalendarLegend.test.tsx --no-coverage
```

- [ ] **Step 5: Commit**

```bash
git add src/views/components/CalendarLegend.tsx src/__tests__/views/CalendarLegend.test.tsx
git commit -m "feat(schedule): add CalendarLegend component"
```

---

## Task 5: EventChip Component

**Files:**
- Create: `src/views/components/EventChip.tsx`

Renders a small colored pill for a `CalendarEntry`. Jobs show the employee name + job type. ScheduleEvents show the event type label.

- [ ] **Step 1: Write the test**

```typescript
// src/__tests__/views/EventChip.test.tsx
import { render, screen } from '@testing-library/react'
import { EventChip } from '@/views/components/EventChip'
import type { CalendarEntry } from '@/models/schedule-event.model'

const jobEntry: CalendarEntry = {
  kind: 'job',
  data: {
    id: 'j1', employeeId: 'e1', employeeName: 'João', machineId: 'm1', machineName: 'M',
    jobType: 'maintenance', status: 'scheduled', description: 'D', scheduledDate: '2026-04-01',
    city: 'SP', state: 'SP', accommodation: false, car: false,
    startTime: '08:00', endTime: '17:00', createdAt: '', updatedAt: '',
  },
}

const eventEntry: CalendarEntry = {
  kind: 'event',
  data: {
    id: 'evt-1', type: 'day_off', employeeIds: ['e1'], employeeNames: ['João'],
    startDate: '2026-04-06', endDate: '2026-04-06', createdAt: '', updatedAt: '',
  },
}

it('exibe nome do funcionário para um job', () => {
  render(<EventChip entry={jobEntry} />)
  expect(screen.getByText(/joão/i)).toBeInTheDocument()
})

it('exibe label de folga para event do tipo day_off', () => {
  render(<EventChip entry={eventEntry} />)
  expect(screen.getByText(/folga/i)).toBeInTheDocument()
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx jest src/__tests__/views/EventChip.test.tsx --no-coverage
```

- [ ] **Step 3: Implement**

```typescript
// src/views/components/EventChip.tsx
import type { CalendarEntry } from '@/models/schedule-event.model'

const EVENT_LABELS: Record<string, string> = {
  day_off: 'Folga',
  vacation: 'Férias',
  training: 'Treinamento',
  medical_leave: 'Afastamento',
}

const EVENT_COLORS: Record<string, string> = {
  job: 'bg-blue-500 text-white',
  day_off: 'bg-red-400 text-white',
  vacation: 'bg-orange-400 text-white',
  training: 'bg-violet-400 text-white',
  medical_leave: 'bg-slate-400 text-slate-900',
}

interface EventChipProps {
  entry: CalendarEntry
}

export function EventChip({ entry }: EventChipProps) {
  const colorKey = entry.kind === 'job' ? 'job' : entry.data.type
  const color = EVENT_COLORS[colorKey]
  const label =
    entry.kind === 'job'
      ? `${entry.data.employeeName}`
      : EVENT_LABELS[entry.data.type] ?? entry.data.type

  return (
    <span
      className={`block truncate rounded px-1 py-0.5 text-[9px] font-medium leading-tight ${color}`}
    >
      {label}
    </span>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx jest src/__tests__/views/EventChip.test.tsx --no-coverage
```

- [ ] **Step 5: Commit**

```bash
git add src/views/components/EventChip.tsx src/__tests__/views/EventChip.test.tsx
git commit -m "feat(schedule): add EventChip component"
```

---

## Task 6: DayCell Component

**Files:**
- Create: `src/views/components/DayCell.tsx`

Renders one cell in the calendar grid. Shows the day number and up to 3 EventChips (remaining count as "+N more"). Highlights today. Calls `onSelect` when clicked.

- [ ] **Step 1: Write the test**

```typescript
// src/__tests__/views/DayCell.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { DayCell } from '@/views/components/DayCell'
import type { CalendarEntry } from '@/models/schedule-event.model'

const makeEventEntry = (id: string): CalendarEntry => ({
  kind: 'event',
  data: {
    id, type: 'day_off', employeeIds: ['e1'], employeeNames: ['Ana'],
    startDate: '2026-04-06', endDate: '2026-04-06', createdAt: '', updatedAt: '',
  },
})

it('exibe o número do dia', () => {
  render(<DayCell date="2026-04-15" entries={[]} isToday={false} isSelected={false} onSelect={jest.fn()} />)
  expect(screen.getByText('15')).toBeInTheDocument()
})

it('chama onSelect ao clicar', () => {
  const onSelect = jest.fn()
  render(<DayCell date="2026-04-15" entries={[]} isToday={false} isSelected={false} onSelect={onSelect} />)
  fireEvent.click(screen.getByText('15'))
  expect(onSelect).toHaveBeenCalledWith('2026-04-15')
})

it('exibe até 3 chips e mostra +N para o restante', () => {
  const entries = [makeEventEntry('1'), makeEventEntry('2'), makeEventEntry('3'), makeEventEntry('4')]
  render(<DayCell date="2026-04-06" entries={entries} isToday={false} isSelected={false} onSelect={jest.fn()} />)
  expect(screen.getByText('+1')).toBeInTheDocument()
})

it('adiciona data-testid "today" quando isToday=true', () => {
  render(<DayCell date="2026-04-06" entries={[]} isToday={true} isSelected={false} onSelect={jest.fn()} />)
  expect(screen.getByTestId('day-today')).toBeInTheDocument()
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx jest src/__tests__/views/DayCell.test.tsx --no-coverage
```

- [ ] **Step 3: Implement**

```typescript
// src/views/components/DayCell.tsx
import type { CalendarEntry } from '@/models/schedule-event.model'
import { EventChip } from '@/views/components/EventChip'

interface DayCellProps {
  date: string
  entries: CalendarEntry[]
  isToday: boolean
  isSelected: boolean
  onSelect: (date: string) => void
}

export function DayCell({ date, entries, isToday, isSelected, onSelect }: DayCellProps) {
  const day = Number(date.split('-')[2])
  const visible = entries.slice(0, 3)
  const overflow = entries.length - visible.length

  return (
    <div
      onClick={() => onSelect(date)}
      className={`min-h-[70px] rounded-lg p-1 cursor-pointer transition-colors
        ${isToday ? 'border border-primary bg-primary/5' : 'bg-base-200 hover:bg-base-300'}
        ${isSelected ? 'ring-1 ring-primary' : ''}
      `}
      data-testid={isToday ? 'day-today' : undefined}
    >
      <div className={`text-[11px] mb-1 font-medium ${isToday ? 'text-primary' : 'text-base-content/50'}`}>
        {day}
      </div>
      <div className="flex flex-col gap-0.5">
        {visible.map((entry, i) => (
          <EventChip key={i} entry={entry} />
        ))}
        {overflow > 0 && (
          <span className="text-[9px] text-base-content/40 pl-1">+{overflow}</span>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx jest src/__tests__/views/DayCell.test.tsx --no-coverage
```

- [ ] **Step 5: Commit**

```bash
git add src/views/components/DayCell.tsx src/__tests__/views/DayCell.test.tsx
git commit -m "feat(schedule): add DayCell component"
```

---

## Task 7: CalendarGrid Component

**Files:**
- Create: `src/views/components/CalendarGrid.tsx`

Renders the full monthly 7-column grid. Computes blank leading cells (days before the 1st), then renders a `DayCell` per day. Receives the grouped map and passes relevant entries to each cell.

- [ ] **Step 1: Write the test**

```typescript
// src/__tests__/views/CalendarGrid.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { CalendarGrid } from '@/views/components/CalendarGrid'
import type { CalendarEntry } from '@/models/schedule-event.model'

const emptyMap = new Map<string, CalendarEntry[]>()

it('renderiza 30 células para abril 2026', () => {
  render(
    <CalendarGrid
      year={2026} month={4}
      grouped={emptyMap}
      selectedDate={null}
      today="2026-04-22"
      onSelect={jest.fn()}
    />
  )
  // April has 30 days
  expect(screen.getByText('1')).toBeInTheDocument()
  expect(screen.getByText('30')).toBeInTheDocument()
})

it('chama onSelect com a data correta ao clicar no dia 15', () => {
  const onSelect = jest.fn()
  render(
    <CalendarGrid
      year={2026} month={4}
      grouped={emptyMap}
      selectedDate={null}
      today="2026-04-22"
      onSelect={onSelect}
    />
  )
  fireEvent.click(screen.getByText('15'))
  expect(onSelect).toHaveBeenCalledWith('2026-04-15')
})

it('marca o dia de hoje com data-testid "day-today"', () => {
  render(
    <CalendarGrid
      year={2026} month={4}
      grouped={emptyMap}
      selectedDate={null}
      today="2026-04-22"
      onSelect={jest.fn()}
    />
  )
  expect(screen.getByTestId('day-today')).toBeInTheDocument()
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx jest src/__tests__/views/CalendarGrid.test.tsx --no-coverage
```

- [ ] **Step 3: Implement**

```typescript
// src/views/components/CalendarGrid.tsx
import type { CalendarEntry } from '@/models/schedule-event.model'
import { DayCell } from '@/views/components/DayCell'

interface CalendarGridProps {
  year: number
  month: number  // 1-12
  grouped: Map<string, CalendarEntry[]>
  selectedDate: string | null
  today: string  // YYYY-MM-DD
  onSelect: (date: string) => void
}

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

export function CalendarGrid({ year, month, grouped, selectedDate, today, onSelect }: CalendarGridProps) {
  const daysInMonth = new Date(year, month, 0).getDate()
  const firstWeekday = new Date(year, month - 1, 1).getDay() // 0=Sun

  const mm = String(month).padStart(2, '0')
  const days = Array.from({ length: daysInMonth }, (_, i) => {
    const dd = String(i + 1).padStart(2, '0')
    return `${year}-${mm}-${dd}`
  })

  return (
    <div className="p-3">
      {/* Header row */}
      <div className="grid grid-cols-7 gap-1 mb-1 text-center text-[11px] font-semibold text-base-content/40">
        {WEEKDAYS.map((d) => <span key={d}>{d}</span>)}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7 gap-1">
        {/* Blank leading cells */}
        {Array.from({ length: firstWeekday }).map((_, i) => (
          <div key={`blank-${i}`} className="min-h-[70px] rounded-lg bg-base-200 opacity-20" />
        ))}

        {/* Day cells */}
        {days.map((date) => (
          <DayCell
            key={date}
            date={date}
            entries={grouped.get(date) ?? []}
            isToday={date === today}
            isSelected={date === selectedDate}
            onSelect={onSelect}
          />
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx jest src/__tests__/views/CalendarGrid.test.tsx --no-coverage
```

- [ ] **Step 5: Commit**

```bash
git add src/views/components/CalendarGrid.tsx src/__tests__/views/CalendarGrid.test.tsx
git commit -m "feat(schedule): add CalendarGrid component"
```

---

## Task 8: DayDetailPanel Component

**Files:**
- Create: `src/views/components/DayDetailPanel.tsx`

Read-only panel showing all entries for the selected date. Each row links to the entry's detail page (`/schedule/:id` for events, `/jobs/:id` for jobs). If no date selected, shows a prompt.

- [ ] **Step 1: Write the test**

```typescript
// src/__tests__/views/DayDetailPanel.test.tsx
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { DayDetailPanel } from '@/views/components/DayDetailPanel'
import type { CalendarEntry } from '@/models/schedule-event.model'

const entries: CalendarEntry[] = [
  {
    kind: 'event',
    data: {
      id: 'evt-1', type: 'training', employeeIds: ['e1', 'e2'],
      employeeNames: ['João', 'Ana'], startDate: '2026-04-02', endDate: '2026-04-03',
      createdAt: '', updatedAt: '',
    },
  },
]

it('mostra mensagem quando nenhuma data está selecionada', () => {
  render(
    <MemoryRouter><DayDetailPanel selectedDate={null} entries={[]} /></MemoryRouter>
  )
  expect(screen.getByText(/clique em um dia/i)).toBeInTheDocument()
})

it('exibe a data selecionada formatada', () => {
  render(
    <MemoryRouter><DayDetailPanel selectedDate="2026-04-02" entries={entries} /></MemoryRouter>
  )
  expect(screen.getByText(/02 de abril/i)).toBeInTheDocument()
})

it('exibe nome do treinamento', () => {
  render(
    <MemoryRouter><DayDetailPanel selectedDate="2026-04-02" entries={entries} /></MemoryRouter>
  )
  expect(screen.getByText(/treinamento/i)).toBeInTheDocument()
})

it('exibe funcionários do evento', () => {
  render(
    <MemoryRouter><DayDetailPanel selectedDate="2026-04-02" entries={entries} /></MemoryRouter>
  )
  expect(screen.getByText(/joão, ana/i)).toBeInTheDocument()
})

it('exibe mensagem de lista vazia quando não há eventos', () => {
  render(
    <MemoryRouter><DayDetailPanel selectedDate="2026-04-05" entries={[]} /></MemoryRouter>
  )
  expect(screen.getByText(/nenhum evento/i)).toBeInTheDocument()
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx jest src/__tests__/views/DayDetailPanel.test.tsx --no-coverage
```

- [ ] **Step 3: Implement**

```typescript
// src/views/components/DayDetailPanel.tsx
import { Link } from 'react-router-dom'
import type { CalendarEntry } from '@/models/schedule-event.model'

const EVENT_LABELS: Record<string, string> = {
  day_off: 'Folga',
  vacation: 'Férias',
  training: 'Treinamento',
  medical_leave: 'Afastamento médico',
}

const EVENT_COLORS: Record<string, string> = {
  job: 'bg-blue-500',
  day_off: 'bg-red-400',
  vacation: 'bg-orange-400',
  training: 'bg-violet-400',
  medical_leave: 'bg-slate-400',
}

function formatDate(iso: string): string {
  const [, m, d] = iso.split('-')
  const months = ['','janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro']
  return `${Number(d)} de ${months[Number(m)]}`
}

interface DayDetailPanelProps {
  selectedDate: string | null
  entries: CalendarEntry[]
}

export function DayDetailPanel({ selectedDate, entries }: DayDetailPanelProps) {
  if (!selectedDate) {
    return (
      <div className="p-4 text-sm text-base-content/40">
        Clique em um dia para ver os eventos.
      </div>
    )
  }

  return (
    <div className="p-4">
      <h3 className="text-sm font-semibold text-base-content/60 mb-3 capitalize">
        {formatDate(selectedDate)}
      </h3>

      {entries.length === 0 ? (
        <p className="text-sm text-base-content/40">Nenhum evento neste dia.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {entries.map((entry, i) => {
            const colorKey = entry.kind === 'job' ? 'job' : entry.data.type
            const color = EVENT_COLORS[colorKey]

            if (entry.kind === 'job') {
              return (
                <Link
                  key={i}
                  to={`/jobs/${entry.data.id}`}
                  className="flex items-start gap-3 p-2 rounded-lg bg-base-200 hover:bg-base-300 transition-colors"
                >
                  <span className={`mt-1 w-2.5 h-2.5 rounded-sm ${color} flex-shrink-0`} />
                  <div>
                    <p className="text-sm font-medium">{entry.data.employeeName}</p>
                    <p className="text-xs text-base-content/50">{entry.data.description}</p>
                  </div>
                </Link>
              )
            }

            return (
              <Link
                key={i}
                to={`/schedule/${entry.data.id}`}
                className="flex items-start gap-3 p-2 rounded-lg bg-base-200 hover:bg-base-300 transition-colors"
              >
                <span className={`mt-1 w-2.5 h-2.5 rounded-sm ${color} flex-shrink-0`} />
                <div>
                  <p className="text-sm font-medium">{EVENT_LABELS[entry.data.type] ?? entry.data.type}</p>
                  <p className="text-xs text-base-content/50">
                    {entry.data.employeeNames.join(', ')}
                    {entry.data.startDate !== entry.data.endDate && ` · até ${formatDate(entry.data.endDate)}`}
                  </p>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx jest src/__tests__/views/DayDetailPanel.test.tsx --no-coverage
```

- [ ] **Step 5: Commit**

```bash
git add src/views/components/DayDetailPanel.tsx src/__tests__/views/DayDetailPanel.test.tsx
git commit -m "feat(schedule): add DayDetailPanel component"
```

---

## Task 9: CalendarToolbar Component

**Files:**
- Create: `src/views/components/CalendarToolbar.tsx`

Navigation (prev/next month, today), employee filter, "+ Novo Evento" button.

- [ ] **Step 1: Write the test**

```typescript
// src/__tests__/views/CalendarToolbar.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { CalendarToolbar } from '@/views/components/CalendarToolbar'

const employees = [
  { id: 'emp-1', name: 'João Silva' },
  { id: 'emp-2', name: 'Ana Souza' },
]

it('exibe o mês e ano formatados', () => {
  render(
    <MemoryRouter>
      <CalendarToolbar year={2026} month={4} employees={employees}
        employeeFilter={null} onPrev={jest.fn()} onNext={jest.fn()}
        onToday={jest.fn()} onFilterChange={jest.fn()} />
    </MemoryRouter>
  )
  expect(screen.getByText(/abril 2026/i)).toBeInTheDocument()
})

it('chama onPrev ao clicar ◀', () => {
  const onPrev = jest.fn()
  render(
    <MemoryRouter>
      <CalendarToolbar year={2026} month={4} employees={employees}
        employeeFilter={null} onPrev={onPrev} onNext={jest.fn()}
        onToday={jest.fn()} onFilterChange={jest.fn()} />
    </MemoryRouter>
  )
  fireEvent.click(screen.getByLabelText(/mês anterior/i))
  expect(onPrev).toHaveBeenCalled()
})

it('chama onNext ao clicar ▶', () => {
  const onNext = jest.fn()
  render(
    <MemoryRouter>
      <CalendarToolbar year={2026} month={4} employees={employees}
        employeeFilter={null} onPrev={jest.fn()} onNext={onNext}
        onToday={jest.fn()} onFilterChange={jest.fn()} />
    </MemoryRouter>
  )
  fireEvent.click(screen.getByLabelText(/próximo mês/i))
  expect(onNext).toHaveBeenCalled()
})

it('link "+ Novo Evento" aponta para /schedule/new', () => {
  render(
    <MemoryRouter>
      <CalendarToolbar year={2026} month={4} employees={employees}
        employeeFilter={null} onPrev={jest.fn()} onNext={jest.fn()}
        onToday={jest.fn()} onFilterChange={jest.fn()} />
    </MemoryRouter>
  )
  expect(screen.getByRole('link', { name: /novo evento/i })).toHaveAttribute('href', '/schedule/new')
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx jest src/__tests__/views/CalendarToolbar.test.tsx --no-coverage
```

- [ ] **Step 3: Implement**

```typescript
// src/views/components/CalendarToolbar.tsx
import { Link } from 'react-router-dom'

const MONTHS = ['','Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']

interface Employee { id: string; name: string }

interface CalendarToolbarProps {
  year: number
  month: number
  employees: Employee[]
  employeeFilter: string | null
  onPrev: () => void
  onNext: () => void
  onToday: () => void
  onFilterChange: (id: string | null) => void
}

export function CalendarToolbar({
  year, month, employees, employeeFilter,
  onPrev, onNext, onToday, onFilterChange,
}: CalendarToolbarProps) {
  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-base-300">
      <div className="flex items-center gap-2">
        <button aria-label="Mês anterior" onClick={onPrev} className="btn btn-ghost btn-sm px-2">◀</button>
        <span className="font-semibold text-sm min-w-[130px] text-center">
          {MONTHS[month]} {year}
        </span>
        <button aria-label="Próximo mês" onClick={onNext} className="btn btn-ghost btn-sm px-2">▶</button>
        <button onClick={onToday} className="btn btn-ghost btn-sm ml-1 text-xs">Hoje</button>
      </div>

      <div className="flex items-center gap-2">
        <select
          className="select select-bordered select-sm text-sm"
          value={employeeFilter ?? ''}
          onChange={(e) => onFilterChange(e.target.value || null)}
        >
          <option value="">Todos os funcionários</option>
          {employees.map((e) => (
            <option key={e.id} value={e.id}>{e.name}</option>
          ))}
        </select>
        <Link to="/schedule/new" className="btn btn-primary btn-sm text-xs">
          + Novo Evento
        </Link>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx jest src/__tests__/views/CalendarToolbar.test.tsx --no-coverage
```

- [ ] **Step 5: Commit**

```bash
git add src/views/components/CalendarToolbar.tsx src/__tests__/views/CalendarToolbar.test.tsx
git commit -m "feat(schedule): add CalendarToolbar component"
```

---

## Task 10: SchedulePage (Main Calendar Page)

**Files:**
- Create: `src/views/pages/SchedulePage.tsx`
- Create: `src/__tests__/views/SchedulePage.test.tsx`

Composes all calendar components. Owns `currentMonth`, `selectedDate`, and `employeeFilter` state. Calls `useScheduleStore`.

- [ ] **Step 1: Write the test**

```typescript
// src/__tests__/views/SchedulePage.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { SchedulePage } from '@/views/pages/SchedulePage'
import { useScheduleStore } from '@/viewmodels/schedule.viewmodel'

jest.mock('@/viewmodels/schedule.viewmodel')
jest.mock('@/viewmodels/employee.viewmodel', () => ({
  useEmployeeStore: jest.fn(() => ({
    employees: [{ id: 'emp-1', name: 'João' }],
    load: jest.fn(),
  })),
}))

function mockStore(overrides = {}) {
  ;(useScheduleStore as unknown as jest.Mock).mockReturnValue({
    load: jest.fn(),
    loading: false,
    error: null,
    currentMonth: { year: 2026, month: 4 },
    employeeFilter: null,
    setCurrentMonth: jest.fn(),
    setEmployeeFilter: jest.fn(),
    groupedByDate: () => new Map(),
    ...overrides,
  })
}

it('renderiza CalendarToolbar e grade do calendário', () => {
  mockStore()
  render(<MemoryRouter><SchedulePage /></MemoryRouter>)
  expect(screen.getByText(/abril 2026/i)).toBeInTheDocument()
  expect(screen.getByText('1')).toBeInTheDocument()
})

it('mostra painel de detalhes com mensagem inicial quando nenhum dia está selecionado', () => {
  mockStore()
  render(<MemoryRouter><SchedulePage /></MemoryRouter>)
  expect(screen.getByText(/clique em um dia/i)).toBeInTheDocument()
})

it('atualiza painel ao clicar em um dia', () => {
  mockStore()
  render(<MemoryRouter><SchedulePage /></MemoryRouter>)
  fireEvent.click(screen.getByText('15'))
  expect(screen.getByText(/15 de abril/i)).toBeInTheDocument()
})

it('exibe mensagem de erro quando store tem error', () => {
  mockStore({ error: 'Falha ao carregar' })
  render(<MemoryRouter><SchedulePage /></MemoryRouter>)
  expect(screen.getByText(/falha ao carregar/i)).toBeInTheDocument()
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx jest src/__tests__/views/SchedulePage.test.tsx --no-coverage
```

- [ ] **Step 3: Verify employee viewmodel export path**

The plan uses `@/viewmodels/employee.viewmodel` with a `useEmployeeStore` export that returns `{ employees, load }`. Confirm this is correct:

```bash
grep -r "export.*useEmployeeStore" src/viewmodels/
```

If the path or export name differs, update **both** the mock in the test file (Step 1) and the import in `SchedulePage.tsx` (Step 4) to match.

- [ ] **Step 4: Implement SchedulePage**

```typescript
// src/views/pages/SchedulePage.tsx
import { useState, useEffect } from 'react'
import { useScheduleStore } from '@/viewmodels/schedule.viewmodel'
import { useEmployeeStore } from '@/viewmodels/employee.viewmodel'
import { CalendarToolbar } from '@/views/components/CalendarToolbar'
import { CalendarLegend } from '@/views/components/CalendarLegend'
import { CalendarGrid } from '@/views/components/CalendarGrid'
import { DayDetailPanel } from '@/views/components/DayDetailPanel'

const TODAY = new Date().toISOString().slice(0, 10)

function prevMonth(year: number, month: number) {
  return month === 1 ? { year: year - 1, month: 12 } : { year, month: month - 1 }
}
function nextMonth(year: number, month: number) {
  return month === 12 ? { year: year + 1, month: 1 } : { year, month: month + 1 }
}

export function SchedulePage() {
  const store = useScheduleStore()
  const employeeStore = useEmployeeStore()
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  useEffect(() => {
    store.load()
    employeeStore.load()
  }, [])

  const { year, month } = store.currentMonth
  const grouped = store.groupedByDate()
  const selectedEntries = selectedDate ? (grouped.get(selectedDate) ?? []) : []

  const employees = (employeeStore.employees ?? []).map((e: { id: string; name: string }) => ({
    id: e.id,
    name: e.name,
  }))

  if (store.error) {
    return <div className="p-6 text-error">{store.error}</div>
  }

  return (
    <div className="flex flex-col gap-0">
      <div className="flex items-center justify-between px-4 pt-2">
        <h1 className="text-lg font-bold">Agenda de Funcionários</h1>
      </div>

      <CalendarToolbar
        year={year}
        month={month}
        employees={employees}
        employeeFilter={store.employeeFilter}
        onPrev={() => store.setCurrentMonth(prevMonth(year, month))}
        onNext={() => store.setCurrentMonth(nextMonth(year, month))}
        onToday={() => {
          const now = new Date()
          store.setCurrentMonth({ year: now.getFullYear(), month: now.getMonth() + 1 })
        }}
        onFilterChange={store.setEmployeeFilter}
      />

      <CalendarLegend />

      <div className="flex flex-col lg:flex-row gap-0">
        <div className="flex-1">
          <CalendarGrid
            year={year}
            month={month}
            grouped={grouped}
            selectedDate={selectedDate}
            today={TODAY}
            onSelect={setSelectedDate}
          />
        </div>
        <div className="lg:w-72 border-t lg:border-t-0 lg:border-l border-base-300">
          <DayDetailPanel selectedDate={selectedDate} entries={selectedEntries} />
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Run tests to verify they pass**

```bash
npx jest src/__tests__/views/SchedulePage.test.tsx --no-coverage
```

- [ ] **Step 6: Commit**

```bash
git add src/views/pages/SchedulePage.tsx src/__tests__/views/SchedulePage.test.tsx
git commit -m "feat(schedule): add SchedulePage composing all calendar components"
```

---

## Task 11: ScheduleEventFormPage

**Files:**
- Create: `src/views/pages/ScheduleEventFormPage.tsx`
- Create: `src/__tests__/views/ScheduleEventFormPage.test.tsx`

Form to create a new ScheduleEvent. Uses `useScheduleStore.create()` and `useEmployeeStore` for the employee multi-select.

- [ ] **Step 1: Write the test**

```typescript
// src/__tests__/views/ScheduleEventFormPage.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { ScheduleEventFormPage } from '@/views/pages/ScheduleEventFormPage'
import { useScheduleStore } from '@/viewmodels/schedule.viewmodel'

jest.mock('@/viewmodels/schedule.viewmodel')
jest.mock('@/viewmodels/employee.viewmodel', () => ({
  useEmployeeStore: jest.fn(() => ({
    employees: [{ id: 'emp-1', name: 'João Silva' }, { id: 'emp-2', name: 'Ana Souza' }],
    load: jest.fn(),
  })),
}))

function mockStore(overrides = {}) {
  ;(useScheduleStore as unknown as jest.Mock).mockReturnValue({
    create: jest.fn().mockResolvedValue({ id: 'evt-new' }),
    loading: false,
    error: null,
    ...overrides,
  })
}

function renderForm() {
  return render(
    <MemoryRouter initialEntries={['/schedule/new']}>
      <Routes>
        <Route path="/schedule/new" element={<ScheduleEventFormPage />} />
        <Route path="/schedule" element={<div>Calendário</div>} />
      </Routes>
    </MemoryRouter>
  )
}

it('renderiza os campos do formulário', () => {
  mockStore()
  renderForm()
  expect(screen.getByLabelText(/tipo/i)).toBeInTheDocument()
  expect(screen.getByLabelText(/data de início/i)).toBeInTheDocument()
  expect(screen.getByLabelText(/data de término/i)).toBeInTheDocument()
})

it('exibe erro de validação quando employeeIds está vazio', async () => {
  mockStore()
  renderForm()
  fireEvent.click(screen.getByRole('button', { name: /salvar/i }))
  await waitFor(() => {
    expect(screen.getByText(/selecione ao menos um funcionário/i)).toBeInTheDocument()
  })
})

it('exibe erro quando endDate é anterior a startDate', async () => {
  mockStore()
  renderForm()
  fireEvent.change(screen.getByLabelText(/data de início/i), { target: { value: '2026-04-10' } })
  fireEvent.change(screen.getByLabelText(/data de término/i), { target: { value: '2026-04-05' } })
  fireEvent.click(screen.getByRole('button', { name: /salvar/i }))
  await waitFor(() => {
    expect(screen.getByText(/posterior à data de início/i)).toBeInTheDocument()
  })
})

it('chama store.create e navega para /schedule após submit válido', async () => {
  const create = jest.fn().mockResolvedValue({ id: 'evt-new' })
  mockStore({ create })
  renderForm()

  // Fill form
  fireEvent.change(screen.getByLabelText(/tipo/i), { target: { value: 'day_off' } })
  fireEvent.change(screen.getByLabelText(/data de início/i), { target: { value: '2026-04-06' } })
  fireEvent.change(screen.getByLabelText(/data de término/i), { target: { value: '2026-04-06' } })
  // Select employee checkbox
  fireEvent.click(screen.getByLabelText(/joão silva/i))

  fireEvent.click(screen.getByRole('button', { name: /salvar/i }))
  await waitFor(() => {
    expect(create).toHaveBeenCalled()
    expect(screen.getByText('Calendário')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx jest src/__tests__/views/ScheduleEventFormPage.test.tsx --no-coverage
```

- [ ] **Step 3: Implement ScheduleEventFormPage**

```typescript
// src/views/pages/ScheduleEventFormPage.tsx
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { scheduleEventSchema, type ScheduleEventFormData } from '@/models/schedule-event.model'
import { useScheduleStore } from '@/viewmodels/schedule.viewmodel'
import { useEmployeeStore } from '@/viewmodels/employee.viewmodel'

const TYPE_OPTIONS = [
  { value: 'day_off', label: 'Folga' },
  { value: 'vacation', label: 'Férias' },
  { value: 'training', label: 'Treinamento' },
  { value: 'medical_leave', label: 'Afastamento médico' },
] as const

export function ScheduleEventFormPage() {
  const navigate = useNavigate()
  const { create } = useScheduleStore()
  const { employees, load: loadEmployees } = useEmployeeStore()

  useEffect(() => { loadEmployees() }, [])

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ScheduleEventFormData>({
    resolver: zodResolver(scheduleEventSchema),
    defaultValues: { type: 'day_off', employeeIds: [], startDate: '', endDate: '' },
  })

  const onSubmit = async (data: ScheduleEventFormData) => {
    const employeeNames = (employees ?? [])
      .filter((e: { id: string; name: string }) => data.employeeIds.includes(e.id))
      .map((e: { id: string; name: string }) => e.name)
    await create({ ...data, employeeNames })
    navigate('/schedule')
  }

  return (
    <div className="max-w-lg mx-auto p-6">
      <h1 className="text-xl font-bold mb-6">Novo Evento de Agenda</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        {/* Tipo */}
        <div className="form-control">
          <label htmlFor="type" className="label"><span className="label-text">Tipo</span></label>
          <select id="type" {...register('type')} className="select select-bordered">
            {TYPE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        {/* Funcionários */}
        <div className="form-control">
          <span className="label-text mb-2 block">Funcionários</span>
          <div className="flex flex-col gap-1 max-h-48 overflow-y-auto border border-base-300 rounded-lg p-2">
            <Controller
              name="employeeIds"
              control={control}
              render={({ field }) => (
                <>
                  {(employees ?? []).map((e: { id: string; name: string }) => (
                    <label key={e.id} className="flex items-center gap-2 text-sm cursor-pointer">
                      <input
                        type="checkbox"
                        aria-label={e.name}
                        className="checkbox checkbox-sm"
                        checked={field.value.includes(e.id)}
                        onChange={(ev) => {
                          if (ev.target.checked) {
                            field.onChange([...field.value, e.id])
                          } else {
                            field.onChange(field.value.filter((id: string) => id !== e.id))
                          }
                        }}
                      />
                      {e.name}
                    </label>
                  ))}
                </>
              )}
            />
          </div>
          {errors.employeeIds && (
            <p className="text-error text-xs mt-1">{errors.employeeIds.message}</p>
          )}
        </div>

        {/* Datas */}
        <div className="grid grid-cols-2 gap-3">
          <div className="form-control">
            <label htmlFor="startDate" className="label"><span className="label-text">Data de início</span></label>
            <input id="startDate" type="date" {...register('startDate')} className="input input-bordered" />
            {errors.startDate && <p className="text-error text-xs mt-1">{errors.startDate.message}</p>}
          </div>
          <div className="form-control">
            <label htmlFor="endDate" className="label"><span className="label-text">Data de término</span></label>
            <input id="endDate" type="date" {...register('endDate')} className="input input-bordered" />
            {errors.endDate && <p className="text-error text-xs mt-1">{errors.endDate.message}</p>}
          </div>
        </div>

        {/* Observações */}
        <div className="form-control">
          <label htmlFor="notes" className="label"><span className="label-text">Observações (opcional)</span></label>
          <textarea id="notes" {...register('notes')} className="textarea textarea-bordered" rows={3} />
        </div>

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={() => navigate('/schedule')} className="btn btn-ghost flex-1">
            Cancelar
          </button>
          <button type="submit" className="btn btn-primary flex-1">Salvar</button>
        </div>
      </form>
    </div>
  )
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx jest src/__tests__/views/ScheduleEventFormPage.test.tsx --no-coverage
```

- [ ] **Step 5: Commit**

```bash
git add src/views/pages/ScheduleEventFormPage.tsx src/__tests__/views/ScheduleEventFormPage.test.tsx
git commit -m "feat(schedule): add ScheduleEventFormPage with validation and multi-employee select"
```

---

## Task 12: ScheduleEventDetailPage

**Files:**
- Create: `src/views/pages/ScheduleEventDetailPage.tsx`
- Create: `src/__tests__/views/ScheduleEventDetailPage.test.tsx`

Read-only view of a single ScheduleEvent. Fetches by `:id` from the store. Omits `endDate` label if equal to `startDate`.

- [ ] **Step 1: Write the test**

```typescript
// src/__tests__/views/ScheduleEventDetailPage.test.tsx
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { ScheduleEventDetailPage } from '@/views/pages/ScheduleEventDetailPage'
import { useScheduleStore } from '@/viewmodels/schedule.viewmodel'

jest.mock('@/viewmodels/schedule.viewmodel')

const mockEvent = {
  id: 'evt-1',
  type: 'training',
  employeeIds: ['emp-1', 'emp-2'],
  employeeNames: ['João Silva', 'Ana Souza'],
  startDate: '2026-04-02',
  endDate: '2026-04-03',
  notes: 'NR10 básico',
  createdAt: '',
  updatedAt: '',
}

function mockStore(overrides = {}) {
  ;(useScheduleStore as unknown as jest.Mock).mockReturnValue({
    getById: jest.fn().mockResolvedValue(mockEvent),
    loading: false,
    ...overrides,
  })
}

function renderPage(id = 'evt-1') {
  return render(
    <MemoryRouter initialEntries={[`/schedule/${id}`]}>
      <Routes>
        <Route path="/schedule/:id" element={<ScheduleEventDetailPage />} />
        <Route path="/schedule" element={<div>Calendário</div>} />
      </Routes>
    </MemoryRouter>
  )
}

it('exibe o tipo do evento', async () => {
  mockStore()
  renderPage()
  await waitFor(() => expect(screen.getByText(/treinamento/i)).toBeInTheDocument())
})

it('exibe todos os nomes dos funcionários', async () => {
  mockStore()
  renderPage()
  await waitFor(() => {
    expect(screen.getByText(/joão silva, ana souza/i)).toBeInTheDocument()
  })
})

it('exibe data de início', async () => {
  mockStore()
  renderPage()
  await waitFor(() => expect(screen.getByText(/02\/04\/2026/i)).toBeInTheDocument())
})

it('exibe data de término quando diferente de início', async () => {
  mockStore()
  renderPage()
  await waitFor(() => expect(screen.getByText(/03\/04\/2026/i)).toBeInTheDocument())
})

it('omite rótulo de data de término quando é igual a início', async () => {
  const singleDay = { ...mockEvent, endDate: '2026-04-02' }
  mockStore({ getById: jest.fn().mockResolvedValue(singleDay) })
  renderPage()
  await waitFor(() => expect(screen.getByText(/02\/04\/2026/i)).toBeInTheDocument())
  expect(screen.queryByText(/término/i)).not.toBeInTheDocument()
})

it('exibe as observações', async () => {
  mockStore()
  renderPage()
  await waitFor(() => expect(screen.getByText(/nr10 básico/i)).toBeInTheDocument())
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx jest src/__tests__/views/ScheduleEventDetailPage.test.tsx --no-coverage
```

- [ ] **Step 3: Implement ScheduleEventDetailPage**

```typescript
// src/views/pages/ScheduleEventDetailPage.tsx
import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useScheduleStore } from '@/viewmodels/schedule.viewmodel'
import type { ScheduleEvent } from '@/models/schedule-event.model'

const EVENT_LABELS: Record<string, string> = {
  day_off: 'Folga',
  vacation: 'Férias',
  training: 'Treinamento',
  medical_leave: 'Afastamento médico',
}

const EVENT_COLORS: Record<string, string> = {
  day_off: 'badge-error',
  vacation: 'badge-warning',
  training: 'badge-secondary',
  medical_leave: 'badge-ghost',
}

function formatDate(iso: string) {
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

export function ScheduleEventDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { getById } = useScheduleStore()
  const [event, setEvent] = useState<ScheduleEvent | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    getById(id)
      .then(setEvent)
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <div className="p-6">Carregando...</div>
  if (!event) return <div className="p-6 text-error">Evento não encontrado.</div>

  const multiDay = event.startDate !== event.endDate

  return (
    <div className="max-w-lg mx-auto p-6">
      <button onClick={() => navigate('/schedule')} className="btn btn-ghost btn-sm mb-4">
        ← Voltar
      </button>

      <h1 className="text-xl font-bold mb-6">Detalhe do Evento</h1>

      <div className="flex flex-col gap-4">
        <div>
          <p className="text-xs text-base-content/40 uppercase mb-1">Tipo</p>
          <span className={`badge ${EVENT_COLORS[event.type] ?? 'badge-ghost'}`}>
            {EVENT_LABELS[event.type] ?? event.type}
          </span>
        </div>

        <div>
          <p className="text-xs text-base-content/40 uppercase mb-1">Funcionários</p>
          <p className="text-sm">{event.employeeNames.join(', ')}</p>
        </div>

        <div>
          <p className="text-xs text-base-content/40 uppercase mb-1">Data de início</p>
          <p className="text-sm">{formatDate(event.startDate)}</p>
        </div>

        {multiDay && (
          <div>
            <p className="text-xs text-base-content/40 uppercase mb-1">Data de término</p>
            <p className="text-sm">{formatDate(event.endDate)}</p>
          </div>
        )}

        {event.notes && (
          <div>
            <p className="text-xs text-base-content/40 uppercase mb-1">Observações</p>
            <p className="text-sm whitespace-pre-wrap">{event.notes}</p>
          </div>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx jest src/__tests__/views/ScheduleEventDetailPage.test.tsx --no-coverage
```

- [ ] **Step 5: Commit**

```bash
git add src/views/pages/ScheduleEventDetailPage.tsx src/__tests__/views/ScheduleEventDetailPage.test.tsx
git commit -m "feat(schedule): add ScheduleEventDetailPage (read-only)"
```

---

## Task 13: Router + Navigation Integration

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/models/navigation.model.ts`
- Modify: `src/views/components/Sidebar.tsx`

Wire up the 3 new routes, add the Agenda nav item, and register the Calendar icon in the Sidebar's icon map.

- [ ] **Step 1: Add routes to App.tsx**

In `src/App.tsx`, inside the `<RoleGuard allowedRoles={['admin', 'manager']}>` block, add after the `/financial` route:

```tsx
import { SchedulePage } from '@/views/pages/SchedulePage'
import { ScheduleEventFormPage } from '@/views/pages/ScheduleEventFormPage'
import { ScheduleEventDetailPage } from '@/views/pages/ScheduleEventDetailPage'

// inside RoleGuard admin/manager:
<Route path="/schedule" element={<SchedulePage />} />
<Route path="/schedule/new" element={<ScheduleEventFormPage />} />
<Route path="/schedule/:id" element={<ScheduleEventDetailPage />} />
```

- [ ] **Step 2: Add nav item to navigation.model.ts**

In `src/models/navigation.model.ts`, add to `NAV_ITEMS` after the `/financial` entry:

```typescript
{ label: 'Agenda', path: '/schedule', icon: 'calendar', allowedRoles: ['admin', 'manager'] },
```

- [ ] **Step 3: Add Calendar icon to Sidebar.tsx**

In `src/views/components/Sidebar.tsx`, add `Calendar` to the lucide-react import and to `ICON_MAP`:

```tsx
import { Home, Briefcase, Cpu, FileText, Users, DollarSign, Clipboard, MessageCircle, Zap, Calendar } from 'lucide-react'

const ICON_MAP = {
  // ...existing entries...
  calendar: Calendar,
}
```

- [ ] **Step 4: Run the full test suite**

```bash
npm test -- --no-coverage
```

Expected: all tests PASS (no regressions)

- [ ] **Step 5: Commit**

```bash
git add src/App.tsx src/models/navigation.model.ts src/views/components/Sidebar.tsx
git commit -m "feat(schedule): wire up routes and add Agenda nav item"
```

---

## Final Verification

- [ ] Run full test suite: `npm test -- --no-coverage` — all tests must pass
- [ ] Start dev server: `npm run dev` — open `/schedule` in browser
- [ ] Verify: monthly grid renders for current month
- [ ] Verify: clicking a day shows the detail panel
- [ ] Verify: "+ Novo Evento" navigates to form, submit returns to calendar
- [ ] Verify: clicking an event in the detail panel navigates to detail page
- [ ] Verify: "Agenda" appears in the sidebar for admin/manager users
