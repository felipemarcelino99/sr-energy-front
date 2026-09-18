import api from '@/services/api'
import type { Job, JobFormData } from '@/models/job.model'

export async function fetchJobs(): Promise<Job[]> {
  const { data } = await api.get<Job[]>('/jobs')
  return data
}

export async function fetchJob(id: string): Promise<Job> {
  const { data } = await api.get<Job>(`/jobs/${id}`)
  return data
}

export async function createJob(formData: JobFormData): Promise<Job> {
  const { data } = await api.post<Job>('/jobs', formData)
  return data
}

export async function updateJob(id: string, formData: Partial<JobFormData>): Promise<Job> {
  const { data } = await api.put<Job>(`/jobs/${id}`, formData)
  return data
}

export async function cancelJob(id: string): Promise<Job> {
  const { data } = await api.patch<Job>(`/jobs/${id}/cancel`)
  return data
}

/**
 * Sub-plano 04, item 5: transição `scheduled|pending` → `in_progress`.
 * Permitido a admin/manager e a qualquer colaborador vinculado à OS (ver
 * `PATCH /jobs/:id/start` no backend). 409 se a OS não estiver num status
 * que permita iniciar.
 */
export async function startJob(id: string): Promise<Job> {
  const { data } = await api.patch<Job>(`/jobs/${id}/start`)
  return data
}

export async function fetchJobsByMachine(machineId: string): Promise<Job[]> {
  const { data } = await api.get<Job[]>(`/jobs?machineId=${machineId}`)
  return data
}
