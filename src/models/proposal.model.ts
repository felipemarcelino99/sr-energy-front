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
  /** Opcional — uma PC pode ainda não ter uma data comprometida. */
  startDate?: string
  fileUrl?: string
  status: ProposalStatus
  /**
   * Vínculo opcional com um Contrato já existente (ex.: chamado avulso dentro
   * de uma locação recorrente). Sub-plano 01: não é mais criado/preenchido
   * automaticamente ao aceitar — só existe quando informado manualmente.
   */
  contractId: string | null
  jobId: string | null
  createdAt: string
  updatedAt: string
  /** Resumo do Contrato vinculado manualmente à proposta. `null`/ausente quando não há vínculo. */
  contracts?: {
    id: string
    number?: string
  } | null
  /** Resumo da OS gerada ao aceitar a proposta. `undefined`/ausente para PC pendente/recusada. */
  jobs?: {
    id: string
    number?: string
    status: JobStatus
    scheduledDate?: string
    scheduledEndDate?: string | null
    city?: string
    state?: string
    employees?: { name: string } | null
    machines?: { name: string } | null
  } | null
}

export const proposalSchema = z.object({
  clientId: z.string().min(1, 'Cliente é obrigatório'),
  description: z.string().min(1, 'Descrição é obrigatória'),
  startDate: z.string().optional(),
  fileUrl: z.string().optional(),
  recurring: z.boolean().default(false),
  contractType: z.enum(['service', 'rental']),
  contractValue: z.number().min(0, 'Valor não pode ser negativo'),
  /** Contrato existente ao qual esta PC pode, opcionalmente, ser vinculada. */
  contractId: z.string().optional(),
})

export type ProposalFormData = z.infer<typeof proposalSchema>
