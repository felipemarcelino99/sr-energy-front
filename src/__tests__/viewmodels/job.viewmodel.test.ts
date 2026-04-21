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
  ...overrides,
})

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

beforeEach(() => {
  useJobStore.setState({ jobs: [], loading: false, error: null, filters: {} })
  jest.clearAllMocks()
})

describe('job.viewmodel — create', () => {
  it('chama o service e adiciona ao store', async () => {
    ;(jobService.createJob as jest.Mock).mockResolvedValue(makeJob())
    await useJobStore.getState().create(formData)
    expect(jobService.createJob).toHaveBeenCalledWith(formData)
    expect(useJobStore.getState().jobs).toHaveLength(1)
  })
})

describe('job.viewmodel — update', () => {
  it('chama o service e atualiza o store', async () => {
    const updated = makeJob({ description: 'Atualizado' })
    useJobStore.setState({ jobs: [makeJob()] })
    ;(jobService.updateJob as jest.Mock).mockResolvedValue(updated)
    await useJobStore.getState().update('1', { ...formData, description: 'Atualizado' })
    expect(jobService.updateJob).toHaveBeenCalled()
    expect(useJobStore.getState().jobs[0].description).toBe('Atualizado')
  })
})

describe('job.viewmodel — cancel', () => {
  it('chama o service e atualiza status para cancelled', async () => {
    useJobStore.setState({ jobs: [makeJob()] })
    ;(jobService.cancelJob as jest.Mock).mockResolvedValue(makeJob({ status: 'cancelled' }))
    await useJobStore.getState().cancel('1')
    expect(jobService.cancelJob).toHaveBeenCalledWith('1')
    expect(useJobStore.getState().jobs[0].status).toBe('cancelled')
  })
})

describe('job.viewmodel — filtros', () => {
  const jobs: Job[] = [
    makeJob({ id: '1', status: 'scheduled', employeeId: 'emp-1', employeeName: 'Ana Lima', machineId: 'mach-1', machineName: 'Fresadora', city: 'Curitiba', description: 'Revisão anual', jobType: 'maintenance', scheduledDate: '2025-06-01' }),
    makeJob({ id: '2', status: 'completed', employeeId: 'emp-2', employeeName: 'Carlos Melo', machineId: 'mach-2', machineName: 'Torno CNC', city: 'São Paulo', description: 'Implementação nova', jobType: 'implementation', scheduledDate: '2025-07-01' }),
    makeJob({ id: '3', status: 'scheduled', employeeId: 'emp-1', employeeName: 'Ana Lima', machineId: 'mach-1', machineName: 'Fresadora', city: 'Curitiba', description: 'Manutenção emergencial', jobType: 'maintenance', scheduledDate: '2025-08-01' }),
  ]

  beforeEach(() => {
    useJobStore.setState({ jobs, filters: {} })
  })

  it('retorna todos quando sem filtros', () => {
    expect(useJobStore.getState().filtered()).toHaveLength(3)
  })

  it('filtra por status', () => {
    useJobStore.setState({ filters: { status: 'scheduled' } })
    expect(useJobStore.getState().filtered()).toHaveLength(2)
  })

  it('filtra por employeeId', () => {
    useJobStore.setState({ filters: { employeeId: 'emp-2' } })
    expect(useJobStore.getState().filtered()).toHaveLength(1)
  })

  it('filtra por data', () => {
    useJobStore.setState({ filters: { date: '2025-07-01' } })
    expect(useJobStore.getState().filtered()).toHaveLength(1)
  })

  it('filtra por jobType', () => {
    useJobStore.setState({ filters: { jobType: 'implementation' } })
    expect(useJobStore.getState().filtered()).toHaveLength(1)
    expect(useJobStore.getState().filtered()[0].id).toBe('2')
  })

  it('filtra por busca de texto no nome do funcionário', () => {
    useJobStore.setState({ filters: { search: 'carlos' } })
    expect(useJobStore.getState().filtered()).toHaveLength(1)
    expect(useJobStore.getState().filtered()[0].id).toBe('2')
  })

  it('filtra por busca de texto no nome da máquina', () => {
    useJobStore.setState({ filters: { search: 'torno' } })
    expect(useJobStore.getState().filtered()).toHaveLength(1)
    expect(useJobStore.getState().filtered()[0].id).toBe('2')
  })

  it('filtra por busca de texto na cidade', () => {
    useJobStore.setState({ filters: { search: 'curitiba' } })
    expect(useJobStore.getState().filtered()).toHaveLength(2)
  })

  it('filtra por busca de texto na descrição', () => {
    useJobStore.setState({ filters: { search: 'emergencial' } })
    expect(useJobStore.getState().filtered()).toHaveLength(1)
    expect(useJobStore.getState().filtered()[0].id).toBe('3')
  })
})

describe('filtered — ordenação', () => {
  it('ordena por status (scheduled → in_progress → completed → cancelled) e depois por data desc', () => {
    const store = useJobStore.getState()
    store.jobs = [
      { ...makeJob(), id: '1', status: 'completed', scheduledDate: '2024-01-10' },
      { ...makeJob(), id: '2', status: 'scheduled', scheduledDate: '2024-01-05' },
      { ...makeJob(), id: '3', status: 'in_progress', scheduledDate: '2024-01-08' },
      { ...makeJob(), id: '4', status: 'scheduled', scheduledDate: '2024-01-15' },
      { ...makeJob(), id: '5', status: 'cancelled', scheduledDate: '2024-01-01' },
    ]
    store.filters = {}

    const result = store.filtered()
    expect(result.map((j) => j.id)).toEqual(['4', '2', '3', '1', '5'])
  })
})
