import api from '@/services/api'
import type { JobChecklistItem } from '@/models/tool.model'

export async function fetchChecklist(
  jobId: string,
  phase?: 'pre_work' | 'pre_report',
): Promise<JobChecklistItem[]> {
  const params: Record<string, string> = {}
  if (phase) params.phase = phase
  const { data } = await api.get<JobChecklistItem[]>(`/jobs/${jobId}/checklist`, { params })
  return data
}

export async function updateChecklistItem(
  jobId: string,
  itemId: string,
  checked: boolean,
): Promise<JobChecklistItem> {
  const { data } = await api.patch<JobChecklistItem>(`/jobs/${jobId}/checklist/${itemId}`, { checked })
  return data
}

export async function duplicateChecklistForReport(jobId: string): Promise<JobChecklistItem[]> {
  const { data } = await api.post<JobChecklistItem[]>(`/jobs/${jobId}/checklist/duplicate`)
  return data
}
