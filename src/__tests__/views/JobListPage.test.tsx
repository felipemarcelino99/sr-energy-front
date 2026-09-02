import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { JobListPage } from '@/views/pages/JobListPage'
import { useJobStore } from '@/viewmodels/job.viewmodel'

jest.mock('@/viewmodels/job.viewmodel')

it('aplica filtro de status ao montar se ?status=scheduled está na URL', () => {
  const scheduledJob = {
    ...mockJob,
    id: 'job-scheduled',
    employeeName: 'Ana Lima',
    status: 'scheduled',
  }
  const completedJob = {
    ...mockJob,
    id: 'job-completed',
    employeeName: 'Bruno Reis',
    status: 'completed',
  }
  ;(useJobStore as unknown as jest.Mock).mockReturnValue({
    load: jest.fn(),
    filtered: () => [scheduledJob, completedJob],
    cancel: jest.fn(),
    loading: false,
    error: null,
    filters: {},
    setFilters: jest.fn(),
  })

  render(
    <MemoryRouter initialEntries={['/jobs?status=scheduled']}>
      <JobListPage />
    </MemoryRouter>
  )

  expect(screen.getByText('Ana Lima')).toBeInTheDocument()
  expect(screen.queryByText('Bruno Reis')).not.toBeInTheDocument()
})

it('renderiza link de novo trabalho com texto "Adicionar"', () => {
  ;(useJobStore as unknown as jest.Mock).mockReturnValue({
    load: jest.fn(),
    filtered: () => [],
    cancel: jest.fn(),
    loading: false,
    error: null,
    filters: {},
    setFilters: jest.fn(),
  })
  render(
    <MemoryRouter>
      <JobListPage />
    </MemoryRouter>
  )
  expect(screen.getByRole('link', { name: /nova os/i })).toBeInTheDocument()
})

const mockJob = {
  id: 'job-1',
  employeeName: 'Ana Lima',
  machineName: 'Máquina X',
  scheduledDate: '2024-01-15',
  city: 'São Paulo',
  state: 'SP',
  jobType: 'maintenance',
  status: 'scheduled',
  description: 'Manutenção preventiva',
  accommodation: false,
  car: true,
  startTime: '08:00',
  endTime: '17:00',
}

function mockStore(overrides = {}) {
  ;(useJobStore as unknown as jest.Mock).mockReturnValue({
    load: jest.fn(),
    filtered: () => [mockJob],
    cancel: jest.fn(),
    loading: false,
    error: null,
    filters: {},
    setFilters: jest.fn(),
    ...overrides,
  })
}

it('não navega ao clicar na row — exibe preview inline', () => {
  mockStore()
  render(
    <MemoryRouter>
      <JobListPage />
    </MemoryRouter>
  )
  fireEvent.click(screen.getByText('Ana Lima'))
  expect(screen.getByTestId('job-preview-job-1')).toBeInTheDocument()
})

it('preview exibe campos chave do trabalho', () => {
  mockStore()
  render(
    <MemoryRouter>
      <JobListPage />
    </MemoryRouter>
  )
  fireEvent.click(screen.getByText('Ana Lima'))
  const preview = screen.getByTestId('job-preview-job-1')
  expect(preview).toHaveTextContent('Manutenção preventiva')
  expect(preview).toHaveTextContent('São Paulo/SP')
})

it('preview contém botão "Ver detalhes" que abre o modal de detalhe', () => {
  mockStore()
  render(
    <MemoryRouter>
      <JobListPage />
    </MemoryRouter>
  )
  fireEvent.click(screen.getByText('Ana Lima'))
  const button = screen.getByRole('button', { name: /ver detalhes/i })
  expect(button).toBeInTheDocument()
})

it('clicando novamente na row fecha o preview', () => {
  mockStore()
  render(
    <MemoryRouter>
      <JobListPage />
    </MemoryRouter>
  )
  fireEvent.click(screen.getByText('Ana Lima'))
  expect(screen.getByTestId('job-preview-job-1')).toBeInTheDocument()
  fireEvent.click(screen.getByText('Ana Lima'))
  expect(screen.queryByTestId('job-preview-job-1')).not.toBeInTheDocument()
})
