import { z } from 'zod'
import { isValidCNPJ } from '@/utils/cnpj'

export type ContractStatus = 'active' | 'expiring' | 'expired'
export type ContractType = 'service' | 'rental'

export interface Contract {
  id: string
  clientId: string
  client?: { id: string; razaoSocial: string; cnpj: string }
  description: string
  startDate: string
  endDate: string
  fileUrl?: string
  recurring: boolean
  contractType: ContractType
  contractValue: number
  createdAt: string
  updatedAt: string
}

export function getContractStatus(endDate: string, today = new Date()): ContractStatus {
  const end = new Date(endDate)
  const diffMs = end.getTime() - today.getTime()
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays < 0) return 'expired'
  if (diffDays <= 30) return 'expiring'
  return 'active'
}

export const contractSchema = z
  .object({
    clientId: z.string().min(1, 'Cliente é obrigatório'),
    description: z.string().min(1, 'Descrição é obrigatória'),
    startDate: z.string().min(1, 'Data de início é obrigatória'),
    endDate: z.string().min(1, 'Data de término é obrigatória'),
    fileUrl: z.string().optional(),
    recurring: z.boolean().default(false),
    contractType: z.enum(['service', 'rental']),
    contractValue: z.number().min(0, 'Valor não pode ser negativo'),
  })
  .refine((d) => new Date(d.endDate) >= new Date(d.startDate), {
    message: 'Data de término deve ser após a data de início',
    path: ['endDate'],
  })

export type ContractFormData = z.infer<typeof contractSchema>
