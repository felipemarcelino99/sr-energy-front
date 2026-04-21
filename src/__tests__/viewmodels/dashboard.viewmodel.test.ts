import { useDashboardStore } from '@/viewmodels/dashboard.viewmodel'
import { useEmployeeDashboardStore } from '@/viewmodels/employee.dashboard.viewmodel'
import type { Transaction, JobSummary, ExpiringContract } from '@/models/dashboard.model'

jest.mock('@/services/dashboard.service', () => ({
  fetchTransactions: jest.fn(),
  fetchJobs: jest.fn(),
  fetchExpiringContracts: jest.fn(),
}))

import * as dashboardService from '@/services/dashboard.service'

const mockTransactions: Transaction[] = [
  { id: '1', type: 'credit', amount: 10000, description: 'A', date: '2026-03-01' },
  { id: '2', type: 'debit', amount: 3000, description: 'B', date: '2026-03-05' },
]

const mockJobs: JobSummary[] = [
  { id: '1', title: 'Job A', status: 'pending', employeeId: 'e1', employeeName: 'Ana', scheduledAt: '2026-03-20' },
  { id: '2', title: 'Job B', status: 'completed', employeeId: 'e2', employeeName: 'Bob', scheduledAt: '2026-03-18' },
  { id: '3', title: 'Job C', status: 'pending', employeeId: 'e1', employeeName: 'Ana', scheduledAt: '2026-03-22' },
]

const mockContracts: ExpiringContract[] = [
  { id: '1', clientName: 'X', expiresAt: '2026-04-01', daysUntilExpiry: 12 },
  { id: '2', clientName: 'Y', expiresAt: '2026-05-01', daysUntilExpiry: 42 },
]

beforeEach(() => {
  useDashboardStore.setState({ transactions: [], jobs: [], expiringContracts: [], loading: false, error: null })
  jest.clearAllMocks()
})

describe('dashboard.viewmodel — loadDashboard', () => {
  it('carrega dados e popula o store', async () => {
    ;(dashboardService.fetchTransactions as jest.Mock).mockResolvedValue(mockTransactions)
    ;(dashboardService.fetchJobs as jest.Mock).mockResolvedValue(mockJobs)
    ;(dashboardService.fetchExpiringContracts as jest.Mock).mockResolvedValue(mockContracts)

    await useDashboardStore.getState().loadDashboard()

    const state = useDashboardStore.getState()
    expect(state.transactions).toHaveLength(2)
    expect(state.jobs).toHaveLength(3)
    expect(state.loading).toBe(false)
  })
})

describe('dashboard.viewmodel — computed selectors', () => {
  beforeEach(() => {
    useDashboardStore.setState({ transactions: mockTransactions, jobs: mockJobs, expiringContracts: mockContracts })
  })

  it('calcula saldo corretamente', () => {
    const { financialSummary } = useDashboardStore.getState()
    expect(financialSummary().balance).toBe(7000)
  })

  it('agrupa trabalhos por status corretamente', () => {
    const { jobStatusSummary } = useDashboardStore.getState()
    const summary = jobStatusSummary()
    const pending = summary.find((s) => s.status === 'pending')
    expect(pending?.count).toBe(2)
  })

  it('filtra contratos expirando nos próximos 30 dias', () => {
    const { contractsExpiringSoon } = useDashboardStore.getState()
    const result = contractsExpiringSoon()
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('1')
  })
})

describe('employee.dashboard.viewmodel — loadMyJobs', () => {
  beforeEach(() => {
    useEmployeeDashboardStore.setState({ jobs: [], loading: false, error: null })
    jest.clearAllMocks()
  })

  it('filtra trabalhos pelo employeeId do usuário logado', async () => {
    ;(dashboardService.fetchJobs as jest.Mock).mockResolvedValue(mockJobs)
    await useEmployeeDashboardStore.getState().loadMyJobs('e1')
    const { jobs } = useEmployeeDashboardStore.getState()
    expect(jobs).toHaveLength(2)
    expect(jobs.every((j) => j.employeeId === 'e1')).toBe(true)
  })

  it('retorna lista vazia quando o id passado não corresponde a nenhum trabalho', async () => {
    ;(dashboardService.fetchJobs as jest.Mock).mockResolvedValue(mockJobs)
    await useEmployeeDashboardStore.getState().loadMyJobs('auth-uuid-inexistente')
    const { jobs } = useEmployeeDashboardStore.getState()
    expect(jobs).toHaveLength(0)
  })
})

describe('dashboard.viewmodel — filtros', () => {
  beforeEach(() => {
    useDashboardStore.setState({ jobs: mockJobs })
  })

  it('filtra trabalhos por funcionário', () => {
    const { filterJobsByEmployee } = useDashboardStore.getState()
    expect(filterJobsByEmployee('e1')).toHaveLength(2)
    expect(filterJobsByEmployee('e2')).toHaveLength(1)
  })

  it('filtra trabalhos por status', () => {
    const { filterJobsByStatus } = useDashboardStore.getState()
    expect(filterJobsByStatus('pending')).toHaveLength(2)
    expect(filterJobsByStatus('completed')).toHaveLength(1)
  })
})
