import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { EmployeeJobListPage } from '@/views/pages/EmployeeJobListPage'
import { useJobStore } from '@/viewmodels/job.viewmodel'
import type { Job } from '@/models/job.model'

jest.mock('@/viewmodels/job.viewmodel')

function mockStore(overrides: Partial<ReturnType<typeof useJobStore>> = {}) {
  ;(useJobStore as unknown as jest.Mock).mockReturnValue({
    load: jest.fn(),
    filtered: () => [],
    loading: false,
    error: null,
    filters: {},
    setFilters: jest.fn(),
    ...overrides,
  })
}

beforeEach(() => {
  jest.clearAllMocks()
})

it('carrega a lista de OS ao montar', () => {
  const load = jest.fn()
  mockStore({ load })
  render(
    <MemoryRouter>
      <EmployeeJobListPage />
    </MemoryRouter>
  )
  expect(load).toHaveBeenCalled()
})

it('mostra spinner de loading', () => {
  mockStore({ loading: true })
  const { container } = render(
    <MemoryRouter>
      <EmployeeJobListPage />
    </MemoryRouter>
  )
  expect(container.querySelector('.loading-spinner')).toBeInTheDocument()
})

it('mostra alerta de erro', () => {
  mockStore({ error: 'Erro ao buscar OS' })
  render(
    <MemoryRouter>
      <EmployeeJobListPage />
    </MemoryRouter>
  )
  expect(screen.getByText('Erro ao buscar OS')).toBeInTheDocument()
})

it('mostra mensagem de vazio quando não há OS', () => {
  mockStore({ filtered: () => [] })
  render(
    <MemoryRouter>
      <EmployeeJobListPage />
    </MemoryRouter>
  )
  expect(screen.getByText('Nenhuma OS encontrada.')).toBeInTheDocument()
})

it('renderiza a lista de OS e link para o detalhe', () => {
  mockStore({
    filtered: () =>
      [
        {
          id: 'job-1',
          number: 'OS-001',
          machineId: 'mach-1',
          machineName: 'Torno CNC',
          scheduledDate: '2025-06-01',
          city: 'São Paulo',
          state: 'SP',
          jobType: 'maintenance',
          status: 'scheduled',
        },
      ] as unknown as Job[],
  })
  render(
    <MemoryRouter>
      <EmployeeJobListPage />
    </MemoryRouter>
  )
  const link = screen.getByText('Torno CNC').closest('a')
  expect(link).toHaveAttribute('href', '/my-jobs/job-1')
  expect(link).toHaveTextContent('Agendado')
})

it('atualiza filtro de busca ao digitar', () => {
  const setFilters = jest.fn()
  mockStore({ setFilters, filters: { search: '' } })
  render(
    <MemoryRouter>
      <EmployeeJobListPage />
    </MemoryRouter>
  )
  fireEvent.change(screen.getByPlaceholderText('Buscar OS, máquina, cidade…'), {
    target: { value: 'Torno' },
  })
  expect(setFilters).toHaveBeenCalledWith(expect.objectContaining({ search: 'Torno' }))
})

it('aplica filtro de status vindo da query string', () => {
  const setFilters = jest.fn()
  mockStore({ setFilters })
  render(
    <MemoryRouter initialEntries={['/my-jobs?status=completed']}>
      <EmployeeJobListPage />
    </MemoryRouter>
  )
  expect(setFilters).toHaveBeenCalledWith({ status: 'completed' })
})
