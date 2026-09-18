import { z } from 'zod'
import { Briefcase, Coffee, GraduationCap, HeartPulse, Palmtree } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { JobStatus, JobType } from '@/models/job.model'

export const JOB_COLOR = '#3b82f6'

export type ScheduleEventType = 'day_off' | 'vacation' | 'training' | 'medical_leave'

export interface ScheduleEvent {
  id: string
  type: ScheduleEventType
  employeeIds: string[]
  employeeNames: string[]
  startDate: string // YYYY-MM-DD
  endDate: string // YYYY-MM-DD
  notes?: string
  createdAt: string
  updatedAt: string
}

/**
 * Colaborador embutido em `CalendarJob`, como devolvido por `GET
 * /jobs/calendar` (sub-plano 06). Só os campos de identificação visual —
 * nada de e-mail/telefone/salário (isso é o `Employee` completo, de
 * `employee.model.ts`, usado no cadastro).
 */
export interface CalendarJobEmployee {
  id: string
  name: string
  color: string | null
  photoUrl: string | null
}

/**
 * Entrada de OS no calendário, como devolvida por `GET /jobs/calendar`
 * (sub-plano 02, item 3 no backend). Deliberadamente mais enxuta que `Job`
 * (`job.model.ts`): sem valores financeiros nem dados de contato do
 * cliente — só o necessário para desenhar a agenda. `employees[0]` é a
 * fonte única de verdade para o nome E a cor exibidos no chip/legenda
 * (decisão do passo 2: nunca misturar `employeeName` de uma fonte com a
 * cor de outra).
 */
export interface CalendarJob {
  id: string
  number: string | null
  status: JobStatus
  jobType: JobType
  scheduledDate: string
  scheduledEndDate: string | null
  startTime: string
  endTime: string
  city: string
  state: string
  clientName: string | null
  employees: CalendarJobEmployee[]
}

export type CalendarEntry =
  | { kind: 'job'; data: CalendarJob }
  | { kind: 'event'; data: ScheduleEvent }

export type CalendarView = 'day' | 'week' | 'month'

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

export const EVENT_TYPE_LABELS: Record<ScheduleEventType, string> = {
  day_off: 'Folga',
  vacation: 'Férias',
  training: 'Treinamento',
  medical_leave: 'Afastamento médico',
}

/**
 * Feedback do usuário (calendário — set/2026): os chips/legenda passam a
 * usar SEMPRE a cor do funcionário, para qualquer tipo de entrada (OS ou
 * evento) — cor deixou de identificar o tipo. `EVENT_TYPE_ICONS`/`JOB_ICON`
 * assumem esse papel (o quê), enquanto a cor segue identificando quem (o
 * funcionário). `EVENT_TYPE_COLORS` fica só para telas fora do calendário
 * denso (ex.: `ScheduleEventDetailPage`, onde a cor de tipo ainda é clara —
 * um badge isolado, sem concorrer com identificação de pessoa).
 */
export const EVENT_TYPE_COLORS: Record<ScheduleEventType, string> = {
  day_off: '#f87171',
  vacation: '#fb923c',
  training: '#a78bfa',
  medical_leave: '#94a3b8',
}

export const EVENT_TYPE_ICONS: Record<ScheduleEventType, LucideIcon> = {
  day_off: Coffee,
  vacation: Palmtree,
  training: GraduationCap,
  medical_leave: HeartPulse,
}

export const JOB_ICON: LucideIcon = Briefcase
