import { z } from 'zod'

export type EvidenceType = 'image' | 'pdf' | 'video' | 'audio'

const ALLOWED_TYPES: Record<EvidenceType, string[]> = {
  image: ['image/jpeg', 'image/png'],
  pdf: ['application/pdf'],
  video: ['video/mp4'],
  audio: ['audio/mpeg', 'audio/mp3'],
}

export const ALLOWED_MIME_TYPES = Object.values(ALLOWED_TYPES).flat()

export interface Evidence {
  id: string
  reportId: string
  url: string
  mimeType: string
  fileName: string
  type: EvidenceType
}

export interface JobReport {
  id: string
  jobId: string
  content: string       // HTML from TipTap
  employeeId: string
  submittedAt: string
  evidences?: Evidence[]
}

export function getEvidenceType(mimeType: string): EvidenceType | null {
  for (const [type, mimes] of Object.entries(ALLOWED_TYPES)) {
    if (mimes.includes(mimeType)) return type as EvidenceType
  }
  return null
}

export const jobReportSchema = z.object({
  content: z.string().min(1, 'O relatório não pode estar vazio'),
})

export type JobReportFormData = z.infer<typeof jobReportSchema>

// ---- PDF helper ----

export interface PdfData {
  jobId: string
  scheduledDate: string
  employeeName: string
  machineName: string
  city: string
  state: string
  jobType: string
  reportContent: string
  evidences: { fileName: string; url: string; type: EvidenceType }[]
  submittedAt: string
}

export function buildPdfData(params: {
  report: JobReport
  scheduledDate: string
  employeeName: string
  machineName: string
  city: string
  state: string
  jobType: string
}): PdfData {
  return {
    jobId: params.report.jobId,
    scheduledDate: params.scheduledDate,
    employeeName: params.employeeName,
    machineName: params.machineName,
    city: params.city,
    state: params.state,
    jobType: params.jobType,
    reportContent: params.report.content,
    evidences: (params.report.evidences ?? []).map((e) => ({
      fileName: e.fileName,
      url: e.url,
      type: e.type,
    })),
    submittedAt: params.report.submittedAt,
  }
}
