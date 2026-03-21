import { create } from 'zustand'
import type { Job, JobFormData, JobStatus } from '@/models/job.model'
import { fetchJobs, createJob, updateJob, cancelJob } from '@/services/job.service'

interface JobFilters {
  status?: JobStatus
  employeeId?: string
  date?: string
  jobType?: string
}

interface JobState {
  jobs: Job[]
  loading: boolean
  error: string | null
  filters: JobFilters

  load: () => Promise<void>
  create: (data: JobFormData) => Promise<void>
  update: (id: string, data: Partial<JobFormData>) => Promise<void>
  cancel: (id: string) => Promise<void>
  setFilters: (filters: JobFilters) => void
  filtered: () => Job[]
}

export const useJobStore = create<JobState>((set, get) => ({
  jobs: [],
  loading: false,
  error: null,
  filters: {},

  load: async () => {
    set({ loading: true, error: null })
    try {
      const jobs = await fetchJobs()
      set({ jobs, loading: false })
    } catch (err) {
      set({ error: (err as Error).message, loading: false })
    }
  },

  create: async (data) => {
    const job = await createJob(data)
    set((s) => ({ jobs: [...s.jobs, job] }))
  },

  update: async (id, data) => {
    const updated = await updateJob(id, data)
    set((s) => ({
      jobs: s.jobs.map((j) => (j.id === id ? updated : j)),
    }))
  },

  cancel: async (id) => {
    const updated = await cancelJob(id)
    set((s) => ({
      jobs: s.jobs.map((j) => (j.id === id ? updated : j)),
    }))
  },

  setFilters: (filters) => set({ filters }),

  filtered: () => {
    const { jobs, filters } = get()
    return jobs.filter((j) => {
      if (filters.status && j.status !== filters.status) return false
      if (filters.employeeId && j.employeeId !== filters.employeeId) return false
      if (filters.date && j.scheduledDate !== filters.date) return false
      if (filters.jobType && j.jobType !== filters.jobType) return false
      return true
    })
  },
}))
