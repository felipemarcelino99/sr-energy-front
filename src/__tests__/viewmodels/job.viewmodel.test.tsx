import { renderHook, waitFor, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { useJobStore, useJobFiltersStore, filterAndSortJobs } from '@/viewmodels/job.viewmodel'
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
  status: 'scheduled',
  description: 'Revisão geral',
  scheduledDate: '2025-06-01',
  city: 'São Paulo',
  state: 'SP',
  accommodation: false,
  car: true,
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
  ;(jobService.fetchJobs as jest.Mock).mockResolvedValue([])
})

describe('job.viewmodel — create', () => {
  it('chama o service e invalida a lista de jobs', async () => {
    ;(jobService.createJob as jest.Mock).mockResolvedValue(makeJob())
    const { result } = renderHook(() => useJobStore(), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.loading).toBe(false))

    const formData = {
      employeeId: 'emp-1',
      scheduledDate: '2025-06-01',
      city: 'São Paulo',
      state: 'SP',
      accommodation: false,
      car: true,
      startTime: '08:00',
      endTime: '17:00',
      machineId: 'mach-1',
      jobType: 'maintenance' as const,
      description: 'Revisão geral',
    }

    await act(async () => {
      await result.current.create(formData)
    })

    expect(jobService.createJob).toHaveBeenCalledWith(formData)
    expect(jobService.fetchJobs).toHaveBeenCalledTimes(2) // initial load + invalidation refetch
  })
})

describe('job.viewmodel — update', () => {
  it('chama o service com id e dados parciais', async () => {
    ;(jobService.updateJob as jest.Mock).mockResolvedValue(makeJob({ description: 'Atualizado' }))
    const { result } = renderHook(() => useJobStore(), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.loading).toBe(false))

    await act(async () => {
      await result.current.update('1', { description: 'Atualizado' })
    })

    expect(jobService.updateJob).toHaveBeenCalledWith('1', { description: 'Atualizado' })
  })
})

describe('job.viewmodel — cancel', () => {
  it('chama o service com o id do job', async () => {
    ;(jobService.cancelJob as jest.Mock).mockResolvedValue(makeJob({ status: 'cancelled' }))
    const { result } = renderHook(() => useJobStore(), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.loading).toBe(false))

    await act(async () => {
      await result.current.cancel('1')
    })

    expect(jobService.cancelJob).toHaveBeenCalledWith('1')
  })
})

describe('job.viewmodel — load / jobs from server', () => {
  it('popula jobs a partir do fetch', async () => {
    ;(jobService.fetchJobs as jest.Mock).mockResolvedValue([
      makeJob({ id: '1' }),
      makeJob({ id: '2' }),
    ])
    const { result } = renderHook(() => useJobStore(), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.jobs).toHaveLength(2)
  })

  it('expõe erro quando o fetch falha', async () => {
    ;(jobService.fetchJobs as jest.Mock).mockRejectedValue(new Error('Falha de rede'))
    const { result } = renderHook(() => useJobStore(), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.error).toBe('Falha de rede'))
  })
})

describe('filterAndSortJobs — filtros', () => {
  const jobs: Job[] = [
    makeJob({
      id: '1',
      status: 'scheduled',
      employeeId: 'emp-1',
      employeeName: 'Ana Lima',
      machineId: 'mach-1',
      machineName: 'Fresadora',
      city: 'Curitiba',
      description: 'Revisão anual',
      jobType: 'maintenance',
      scheduledDate: '2025-06-01',
    }),
    makeJob({
      id: '2',
      status: 'completed',
      employeeId: 'emp-2',
      employeeName: 'Carlos Melo',
      machineId: 'mach-2',
      machineName: 'Torno CNC',
      city: 'São Paulo',
      description: 'Implementação nova',
      jobType: 'implementation',
      scheduledDate: '2025-07-01',
    }),
    makeJob({
      id: '3',
      status: 'scheduled',
      employeeId: 'emp-1',
      employeeName: 'Ana Lima',
      machineId: 'mach-1',
      machineName: 'Fresadora',
      city: 'Curitiba',
      description: 'Manutenção emergencial',
      jobType: 'maintenance',
      scheduledDate: '2025-08-01',
    }),
  ]

  it('retorna todos quando sem filtros', () => {
    expect(filterAndSortJobs(jobs, {})).toHaveLength(3)
  })

  it('filtra por status', () => {
    expect(filterAndSortJobs(jobs, { status: 'scheduled' })).toHaveLength(2)
  })

  it('filtra por employeeId', () => {
    expect(filterAndSortJobs(jobs, { employeeId: 'emp-2' })).toHaveLength(1)
  })

  it('filtra por data', () => {
    expect(filterAndSortJobs(jobs, { date: '2025-07-01' })).toHaveLength(1)
  })

  it('não quebra ao ordenar quando há OS "esqueleto" sem scheduledDate (nascida de PC aceita)', () => {
    const withSkeleton: Job[] = [
      ...jobs,
      makeJob({
        id: '4',
        status: 'pending',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        scheduledDate: null as any,
      }),
    ]
    expect(() => filterAndSortJobs(withSkeleton, {})).not.toThrow()
    expect(filterAndSortJobs(withSkeleton, {})).toHaveLength(4)
  })

  it('filtra por jobType', () => {
    const result = filterAndSortJobs(jobs, { jobType: 'implementation' })
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('2')
  })

  it('filtra por busca de texto no nome do funcionário', () => {
    const result = filterAndSortJobs(jobs, { search: 'carlos' })
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('2')
  })

  it('filtra por busca de texto no nome da máquina', () => {
    const result = filterAndSortJobs(jobs, { search: 'torno' })
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('2')
  })

  it('filtra por busca de texto na cidade', () => {
    expect(filterAndSortJobs(jobs, { search: 'curitiba' })).toHaveLength(2)
  })

  it('filtra por busca de texto na descrição', () => {
    const result = filterAndSortJobs(jobs, { search: 'emergencial' })
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('3')
  })

  it('ordena por status (scheduled → in_progress → completed → cancelled) e depois por data desc', () => {
    const unordered: Job[] = [
      makeJob({ id: '1', status: 'completed', scheduledDate: '2024-01-10' }),
      makeJob({ id: '2', status: 'scheduled', scheduledDate: '2024-01-05' }),
      makeJob({ id: '3', status: 'in_progress', scheduledDate: '2024-01-08' }),
      makeJob({ id: '4', status: 'scheduled', scheduledDate: '2024-01-15' }),
      makeJob({ id: '5', status: 'cancelled', scheduledDate: '2024-01-01' }),
    ]
    const result = filterAndSortJobs(unordered, {})
    expect(result.map((j) => j.id)).toEqual(['4', '2', '3', '1', '5'])
  })
})

describe('job.viewmodel — filters store + filtered()', () => {
  it('setFilters atualiza os filtros e filtered() reflete a mudança', async () => {
    ;(jobService.fetchJobs as jest.Mock).mockResolvedValue([
      makeJob({ id: '1', employeeId: 'emp-1' }),
      makeJob({ id: '2', employeeId: 'emp-2' }),
    ])
    const { result } = renderHook(() => useJobStore(), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.jobs).toHaveLength(2))

    act(() => {
      result.current.setFilters({ employeeId: 'emp-2' })
    })

    await waitFor(() => expect(result.current.filtered()).toHaveLength(1))
    expect(result.current.filtered()[0].id).toBe('2')
  })
})
