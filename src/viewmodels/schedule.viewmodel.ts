import { create } from 'zustand'
import type { ScheduleEvent, ScheduleEventFormData, CalendarEntry } from '@/models/schedule.model'
import type { Job } from '@/models/job.model'
import { fetchScheduleEvents, createScheduleEvent } from '@/services/schedule.service'
import { fetchJobs } from '@/services/job.service'
import { toLocalDateString } from '@/utils/date'

interface CurrentMonth {
  year: number
  month: number // 1-based
}

interface ScheduleState {
  events: ScheduleEvent[]
  jobs: Job[]
  loading: boolean
  error: string | null
  currentMonth: CurrentMonth
  selectedDate: string | null
  employeeFilter: string | null

  load: () => Promise<void>
  create: (data: ScheduleEventFormData & { employeeNames: string[] }) => Promise<void>
  setCurrentMonth: (m: CurrentMonth) => void
  setSelectedDate: (date: string | null) => void
  setEmployeeFilter: (id: string | null) => void
  groupedByDate: () => Map<string, CalendarEntry[]>
}


function expandEvent(event: ScheduleEvent, year: number, month: number): string[] {
  const monthStart = `${year}-${String(month).padStart(2, '0')}-01`
  const lastDay = new Date(year, month, 0).getDate()
  const monthEnd = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`

  const start = event.startDate > monthStart ? event.startDate : monthStart
  const end = event.endDate < monthEnd ? event.endDate : monthEnd

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

export const useScheduleStore = create<ScheduleState>((set, get) => ({
  events: [],
  jobs: [],
  loading: false,
  error: null,
  currentMonth: { year: new Date().getFullYear(), month: new Date().getMonth() + 1 },
  selectedDate: null,
  employeeFilter: null,

  load: async () => {
    set({ loading: true, error: null })
    try {
      const [events, jobs] = await Promise.all([fetchScheduleEvents(), fetchJobs()])
      set({ events, jobs, loading: false })
    } catch (err) {
      set({ error: (err as Error).message, loading: false })
    }
  },

  create: async (data) => {
    const event = await createScheduleEvent(data)
    set((s) => ({ events: [...s.events, event] }))
  },

  setCurrentMonth: (m) => set({ currentMonth: m }),
  setSelectedDate: (date) => set({ selectedDate: date }),
  setEmployeeFilter: (id) => set({ employeeFilter: id }),

  groupedByDate: () => {
    const { events, jobs, currentMonth, employeeFilter } = get()
    const { year, month } = currentMonth
    const map = new Map<string, CalendarEntry[]>()

    const addEntry = (date: string, entry: CalendarEntry) => {
      if (!map.has(date)) map.set(date, [])
      map.get(date)!.push(entry)
    }

    // Schedule events
    for (const event of events) {
      if (employeeFilter && !event.employeeIds.includes(employeeFilter)) continue
      const dates = expandEvent(event, year, month)
      for (const date of dates) {
        addEntry(date, { kind: 'event', data: event })
      }
    }

    // Jobs
    const monthPrefix = `${year}-${String(month).padStart(2, '0')}-`
    for (const job of jobs) {
      if (!job.scheduledDate?.startsWith(monthPrefix)) continue
      if (employeeFilter && job.employeeId !== employeeFilter) continue
      addEntry(job.scheduledDate, { kind: 'job', data: job })
    }

    return map
  },
}))
