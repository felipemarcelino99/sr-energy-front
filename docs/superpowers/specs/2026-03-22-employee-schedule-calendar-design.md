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
})
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
├── CalendarLegend
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
  ├── filter by employeeFilter (if set)
  ├── expand multi-day events across all covered dates
  └── group by date → Map<string, CalendarEntry[]>
```

The viewmodel handles all data fetching and transformation. Components receive only `Map<string, CalendarEntry[]>` and display it.

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
