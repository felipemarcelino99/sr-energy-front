import api from '@/services/api'
import type { JobChecklistItem } from '@/models/tool.model'

function normalizeItem(raw: any): JobChecklistItem {
  return { ...raw, tool: raw.tools ?? raw.tool, tools: undefined }
}

export async function fetchChecklist(
  jobId: string,
  phase?: 'pre_work' | 'pre_report',
): Promise<JobChecklistItem[]> {
  const params: Record<string, string> = {}
  if (phase) params.phase = phase
  const { data } = await api.get<any[]>(`/jobs/${jobId}/checklist`, { params })
  return data.map(normalizeItem)
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
