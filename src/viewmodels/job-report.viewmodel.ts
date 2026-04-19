import { create } from 'zustand'
import type { JobReport } from '@/models/job-report.model'
import { submitReport, uploadEvidence, updateReport } from '@/services/job-report.service'

interface JobReportState {
  report: JobReport | null
  loading: boolean
  error: string | null
  submitted: boolean

  submit: (jobId: string, content: string, evidenceFiles: File[]) => Promise<void>
  update: (jobId: string, content: string) => Promise<void>
  reset: () => void
}

export const useJobReportStore = create<JobReportState>((set) => ({
  report: null,
  loading: false,
  error: null,
  submitted: false,

  submit: async (jobId, content, evidenceFiles) => {
    set({ loading: true, error: null })
    try {
      const report = await submitReport(jobId, content)
      // Upload evidences sequentially
      for (const file of evidenceFiles) {
        await uploadEvidence(report.id, file)
      }
      set({ report, submitted: true, loading: false })
    } catch (err) {
      set({ error: (err as Error).message, loading: false })
    }
  },

  update: async (jobId, content) => {
    set({ loading: true, error: null })
    try {
      const report = await updateReport(jobId, content)
      set({ report, loading: false })
    } catch (err) {
      set({ error: (err as Error).message, loading: false })
    }
  },

  reset: () => set({ report: null, loading: false, error: null, submitted: false }),
}))
