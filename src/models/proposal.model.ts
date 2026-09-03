import { z } from 'zod'
import type { ContractType } from '@/models/contract.model'
import type { JobStatus } from '@/models/job.model'

export type ProposalStatus = 'pending' | 'accepted' | 'rejected'

export interface Proposal {
  id: string
  number: string
  clientId: string
  /** Embed name matches backend's `clients` key (same pattern already used by /contracts). */
  clients?: { id: string; razaoSocial: string; cnpj: string }
  description: string
  contractType: ContractType
  contractValue: number
  recurring: boolean
  startDate: string
  endDate: string
  fileUrl?: string
  status: ProposalStatus
  contractId: string | null
  jobId: string | null
  createdAt: string
  updatedAt: string
  /** Resumo do Contrato gerado ao aceitar a proposta. `undefined`/ausente para PC pendente/recusada. */
  contracts?: {
    id: string
    number: string
    contractValue: number | null
    startDate: string
    endDate: string
  } | null
  /** Resumo da OS gerada ao aceitar a proposta. `undefined`/ausente para PC pendente/recusada. */
  jobs?: {
    id: string
    number: string
    status: JobStatus
    scheduledDate: string
    scheduledEndDate?: string | null
    city: string
    state: string
    employees?: { name: string } | null
    machines?: { name: string } | null
  } | null
}

export const proposalSchema = z
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

export type ProposalFormData = z.infer<typeof proposalSchema>
