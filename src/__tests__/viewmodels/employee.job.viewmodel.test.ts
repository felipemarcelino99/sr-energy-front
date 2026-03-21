import { useJobStore } from '@/viewmodels/job.viewmodel'
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
  ...overrides,
})

beforeEach(() => {
  useJobStore.setState({ jobs: [], loading: false, error: null, filters: {} })
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
    await useJobStore.getState().load()
    useJobStore.setState({ filters: { employeeId: 'emp-1' } })
    const myJobs = useJobStore.getState().filtered()
    expect(myJobs).toHaveLength(2)
    expect(myJobs.every((j) => j.employeeId === 'emp-1')).toBe(true)
  })
})
