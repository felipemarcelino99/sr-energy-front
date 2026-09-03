import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
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
  {
    id: '1',
    title: 'Job A',
    status: 'pending',
    employeeId: 'e1',
    employeeName: 'Ana',
    scheduledAt: '2026-03-20',
  },
  {
    id: '2',
    title: 'Job B',
    status: 'completed',
    employeeId: 'e2',
    employeeName: 'Bob',
    scheduledAt: '2026-03-18',
  },
  {
    id: '3',
    title: 'Job C',
    status: 'pending',
    employeeId: 'e1',
    employeeName: 'Ana',
    scheduledAt: '2026-03-22',
  },
]

const mockContracts: ExpiringContract[] = [
  { id: '1', clientName: 'X', expiresAt: '2026-04-01', daysUntilExpiry: 12 },
  { id: '2', clientName: 'Y', expiresAt: '2026-05-01', daysUntilExpiry: 42 },
]

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  }
}

beforeEach(() => {
  jest.clearAllMocks()
  ;(dashboardService.fetchTransactions as jest.Mock).mockResolvedValue([])
  ;(dashboardService.fetchJobs as jest.Mock).mockResolvedValue([])
  ;(dashboardService.fetchExpiringContracts as jest.Mock).mockResolvedValue([])
})

describe('dashboard.viewmodel — loadDashboard', () => {
  it('carrega dados via TanStack Query e popula o hook', async () => {
    ;(dashboardService.fetchTransactions as jest.Mock).mockResolvedValue(mockTransactions)
    ;(dashboardService.fetchJobs as jest.Mock).mockResolvedValue(mockJobs)
    ;(dashboardService.fetchExpiringContracts as jest.Mock).mockResolvedValue(mockContracts)

    const { result } = renderHook(() => useDashboardStore(), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.transactions).toHaveLength(2)
    expect(result.current.jobs).toHaveLength(3)
  })
})

describe('dashboard.viewmodel — computed selectors', () => {
  it('calcula saldo corretamente', async () => {
    ;(dashboardService.fetchTransactions as jest.Mock).mockResolvedValue(mockTransactions)
    const { result } = renderHook(() => useDashboardStore(), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.financialSummary().balance).toBe(7000)
  })

  it('agrupa trabalhos por status corretamente', async () => {
    ;(dashboardService.fetchJobs as jest.Mock).mockResolvedValue(mockJobs)
    const { result } = renderHook(() => useDashboardStore(), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.loading).toBe(false))
    const pending = result.current.jobStatusSummary().find((s) => s.status === 'pending')
    expect(pending?.count).toBe(2)
  })

  it('filtra contratos expirando nos próximos 30 dias', async () => {
    ;(dashboardService.fetchExpiringContracts as jest.Mock).mockResolvedValue(mockContracts)
    const { result } = renderHook(() => useDashboardStore(), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.loading).toBe(false))
    const soon = result.current.contractsExpiringSoon()
    expect(soon).toHaveLength(1)
    expect(soon[0].id).toBe('1')
  })
})

describe('dashboard.viewmodel — filtros', () => {
  it('filtra trabalhos por funcionário', async () => {
    ;(dashboardService.fetchJobs as jest.Mock).mockResolvedValue(mockJobs)
    const { result } = renderHook(() => useDashboardStore(), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.filterJobsByEmployee('e1')).toHaveLength(2)
    expect(result.current.filterJobsByEmployee('e2')).toHaveLength(1)
  })

  it('filtra trabalhos por status', async () => {
    ;(dashboardService.fetchJobs as jest.Mock).mockResolvedValue(mockJobs)
    const { result } = renderHook(() => useDashboardStore(), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.filterJobsByStatus('pending')).toHaveLength(2)
    expect(result.current.filterJobsByStatus('completed')).toHaveLength(1)
  })
})

describe('employee.dashboard.viewmodel — loadMyJobs', () => {
  beforeEach(() => {
    useEmployeeDashboardStore.setState({ jobs: [], loading: false, error: null })
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
