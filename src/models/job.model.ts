import { z } from 'zod'

export type JobType = 'maintenance' | 'implementation'
export type JobStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled'

export interface Job {
  id: string
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
  accommodation: boolean
  car: boolean
  startTime: string
  endTime: string
  notes?: string
  reportId?: string
  createdAt: string
  updatedAt: string
}

// ---- Stepper schemas (one per step) ----

export const jobStep1Schema = z.object({
  employeeId: z.string().min(1, 'Funcionário é obrigatório'),
  scheduledDate: z.string().min(1, 'Data é obrigatória'),
})

export const jobStep2Schema = z.object({
  city: z.string().min(1, 'Cidade é obrigatória'),
  state: z.string().min(2, 'Estado é obrigatório').max(2, 'Use a sigla do estado (ex: SP)'),
  accommodation: z.boolean(),
  car: z.boolean(),
  startTime: z.string().min(1, 'Horário de início é obrigatório'),
  endTime: z.string().min(1, 'Horário de término é obrigatório'),
})

export const jobStep3Schema = z.object({
  machineId: z.string().min(1, 'Máquina é obrigatória'),
  jobType: z.enum(['maintenance', 'implementation']),
  description: z.string().min(1, 'Descrição é obrigatória'),
  notes: z.string().optional(),
})

export const jobSchema = jobStep1Schema.merge(jobStep2Schema).merge(jobStep3Schema)

export type JobStep1Data = z.infer<typeof jobStep1Schema>
export type JobStep2Data = z.infer<typeof jobStep2Schema>
export type JobStep3Data = z.infer<typeof jobStep3Schema>
export type JobFormData = z.infer<typeof jobSchema>

export interface JobDetail extends Job {
  machine: { name: string; manualUrl?: string }
}
