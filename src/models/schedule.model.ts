import { z } from 'zod'
import type { Job } from '@/models/job.model'

export const JOB_COLOR = '#3b82f6'

export type ScheduleEventType = 'day_off' | 'vacation' | 'training' | 'medical_leave'

export interface ScheduleEvent {
  id: string
  type: ScheduleEventType
  employeeIds: string[]
  employeeNames: string[]
  startDate: string   // YYYY-MM-DD
  endDate: string     // YYYY-MM-DD
  notes?: string
  createdAt: string
  updatedAt: string
}

export type CalendarEntry =
  | { kind: 'job'; data: Job }
  | { kind: 'event'; data: ScheduleEvent }

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

export type ScheduleEventFormData = z.infer<typeof scheduleEventSchema>

export const EVENT_TYPE_LABELS: Record<ScheduleEventType, string> = {
  day_off: 'Folga',
  vacation: 'Férias',
  training: 'Treinamento',
  medical_leave: 'Afastamento médico',
}

export const EVENT_TYPE_COLORS: Record<ScheduleEventType, string> = {
  day_off: '#f87171',
  vacation: '#fb923c',
  training: '#a78bfa',
  medical_leave: '#94a3b8',
}
