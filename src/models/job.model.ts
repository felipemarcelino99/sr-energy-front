import { z } from 'zod'

export type JobType = 'maintenance' | 'implementation'
export type JobStatus = 'scheduled' | 'pending' | 'in_progress' | 'completed' | 'cancelled'

export interface Job {
  id: string
  /**
   * Código da OS. Mesmo conceito/valor do `number` do contrato (PC) que a
   * originou — formato `AAXXX`, gerado pelo banco. Renomeado de `osCode`
   * para `number` para ficar consistente com o payload do backend
   * (`PATCH /contracts/:id/accept` e `GET /jobs`).
   */
  number?: string
  employeeId: string
  employeeName: string
  machineId: string
  machineName: string
  jobType: JobType
  status: JobStatus
  description: string
  scheduledDate: string
  city: string
  state: string
  address?: string
  accommodation: boolean
  car: boolean
  startTime: string
  endTime: string
  carPickupTime?: string
  carReturnTime?: string
  carPickupAddress?: string
  notes?: string
  reportId?: string
  createdAt: string
  updatedAt: string

  // ---- Extended fields (item 12 — formulário estendido de OS) ----
  /** Fonte de verdade de colaboradores no formulário novo (substitui job_employees por completo no PUT). */
  employeeIds: string[]
  /** PC de origem, quando a OS foi criada a partir de um contrato aceito. */
  contractId?: string
  scopeDetail?: string
  bagId?: string
  serviceAddress?: string
  clientContactName?: string
  clientContactPhone?: string
}

// ---- Stepper schemas (one per step) ----

export const jobStep1Schema = z.object({
  employeeId: z.string().min(1, 'Funcionário é obrigatório'),
  scheduledDate: z.string().min(1, 'Data é obrigatória'),
  employeeIds: z.array(z.string()).optional(),
})

export const jobStep2Schema = z.object({
  city: z.string().min(1, 'Cidade é obrigatória'),
  state: z.string().min(2, 'Estado é obrigatório').max(2, 'Use a sigla do estado (ex: SP)'),
  address: z.string().optional(),
  accommodation: z.boolean(),
  car: z.boolean(),
  startTime: z.string().min(1, 'Horário de início é obrigatório'),
  endTime: z.string().min(1, 'Horário de término é obrigatório'),
  carPickupTime: z.string().optional(),
  carReturnTime: z.string().optional(),
  carPickupAddress: z.string().optional(),
  serviceAddress: z.string().optional(),
  clientContactName: z.string().optional(),
  clientContactPhone: z.string().optional(),
})

export const jobStep3Schema = z.object({
  machineId: z.string().min(1, 'Máquina é obrigatória'),
  jobType: z.enum(['maintenance', 'implementation']),
  description: z.string().min(1, 'Descrição é obrigatória'),
  notes: z.string().optional(),
  contractId: z.string().optional(),
  scopeDetail: z.string().optional(),
  bagId: z.string().optional(),
})

export const jobSchema = jobStep1Schema.merge(jobStep2Schema).merge(jobStep3Schema)

export type JobStep1Data = z.infer<typeof jobStep1Schema>
export type JobStep2Data = z.infer<typeof jobStep2Schema>
export type JobStep3Data = z.infer<typeof jobStep3Schema>
export type JobFormData = z.infer<typeof jobSchema>

export interface JobDetail extends Job {
  machine: { name: string; manualUrl?: string }
  clientName?: string
}

// ---- Status display (centralized — single source of truth for label/badge color) ----

export const JOB_STATUS_LABEL: Record<JobStatus, string> = {
  pending: 'Pendente',
  scheduled: 'Agendado',
  in_progress: 'Em andamento',
  completed: 'Concluído',
  cancelled: 'Cancelado',
}

export const JOB_STATUS_BADGE_CLASS: Record<JobStatus, string> = {
  pending: 'badge-neutral',
  scheduled: 'badge-warning',
  in_progress: 'badge-info',
  completed: 'badge-success',
  cancelled: 'badge-error badge-outline',
}
