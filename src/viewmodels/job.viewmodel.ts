import { create } from 'zustand'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { Job, JobFormData, JobStatus } from '@/models/job.model'
import { fetchJobs, createJob, updateJob, cancelJob } from '@/services/job.service'

const STATUS_ORDER: Record<string, number> = {
  scheduled: 0,
  in_progress: 1,
  completed: 2,
  cancelled: 3,
}

export interface JobFilters {
  status?: JobStatus
  employeeId?: string
  date?: string
  jobType?: string
  search?: string
}

export const jobsQueryKey = ['jobs'] as const

const EMPTY_JOBS: Job[] = []

/** Pure filter/sort logic — kept outside the hook so it's trivially testable. */
export function filterAndSortJobs(jobs: Job[], filters: JobFilters): Job[] {
  const q = filters.search?.toLowerCase()
  return jobs
    .filter((j) => {
      if (filters.status && j.status !== filters.status) return false
      if (filters.employeeId && j.employeeId !== filters.employeeId) return false
      if (filters.date && j.scheduledDate !== filters.date) return false
      if (filters.jobType && j.jobType !== filters.jobType) return false
      if (q) {
        const haystack = [j.employeeName, j.machineName, j.description, j.city, j.number]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
        if (!haystack.includes(q)) return false
      }
      return true
    })
    .sort((a, b) => {
      const statusDiff = (STATUS_ORDER[a.status] ?? 99) - (STATUS_ORDER[b.status] ?? 99)
      if (statusDiff !== 0) return statusDiff
      return b.scheduledDate.localeCompare(a.scheduledDate)
    })
}

// ---- UI-only state (filters) — kept in Zustand ----

interface JobFiltersState {
  filters: JobFilters
  setFilters: (filters: JobFilters) => void
}

export const useJobFiltersStore = create<JobFiltersState>((set) => ({
  filters: {},
  setFilters: (filters) => set({ filters }),
}))

/**
 * Server state (job list + mutations) via TanStack Query, combined with the
 * UI-only filters store. Public shape kept stable so consumers/tests that
 * mock this hook wholesale don't need to change.
 */
export function useJobStore() {
  const { filters, setFilters } = useJobFiltersStore()
  const queryClient = useQueryClient()

  const jobsQuery = useQuery({ queryKey: jobsQueryKey, queryFn: fetchJobs })
  const jobs = jobsQuery.data ?? EMPTY_JOBS

  const invalidate = () => queryClient.invalidateQueries({ queryKey: jobsQueryKey })

  const createMutation = useMutation({
    mutationFn: (data: JobFormData) => createJob(data),
    onSuccess: invalidate,
  })
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<JobFormData> }) => updateJob(id, data),
    onSuccess: invalidate,
  })
  const cancelMutation = useMutation({
    mutationFn: (id: string) => cancelJob(id),
    onSuccess: invalidate,
  })

  return {
    jobs,
    loading: jobsQuery.isLoading,
    error: jobsQuery.isError ? (jobsQuery.error as Error).message : null,
    filters,
    setFilters,

    load: async () => {
      await jobsQuery.refetch()
    },
    create: async (data: JobFormData) => {
      await createMutation.mutateAsync(data)
    },
    update: async (id: string, data: Partial<JobFormData>) => {
      await updateMutation.mutateAsync({ id, data })
    },
    cancel: async (id: string) => {
      await cancelMutation.mutateAsync(id)
    },
    filtered: () => filterAndSortJobs(jobs, filters),
  }
}
