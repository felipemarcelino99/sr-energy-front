import api from '@/services/api'
import type { Contract, ContractFormData } from '@/models/contract.model'
import type { Job } from '@/models/job.model'

export interface AcceptContractResponse {
  contract: Contract
  job: Job & { number?: string }
}

export async function fetchContracts(): Promise<Contract[]> {
  const { data } = await api.get<Contract[]>('/contracts')
  return data
}

export async function fetchContract(id: string): Promise<Contract> {
  const { data } = await api.get<Contract>(`/contracts/${id}`)
  return data
}

export async function createContract(formData: ContractFormData): Promise<Contract> {
  const { data } = await api.post<Contract>('/contracts', formData)
  return data
}

export async function updateContract(
  id: string,
  formData: Partial<ContractFormData>
): Promise<Contract> {
  const { data } = await api.put<Contract>(`/contracts/${id}`, formData)
  return data
}

export async function removeContract(id: string): Promise<void> {
  await api.delete(`/contracts/${id}`)
}

export async function acceptContract(id: string): Promise<AcceptContractResponse> {
  const { data } = await api.patch<AcceptContractResponse>(`/contracts/${id}/accept`)
  return data
}

export async function rejectContract(id: string): Promise<Contract> {
  const { data } = await api.patch<Contract>(`/contracts/${id}/reject`)
  return data
}

export async function fetchContractsByClient(clientId: string): Promise<Contract[]> {
  const { data } = await api.get<Contract[]>('/contracts', { params: { clientId } })
  return data
}

export async function uploadContractFile(id: string, file: File): Promise<string> {
  const form = new FormData()
  form.append('file', file)
  const { data } = await api.post<{ url: string }>(`/contracts/${id}/file`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data.url
}
