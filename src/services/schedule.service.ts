import api from '@/services/api'
import type { ScheduleEvent, ScheduleEventFormData } from '@/models/schedule.model'

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
  data: ScheduleEventFormData & { employeeNames: string[] },
): Promise<ScheduleEvent> => {
  const { employeeNames: _names, ...payload } = data
  const { data: event } = await api.post<ScheduleEvent>('/schedule-events', payload)
  return event
}

export const cancelScheduleEvent = async (id: string): Promise<void> => {
  await api.patch(`/schedule-events/${id}/cancel`)
}
