import api from '@/services/api'
import type { Proposal, ProposalFormData } from '@/models/proposal.model'
import type { Contract } from '@/models/contract.model'
import type { Job } from '@/models/job.model'

export interface AcceptProposalResponse {
  proposal: Proposal
  contract: Contract
  job: Job & { number?: string }
}

export async function fetchProposals(): Promise<Proposal[]> {
  const { data } = await api.get<Proposal[]>('/proposals')
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
