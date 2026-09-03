import { useEmployeeDashboardStore } from '@/viewmodels/employee.dashboard.viewmodel'
import type { JobSummary } from '@/models/dashboard.model'

jest.mock('@/services/dashboard.service', () => ({
  fetchJobs: jest.fn(),
}))

import * as dashboardService from '@/services/dashboard.service'

const makeJob = (overrides: Partial<JobSummary> = {}): JobSummary => ({
  id: '1',
  title: 'OS Teste',
  status: 'scheduled',
  employeeId: 'emp-1',
  employeeName: 'Fulano',
  scheduledAt: '2027-01-01',
  ...overrides,
})

beforeEach(() => {
  useEmployeeDashboardStore.setState({ jobs: [], loading: false, error: null })
  jest.clearAllMocks()
})

describe('employee.dashboard.viewmodel — loadMyJobs', () => {
  it('carrega e filtra só os jobs do employeeId informado', async () => {
    const jobs = [
      makeJob({ id: '1', employeeId: 'emp-1' }),
      makeJob({ id: '2', employeeId: 'emp-2' }),
    ]
    ;(dashboardService.fetchJobs as jest.Mock).mockResolvedValue(jobs)
    await useEmployeeDashboardStore.getState().loadMyJobs('emp-1')
    expect(useEmployeeDashboardStore.getState().jobs).toHaveLength(1)
    expect(useEmployeeDashboardStore.getState().jobs[0].id).toBe('1')
    expect(useEmployeeDashboardStore.getState().loading).toBe(false)
  })

  it('define erro quando a requisição falha', async () => {
    ;(dashboardService.fetchJobs as jest.Mock).mockRejectedValue(new Error('Falha de rede'))
    await useEmployeeDashboardStore.getState().loadMyJobs('emp-1')
    expect(useEmployeeDashboardStore.getState().error).toBe('Falha de rede')
    expect(useEmployeeDashboardStore.getState().loading).toBe(false)
  })
})

describe('employee.dashboard.viewmodel — myJobsByStatus/nextJob', () => {
  it('agrupa os jobs por status', () => {
    useEmployeeDashboardStore.setState({
      jobs: [makeJob({ id: '1', status: 'scheduled' }), makeJob({ id: '2', status: 'completed' })],
    })
    const summary = useEmployeeDashboardStore.getState().myJobsByStatus()
    expect(summary.length).toBeGreaterThan(0)
  })

  it('retorna null quando não há jobs', () => {
    useEmployeeDashboardStore.setState({ jobs: [] })
    expect(useEmployeeDashboardStore.getState().nextJob()).toBeNull()
  })
})
