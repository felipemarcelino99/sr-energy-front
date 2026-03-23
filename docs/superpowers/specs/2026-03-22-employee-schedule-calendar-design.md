# Employee Schedule Calendar — Design Spec

**Date:** 2026-03-22
**Status:** Approved

---

## Overview

A monthly calendar page (`/schedule`) for managers to view and manage employee schedules: work assignments (Jobs), days off, vacations, training sessions, and medical leave.

---

## Goals

- Give admins a unified monthly view of all employee schedule events
- Allow creating and viewing schedule events (non-Job types) for one or more employees
- Integrate with the existing Jobs system without modifying the Job model
- Backend endpoints for `ScheduleEvent` do not exist yet; frontend uses a mock service initially

---

## Non-Goals

- Employees cannot manage their own schedule
- No weekly or daily view (monthly only)
- No inline event creation from the calendar (separate form route)
- No editing of existing Jobs from this page
- No editing or deleting of ScheduleEvents in this phase (detail page is read-only)

---

## Event Types

| Type | Value | Color |
|------|-------|-------|
| Trabalho (Job) | `job` | Blue `#3b82f6` |
| Folga | `day_off` | Red `#f87171` |
| Férias | `vacation` | Orange `#fb923c` |
| Treinamento | `training` | Purple `#a78bfa` |
| Afastamento médico | `medical_leave` | Gray `#94a3b8` |

---

## Data Model

### `ScheduleEvent`

```typescript
type ScheduleEventType = 'day_off' | 'vacation' | 'training' | 'medical_leave'

interface ScheduleEvent {
  id: string
  type: ScheduleEventType
  employeeIds: string[]      // 1 or more employees
  employeeNames: string[]    // denormalized for display
  startDate: string          // ISO date (YYYY-MM-DD)
  endDate: string            // ISO date — equals startDate for single-day events
  notes?: string
  createdAt: string
  updatedAt: string
}
```

### Zod Schema

```typescript
export const scheduleEventSchema = z.object({
  type: z.enum(['day_off', 'vacation', 'training', 'medical_leave']),
  employeeIds: z.array(z.string().min(1)).min(1, 'Selecione ao menos um funcionário'),
  startDate: z.string().min(1, 'Data de início é obrigatória'),
  endDate: z.string().min(1, 'Data de término é obrigatória'),
  notes: z.string().optional(),
}).refine(
  (data) => data.endDate >= data.startDate,
  { message: 'Data de término deve ser igual ou posterior à data de início', path: ['endDate'] }
)
```

### `CalendarEntry` (view-only union type)

```typescript
type CalendarEntry =
  | { kind: 'job'; data: Job }
  | { kind: 'event'; data: ScheduleEvent }
```

---

## Routes

| Route | Component | Description |
|-------|-----------|-------------|
| `/schedule` | `SchedulePage` | Monthly calendar view |
| `/schedule/new` | `ScheduleEventFormPage` | Create a new ScheduleEvent |
| `/schedule/:id` | `ScheduleEventDetailPage` | Read-only detail view |

---

## Component Architecture

```
SchedulePage
├── CalendarToolbar
│     ├── Month navigation (◀ / ▶ / Today)
│     ├── Employee filter (select)
│     └── "+ Novo Evento" button → /schedule/new
├── CalendarLegend        — horizontal row of colored chips, one per event type
├── CalendarGrid
│     └── DayCell (×30/31)
│           └── EventChip (one per CalendarEntry on that day)
└── DayDetailPanel
      └── EventDetailRow (read-only, click → /schedule/:id)
```

### State

- `currentMonth: { year: number; month: number }` — drives which month is displayed
- `selectedDate: string | null` — drives DayDetailPanel
- `employeeFilter: string | null` — filters entries by employeeId

---

## Data Flow

```
useScheduleViewModel(currentMonth, employeeFilter)
  ├── jobService.getJobs()                → Job[]
  ├── scheduleEventService.getAll()       → ScheduleEvent[]
  ├── merge → CalendarEntry[]
  ├── filter by employeeFilter (if set)   — includes event if employeeId is ANY of employeeIds
  ├── expand multi-day events across all covered dates (clipped to currentMonth)
  └── group by date → Map<string, CalendarEntry[]>
```

The viewmodel handles all data fetching and transformation. Components receive only `Map<string, CalendarEntry[]>` and display it.

**Employee filter rule:** when `employeeFilter` is set, a `ScheduleEvent` is included if the filtered `employeeId` appears anywhere in `employeeIds`. Jobs are filtered by their single `employeeId`.

**Multi-day event expansion:** a `ScheduleEvent` with `startDate < endDate` is added to every date in the range that falls within `currentMonth`. Days outside the current month are clipped. For example, a vacation from March 28 to April 5, viewed in March, appears on March 28–31 only; viewed in April, it appears on April 1–5 only.

---

## Create Event Form (`/schedule/new`)

**Fields:**

| Field | Type | Validation |
|-------|------|------------|
| Tipo | Select | Required |
| Funcionários | Multi-select with search | Min 1 |
| Data início | Date input | Required |
| Data fim | Date input | Required, ≥ startDate |
| Observações | Textarea | Optional |

**`employeeNames` resolution:** before submitting, the frontend resolves `employeeNames` from the already-loaded employee list (fetched via `employeeService.getAll()`). The POST body includes both `employeeIds` and `employeeNames`.

On submit → POST `/schedule-events` (mocked) → redirect to `/schedule?month=YYYY-MM`.

---

## API Contract (future backend)

### `GET /schedule-events`
Returns `ScheduleEvent[]`. Supports optional query params: `?month=YYYY-MM`, `?employeeId=uuid`.

### `POST /schedule-events`
Body: `ScheduleEventFormData` (without id/createdAt/updatedAt).
Returns: `ScheduleEvent`.

### `GET /schedule-events/:id`
Returns: `ScheduleEvent`.

No `PATCH` or `DELETE` endpoints are in scope for this phase.

---

## Detail Page (`/schedule/:id`)

Read-only view of a single `ScheduleEvent`. Displays:

| Field | Display |
|-------|---------|
| Tipo | Badge with color matching event type |
| Funcionários | Comma-separated names |
| Data início | Formatted date (DD/MM/YYYY) |
| Data fim | Formatted date — omitted if equal to startDate |
| Observações | Plain text, omitted if empty |

No edit or delete actions. Back button returns to `/schedule`.

---

## Mock Service Seed Data

The mock `scheduleEventService` returns the following deterministic fixtures:

```typescript
const MOCK_EVENTS: ScheduleEvent[] = [
  {
    id: 'evt-1',
    type: 'training',
    employeeIds: ['emp-1', 'emp-2'],
    employeeNames: ['João Silva', 'Ana Souza'],
    startDate: '2026-04-02',
    endDate: '2026-04-03',
    createdAt: '2026-03-01T00:00:00.000Z',
    updatedAt: '2026-03-01T00:00:00.000Z',
  },
  {
    id: 'evt-2',
    type: 'day_off',
    employeeIds: ['emp-3'],
    employeeNames: ['Carlos Lima'],
    startDate: '2026-04-06',
    endDate: '2026-04-06',
    createdAt: '2026-03-01T00:00:00.000Z',
    updatedAt: '2026-03-01T00:00:00.000Z',
  },
  {
    id: 'evt-3',
    type: 'vacation',
    employeeIds: ['emp-2'],
    employeeNames: ['Ana Souza'],
    startDate: '2026-04-10',
    endDate: '2026-04-14',
    createdAt: '2026-03-01T00:00:00.000Z',
    updatedAt: '2026-03-01T00:00:00.000Z',
  },
]
```

These fixtures are used in all ViewModel and view tests as the known input set.

---

## Error Handling

- Fetch errors → toast notification with generic message
- Form validation errors → inline field messages via Zod
- Empty state (no events in month) → illustrated empty state message

---

## Testing Strategy

| Layer | What to test |
|-------|-------------|
| Model | Zod schema validation (valid/invalid payloads) |
| ScheduleEvent service | Mock CRUD operations |
| `useScheduleViewModel` | Merge of Jobs + ScheduleEvents, grouping by date, multi-day expansion, employee filter |
| `CalendarGrid` | Renders correct events per day, highlights today, navigates months |
| `DayDetailPanel` | Shows events for selected date, links to detail page |
| `ScheduleEventFormPage` | Field validation, multi-employee select, submit flow |
