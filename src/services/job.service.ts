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
