import api from '@/services/api'
import type { Machine, MachineFormData, MachineJob } from '@/models/machine.model'

export async function fetchMachines(): Promise<Machine[]> {
  const { data } = await api.get<Machine[]>('/machines')
  return data
}

export async function fetchMachine(id: string): Promise<Machine> {
  const { data } = await api.get<Machine>(`/machines/${id}`)
  return data
}

export async function createMachine(formData: MachineFormData): Promise<Machine> {
  const { data } = await api.post<Machine>('/machines', formData)
  return data
}

export async function updateMachine(id: string, formData: Partial<MachineFormData>): Promise<Machine> {
  const { data } = await api.put<Machine>(`/machines/${id}`, formData)
  return data
}

export async function removeMachine(id: string): Promise<void> {
  await api.delete(`/machines/${id}`)
}

export async function fetchMachineJobs(id: string): Promise<MachineJob[]> {
  const { data } = await api.get<MachineJob[]>(`/machines/${id}/jobs`)
  return data
}

export async function uploadMachineManual(id: string, file: File): Promise<string> {
  const form = new FormData()
  form.append('file', file)
  const { data } = await api.post<{ url: string }>(`/machines/${id}/manual`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data.url
}
