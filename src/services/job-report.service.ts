import api from '@/services/api'
import type { JobReport, Evidence } from '@/models/job-report.model'

export async function submitReport(jobId: string, content: string): Promise<JobReport> {
  const { data } = await api.post<JobReport>(`/jobs/${jobId}/report`, { content })
  return data
}

export async function uploadEvidence(reportId: string, file: File): Promise<Evidence> {
  const form = new FormData()
  form.append('file', file)
  const { data } = await api.post<Evidence>(`/reports/${reportId}/evidences`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data
}

export async function fetchReport(jobId: string): Promise<JobReport> {
  const { data } = await api.get<JobReport>(`/jobs/${jobId}/report`)
  return data
}
