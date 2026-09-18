import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addWeeks,
  addMonths,
} from 'date-fns'
import type {
  CalendarEntry,
  CalendarJob,
  CalendarJobEmployee,
  CalendarView,
  ScheduleEvent,
  ScheduleEventFormData,
} from '@/models/schedule.model'
import {
  fetchCalendarJobs,
  fetchScheduleEvents,
  createScheduleEvent,
} from '@/services/schedule.service'
import { toLocalDateString } from '@/utils/date'

export interface DateRange {
  from: string // YYYY-MM-DD, inclusive
  to: string // YYYY-MM-DD, inclusive
}

const EMPTY_JOBS: CalendarJob[] = []
const EMPTY_EVENTS: ScheduleEvent[] = []

// ---- Range/navigation — pure date math, kept outside hooks so it's trivially testable ----

/** Intervalo [from, to] visível para cada visão, a partir da data âncora. */
export function computeRange(view: CalendarView, anchor: Date): DateRange {
  switch (view) {
    case 'day': {
      const d = toLocalDateString(anchor)
      return { from: d, to: d }
    }
    case 'week': {
      const start = startOfWeek(anchor, { weekStartsOn: 0 })
      const end = endOfWeek(anchor, { weekStartsOn: 0 })
      return { from: toLocalDateString(start), to: toLocalDateString(end) }
    }
    case 'month':
    default: {
      const start = startOfMonth(anchor)
      const end = endOfMonth(anchor)
      return { from: toLocalDateString(start), to: toLocalDateString(end) }
    }
  }
}

/** Próxima/anterior data âncora, de acordo com a unidade da visão ativa. */
export function navigateAnchor(view: CalendarView, anchor: Date, direction: 1 | -1): Date {
  switch (view) {
    case 'day':
      return addDays(anchor, direction)
    case 'week':
      return addWeeks(anchor, direction)
    case 'month':
    default:
      return addMonths(anchor, direction)
  }
}

// ---- Rótulos em pt-BR (passo 3) — fora de CalendarToolbar.tsx porque
// react-refresh/only-export-components proíbe exportar não-componentes de um
// arquivo de componente. ----

export const MONTH_NAMES = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
]

const MONTH_NAMES_SHORT = [
  'jan',
  'fev',
  'mar',
  'abr',
  'mai',
  'jun',
  'jul',
  'ago',
  'set',
  'out',
  'nov',
  'dez',
]

function startOfWeekSunday(date: Date): Date {
  const d = new Date(date)
  d.setDate(d.getDate() - d.getDay())
  return d
}

/** Rótulo do período visível, de acordo com a visão ativa (usado pelo `CalendarToolbar`). */
export function rangeLabel(view: CalendarView, anchor: Date): string {
  if (view === 'day') {
    return `${anchor.getDate()} de ${MONTH_NAMES[anchor.getMonth()]} de ${anchor.getFullYear()}`
  }
  if (view === 'week') {
    const start = startOfWeekSunday(anchor)
    const end = addDays(start, 6)
    const sameMonth = start.getMonth() === end.getMonth()
    const startLabel =
      `${start.getDate()} ${sameMonth ? '' : MONTH_NAMES_SHORT[start.getMonth()]}`.trim()
    const endLabel = `${end.getDate()} ${MONTH_NAMES_SHORT[end.getMonth()]} ${end.getFullYear()}`
    return `${startLabel} – ${endLabel}`
  }
  return `${MONTH_NAMES[anchor.getMonth()]} ${anchor.getFullYear()}`
}

/** Mês (YYYY-MM) usado para buscar os ScheduleEvents — o endpoint só filtra por mês
 * (não por intervalo arbitrário). Usa o mês do início do range visível: suficiente
 * para as visões mês/dia (sempre dentro de um mês) e uma aproximação razoável para
 * semanas que cruzam a virada do mês (limitação aceita — eventos raramente cruzam
 * fronteira de semana/mês; ver plano 06, passo 1). */
export function eventsMonthParam(range: DateRange): string {
  return range.from.slice(0, 7)
}

// ---- Server state (TanStack Query) — nunca useEffect para fetch ----

export const calendarJobsQueryKey = (range: DateRange) =>
  ['calendar-jobs', range.from, range.to] as const

export function useCalendarJobs(range: DateRange) {
  const query = useQuery({
    queryKey: calendarJobsQueryKey(range),
    queryFn: () => fetchCalendarJobs(range.from, range.to),
  })
  return { ...query, jobs: query.data ?? EMPTY_JOBS }
}

export const scheduleEventsQueryKey = (month: string) => ['schedule-events', month] as const

export function useScheduleEventsQuery(month: string) {
  const query = useQuery({
    queryKey: scheduleEventsQueryKey(month),
    queryFn: () => fetchScheduleEvents(month),
  })
  return { ...query, events: query.data ?? EMPTY_EVENTS }
}

/**
 * Ação de escrita (criar evento de agenda) via useMutation — o único caso de
 * "store" que sobra depois da migração pra useQuery (passo 1). Mantido com o
 * nome `useScheduleStore` porque `ScheduleEventModal.tsx` (fora do escopo
 * deste sub-plano) já depende dele.
 */
export function useScheduleStore() {
  const queryClient = useQueryClient()
  const createMutation = useMutation({
    mutationFn: (data: ScheduleEventFormData & { employeeNames: string[] }) =>
      createScheduleEvent(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedule-events'] })
    },
  })

  return {
    create: async (data: ScheduleEventFormData & { employeeNames: string[] }) => {
      await createMutation.mutateAsync(data)
    },
  }
}

// ---- Grouping — pure logic, kept outside hooks so it's trivially testable ----

function expandRange(
  entryStart: string,
  entryEnd: string,
  viewFrom: string,
  viewTo: string
): string[] {
  const start = entryStart > viewFrom ? entryStart : viewFrom
  const end = entryEnd < viewTo ? entryEnd : viewTo
  if (start > end) return []

  const dates: string[] = []
  const cur = new Date(start + 'T00:00:00')
  const last = new Date(end + 'T00:00:00')
  while (cur <= last) {
    dates.push(toLocalDateString(cur))
    cur.setDate(cur.getDate() + 1)
  }
  return dates
}

/** Datas em que a OS aparece: intervalo [scheduledDate, scheduledEndDate] quando este
 * último existir e for posterior; caso contrário, só o dia de scheduledDate. */
function jobDateRange(job: CalendarJob): { start: string; end: string } {
  const end =
    job.scheduledEndDate && job.scheduledEndDate > job.scheduledDate
      ? job.scheduledEndDate
      : job.scheduledDate
  return { start: job.scheduledDate, end }
}

/**
 * Agrupa OS + eventos por data, dentro do intervalo visível (`range`),
 * filtrando por colaborador quando `employeeFilter` está setado. Substitui o
 * `groupedByDate()` do antigo store zustand — agora recebe os dados já
 * carregados via `useQuery` em vez de ler de um estado interno.
 */
export function groupEntriesByDate(
  jobs: CalendarJob[],
  events: ScheduleEvent[],
  range: DateRange,
  employeeFilter: string | null
): Map<string, CalendarEntry[]> {
  const map = new Map<string, CalendarEntry[]>()

  const addEntry = (date: string, entry: CalendarEntry) => {
    if (!map.has(date)) map.set(date, [])
    map.get(date)!.push(entry)
  }

  for (const event of events) {
    if (employeeFilter && !event.employeeIds.includes(employeeFilter)) continue
    for (const date of expandRange(event.startDate, event.endDate, range.from, range.to)) {
      addEntry(date, { kind: 'event', data: event })
    }
  }

  for (const job of jobs) {
    if (!job.scheduledDate) continue
    if (employeeFilter && !job.employees.some((e) => e.id === employeeFilter)) continue
    const { start, end } = jobDateRange(job)
    for (const date of expandRange(start, end, range.from, range.to)) {
      addEntry(date, { kind: 'job', data: job })
    }
  }

  return map
}

/**
 * Colaboradores únicos (por id) presentes nas OS do intervalo visível —
 * fonte da legenda (passo 2: a legenda vem de quem realmente tem OS no
 * intervalo, e não de `loadEmployees()`, que fica vazio em modo `readOnly`
 * e não reflete o período em exibição).
 */
export function uniqueEmployeesFromJobs(jobs: CalendarJob[]): CalendarJobEmployee[] {
  const byId = new Map<string, CalendarJobEmployee>()
  for (const job of jobs) {
    for (const employee of job.employees) {
      if (!byId.has(employee.id)) byId.set(employee.id, employee)
    }
  }
  return Array.from(byId.values()).sort((a, b) => a.name.localeCompare(b.name))
}

/**
 * Colaboradores únicos (por id) presentes nas OS OU nos eventos (Folga/
 * Férias/Treinamento/Afastamento médico) do intervalo visível — usado na
 * legenda. Corrige o gap de `uniqueEmployeesFromJobs` sozinha: um
 * funcionário só com evento (sem nenhuma OS no período, ex. de férias o mês
 * inteiro) não aparecia na legenda nem tinha nome exibido — feedback do
 * usuário. Quem só tem evento entra com a cor resolvida por `colorIndex`
 * (real, se o funcionário estiver no store — ver `buildEmployeeColorIndex`
 * — senão o hash determinístico).
 */
export function uniqueEmployeesFromEntries(
  jobs: CalendarJob[],
  events: ScheduleEvent[],
  colorIndex: Map<string, string>
): CalendarJobEmployee[] {
  const byId = new Map<string, CalendarJobEmployee>()
  for (const job of jobs) {
    for (const employee of job.employees) {
      if (!byId.has(employee.id)) byId.set(employee.id, employee)
    }
  }
  for (const event of events) {
    event.employeeIds.forEach((id, i) => {
      if (byId.has(id)) return
      byId.set(id, {
        id,
        name: event.employeeNames[i] ?? '—',
        color: colorIndex.get(id) ?? null,
        photoUrl: null,
      })
    })
  }
  return Array.from(byId.values()).sort((a, b) => a.name.localeCompare(b.name))
}

/**
 * Índice id → cor real do funcionário, construído a partir de quem já foi
 * carregado nesta tela (colaboradores com OS no período + o store de
 * funcionários, quando disponível — vazio em modo `readOnly`). Feedback do
 * usuário: eventos (Folga/Férias/Treinamento/Afastamento médico) passam a
 * usar sempre a MESMA cor do funcionário que já aparece nos chips de OS e na
 * legenda, não uma cor fixa por tipo. `resolveEmployeeColor` cai pro hash
 * determinístico de `getEmployeeColor` só quando o funcionário não está em
 * nenhuma das duas fontes (ex.: só tem evento, sem OS, em modo readOnly).
 */
export function buildEmployeeColorIndex(
  jobEmployees: CalendarJobEmployee[],
  storeEmployees: { id: string; color?: string | null }[]
): Map<string, string> {
  const index = new Map<string, string>()
  for (const e of jobEmployees) if (e.color) index.set(e.id, e.color)
  for (const e of storeEmployees) if (e.color) index.set(e.id, e.color)
  return index
}
