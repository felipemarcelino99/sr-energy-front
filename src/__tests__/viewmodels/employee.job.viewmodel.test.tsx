import { renderHook, waitFor, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { useJobStore, useJobFiltersStore } from '@/viewmodels/job.viewmodel'
import type { Job } from '@/models/job.model'

jest.mock('@/services/job.service', () => ({
  fetchJobs: jest.fn(),
  createJob: jest.fn(),
  updateJob: jest.fn(),
  cancelJob: jest.fn(),
}))

import * as jobService from '@/services/job.service'

const makeJob = (overrides: Partial<Job> = {}): Job => ({
  id: '1',
  employeeId: 'emp-1',
  employeeName: 'Test Employee',
  machineId: 'mach-1',
  machineName: 'Test Machine',
  jobType: 'maintenance',
  status: 'pending',
  description: 'Revisão',
  scheduledDate: '2025-06-01',
  city: 'São Paulo',
  state: 'SP',
  accommodation: false,
  car: false,
  startTime: '08:00',
  endTime: '17:00',
  createdAt: '2025-01-01',
  updatedAt: '2025-01-01',
  employeeIds: ['emp-1'],
  ...overrides,
})

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  }
}

beforeEach(() => {
  useJobFiltersStore.setState({ filters: {} })
  jest.clearAllMocks()
})

describe('job.viewmodel — fetchMyJobs', () => {
  it('retorna apenas trabalhos do employeeId logado', async () => {
    const allJobs = [
      makeJob({ id: '1', employeeId: 'emp-1' }),
      makeJob({ id: '2', employeeId: 'emp-2' }),
      makeJob({ id: '3', employeeId: 'emp-1' }),
    ]
    ;(jobService.fetchJobs as jest.Mock).mockResolvedValue(allJobs)

    const { result } = renderHook(() => useJobStore(), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.jobs).toHaveLength(3))

    act(() => {
      result.current.setFilters({ employeeId: 'emp-1' })
    })

    await waitFor(() => expect(result.current.filtered()).toHaveLength(2))
    expect(result.current.filtered().every((j) => j.employeeId === 'emp-1')).toBe(true)
  })
})
