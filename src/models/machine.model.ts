import { z } from 'zod'

export interface Machine {
  id: string
  name: string
  brand: string
  model: string
  serialNumber: string
  year: number
  manualUrl?: string
  createdAt: string
  updatedAt: string
}

const currentYear = new Date().getFullYear()

export const machineSchema = z.object({
  name: z.string().min(2, 'Nome deve ter ao menos 2 caracteres'),
  brand: z.string().min(1, 'Marca é obrigatória'),
  model: z.string().min(1, 'Modelo é obrigatório'),
  serialNumber: z.string().min(1, 'Número de série é obrigatório'),
  year: z.coerce
    .number()
    .int('Ano deve ser inteiro')
    .min(1900, 'Ano inválido')
    .max(currentYear + 1, `Ano não pode ser maior que ${currentYear + 1}`),
  manualUrl: z.string().optional(),
})

export type MachineFormData = z.infer<typeof machineSchema>

export interface MachineJob {
  id: string
  employeeName: string
  scheduledDate: string
  city: string
  state: string
  jobType: 'maintenance' | 'implementation'
  status: string
}
