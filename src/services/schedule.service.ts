import api from '@/services/api'
import type { CalendarJob, ScheduleEvent, ScheduleEventFormData } from '@/models/schedule.model'

/**
 * Sub-plano 06, passo 1: `GET /jobs/calendar?from=&to=` — agenda somente
 * leitura, todas as OS (não canceladas) de todos os colaboradores no
 * intervalo. Sem paginação; o backend limita o intervalo a 62 dias.
 */
export const fetchCalendarJobs = async (from: string, to: string): Promise<CalendarJob[]> => {
  const { data } = await api.get<CalendarJob[]>('/jobs/calendar', { params: { from, to } })
  return data
}

export const fetchScheduleEvents = async (month?: string): Promise<ScheduleEvent[]> => {
  const params: Record<string, string> = {}
  if (month) params.month = month
  const { data } = await api.get<ScheduleEvent[]>('/schedule-events', { params })
  return data
}

export const fetchScheduleEventById = async (id: string): Promise<ScheduleEvent> => {
  const { data } = await api.get<ScheduleEvent>(`/schedule-events/${id}`)
  return data
}

export const createScheduleEvent = async (
  data: ScheduleEventFormData & { employeeNames: string[] }
): Promise<ScheduleEvent> => {
  const { type, employeeIds, startDate, endDate, notes } = data
  const { data: event } = await api.post<ScheduleEvent>('/schedule-events', {
    type,
    employeeIds,
    startDate,
    endDate,
    notes,
  })
  return event
}

export const cancelScheduleEvent = async (id: string): Promise<void> => {
  await api.patch(`/schedule-events/${id}/cancel`)
}
