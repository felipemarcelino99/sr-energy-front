import { z } from 'zod'

export interface SalaryAdjustment {
  id: string
  employeeId: string
  previousSalary: number
  newSalary: number
  reason: string
  adjustedAt: string
}

export const salaryAdjustmentSchema = z.object({
  newSalary: z.coerce.number().positive('Salário deve ser positivo'),
  reason: z.string().min(5, 'Motivo deve ter ao menos 5 caracteres'),
})

export type SalaryAdjustmentFormData = z.infer<typeof salaryAdjustmentSchema>
