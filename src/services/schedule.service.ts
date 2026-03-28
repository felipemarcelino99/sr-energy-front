import type { ScheduleEvent, ScheduleEventFormData } from '@/models/schedule.model'

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

let store: ScheduleEvent[] = [...MOCK_EVENTS]

export const fetchScheduleEvents = async (): Promise<ScheduleEvent[]> => {
  return [...store]
}

export const fetchScheduleEventById = async (id: string): Promise<ScheduleEvent> => {
  const event = store.find((e) => e.id === id)
  if (!event) throw new Error(`ScheduleEvent ${id} not found`)
  return { ...event }
}

export const createScheduleEvent = async (data: ScheduleEventFormData & { employeeNames: string[] }): Promise<ScheduleEvent> => {
  const event: ScheduleEvent = {
    ...data,
    id: `evt-${Date.now()}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
  store = [...store, event]
  return event
}
