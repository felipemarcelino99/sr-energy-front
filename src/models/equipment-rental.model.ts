import { z } from 'zod'

export interface EquipmentRental {
  id: string
  contractId: string
  contractClientName?: string
  bagId: string
  bagName?: string
  startDate: string
  endDate: string
  value: number
  createdAt: string
  updatedAt: string
}

export const equipmentRentalSchema = z
  .object({
    contractId: z.string().min(1, 'Contrato é obrigatório'),
    bagId: z.string().min(1, 'Mala é obrigatória'),
    startDate: z.string().min(1, 'Data de início é obrigatória'),
    endDate: z.string().min(1, 'Data de fim é obrigatória'),
    value: z.coerce.number().min(0, 'Valor não pode ser negativo'),
  })
  .refine((d) => new Date(d.endDate) >= new Date(d.startDate), {
    message: 'Data de fim deve ser após a data de início',
    path: ['endDate'],
  })

export type EquipmentRentalFormData = z.infer<typeof equipmentRentalSchema>
