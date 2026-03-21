import { z } from 'zod'

export type ContractStatus = 'active' | 'expiring' | 'expired'

export interface Contract {
  id: string
  clientName: string
  clientCnpj: string
  description: string
  startDate: string
  endDate: string
  fileUrl?: string
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

function isValidCNPJ(cnpj: string): boolean {
  const s = cnpj.replace(/[^\d]/g, '')
  if (s.length !== 14 || /^(\d)\1+$/.test(s)) return false
  const calc = (n: number) => {
    let sum = 0
    let pos = n - 7
    for (let i = n; i >= 1; i--) {
      sum += parseInt(s[n - i]) * pos--
      if (pos < 2) pos = 9
    }
    const rem = sum % 11
    return rem < 2 ? 0 : 11 - rem
  }
  return calc(12) === parseInt(s[12]) && calc(13) === parseInt(s[13])
}

export const contractSchema = z
  .object({
    clientName: z.string().min(2, 'Nome do cliente é obrigatório'),
    clientCnpj: z
      .string()
      .min(1, 'CNPJ é obrigatório')
      .refine(isValidCNPJ, { message: 'CNPJ inválido' }),
    description: z.string().min(1, 'Descrição é obrigatória'),
    startDate: z.string().min(1, 'Data de início é obrigatória'),
    endDate: z.string().min(1, 'Data de término é obrigatória'),
    fileUrl: z.string().optional(),
  })
  .refine((d) => new Date(d.endDate) >= new Date(d.startDate), {
    message: 'Data de término deve ser após a data de início',
    path: ['endDate'],
  })

export type ContractFormData = z.infer<typeof contractSchema>
