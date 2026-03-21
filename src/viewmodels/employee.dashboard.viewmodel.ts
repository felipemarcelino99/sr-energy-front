import { create } from 'zustand'
import type { JobSummary, JobStatusSummary } from '@/models/dashboard.model'
import { groupJobsByStatus, getNextJob } from '@/models/dashboard.model'
import { fetchJobs } from '@/services/dashboard.service'

interface EmployeeDashboardState {
  jobs: JobSummary[]
  loading: boolean
  error: string | null
  loadMyJobs: (employeeId: string) => Promise<void>
  myJobsByStatus: () => JobStatusSummary[]
  nextJob: () => JobSummary | null
}

export const useEmployeeDashboardStore = create<EmployeeDashboardState>((set, get) => ({
  jobs: [],
  loading: false,
  error: null,

  loadMyJobs: async (employeeId) => {
    set({ loading: true, error: null })
    try {
      const allJobs = await fetchJobs()
      const myJobs = allJobs.filter((j) => j.employeeId === employeeId)
      set({ jobs: myJobs, loading: false })
    } catch (err) {
      set({ error: (err as Error).message, loading: false })
    }
  },

  myJobsByStatus: () => groupJobsByStatus(get().jobs),

  nextJob: () => getNextJob(get().jobs),
}))
