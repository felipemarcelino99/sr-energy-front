import api from '@/services/api'
import type { Proposal, ProposalFormData } from '@/models/proposal.model'
import type { Job } from '@/models/job.model'

export interface AcceptProposalResponse {
  proposal: Proposal
  job: Job & { number?: string }
}

export interface FetchProposalsFilters {
  /** Lista as PCs vinculadas a um Contrato específico (aba "Propostas" da tela de Contrato). */
  contractId?: string
}

export async function fetchProposals(filters?: FetchProposalsFilters): Promise<Proposal[]> {
  const { data } = await api.get<Proposal[]>('/proposals', {
    params: filters?.contractId ? { contractId: filters.contractId } : undefined,
  })
  return data
}

export async function fetchProposal(id: string): Promise<Proposal> {
  const { data } = await api.get<Proposal>(`/proposals/${id}`)
  return data
}

export async function createProposal(formData: ProposalFormData): Promise<Proposal> {
  const { data } = await api.post<Proposal>('/proposals', formData)
  return data
}

export async function updateProposal(
  id: string,
  formData: Partial<ProposalFormData>
): Promise<Proposal> {
  const { data } = await api.put<Proposal>(`/proposals/${id}`, formData)
  return data
}

export async function acceptProposal(id: string): Promise<AcceptProposalResponse> {
  const { data } = await api.patch<AcceptProposalResponse>(`/proposals/${id}/accept`)
  return data
}

export async function rejectProposal(id: string): Promise<Proposal> {
  const { data } = await api.patch<Proposal>(`/proposals/${id}/reject`)
  return data
}
