import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { JobListPage } from '@/views/pages/JobListPage'
import { useJobStore } from '@/viewmodels/job.viewmodel'

jest.mock('@/viewmodels/job.viewmodel')
jest.mock('@/views/components/JobDetailModal', () => ({
  JobDetailModal: ({ jobId }: { jobId: string }) => (
    <div data-testid="job-detail-modal">{jobId}</div>
  ),
}))

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
  jobType: 'commissioning',
  status: 'scheduled',
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
  expect(preview).toHaveTextContent('Comissionamento')
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

it('clicando em "Ver detalhes" abre o modal de detalhe', () => {
  mockStore()
  render(
    <MemoryRouter>
      <JobListPage />
    </MemoryRouter>
  )
  fireEvent.click(screen.getByText('Ana Lima'))
  fireEvent.click(screen.getByRole('button', { name: /ver detalhes/i }))
  expect(screen.getByTestId('job-detail-modal')).toHaveTextContent('job-1')
})

it('clicando em "Editar" navega para a tela de edição', async () => {
  mockStore()
  render(
    <MemoryRouter initialEntries={['/jobs']}>
      <Routes>
        <Route path="/jobs" element={<JobListPage />} />
        <Route path="/jobs/:id/edit" element={<div>Editar OS Page</div>} />
      </Routes>
    </MemoryRouter>
  )
  fireEvent.click(screen.getByText('Ana Lima'))
  fireEvent.click(screen.getByRole('button', { name: /editar/i }))
  await waitFor(() => {
    expect(screen.getByText('Editar OS Page')).toBeInTheDocument()
  })
})

it('não exibe Editar/Cancelar para OS concluída ou cancelada', () => {
  mockStore({ filtered: () => [{ ...mockJob, status: 'completed' }] })
  render(
    <MemoryRouter>
      <JobListPage />
    </MemoryRouter>
  )
  fireEvent.click(screen.getByText('Ana Lima'))
  expect(screen.queryByRole('button', { name: /editar/i })).not.toBeInTheDocument()
  expect(screen.queryByRole('button', { name: /cancelar$/i })).not.toBeInTheDocument()
})

it('cancela uma OS via modal de confirmação', async () => {
  const mockCancel = jest.fn().mockResolvedValue(undefined)
  mockStore({ cancel: mockCancel })
  render(
    <MemoryRouter>
      <JobListPage />
    </MemoryRouter>
  )
  fireEvent.click(screen.getByText('Ana Lima'))
  fireEvent.click(screen.getByRole('button', { name: /^cancelar$/i }))
  expect(screen.getByText('Confirmar cancelamento')).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: /cancelar os/i }))
  await waitFor(() => {
    expect(mockCancel).toHaveBeenCalledWith('job-1')
  })
})

it('digita na busca e dispara setFilters', () => {
  const mockSetFilters = jest.fn()
  mockStore({ setFilters: mockSetFilters })
  render(
    <MemoryRouter>
      <JobListPage />
    </MemoryRouter>
  )
  fireEvent.change(screen.getByPlaceholderText(/buscar funcionário/i), {
    target: { value: 'ana' },
  })
  expect(mockSetFilters).toHaveBeenCalledWith({ search: 'ana' })
})

it('altera o filtro de data agendada', async () => {
  mockStore()
  render(
    <MemoryRouter>
      <JobListPage />
    </MemoryRouter>
  )
  const dateInput = screen.getByLabelText(/filtrar por data agendada/i)
  fireEvent.change(dateInput, { target: { value: '2024-01-20' } })
  await waitFor(() => {
    expect(dateInput).toHaveValue('2024-01-20')
  })
})

it('seleciona status e tipo via MultiSelect', () => {
  mockStore()
  render(
    <MemoryRouter>
      <JobListPage />
    </MemoryRouter>
  )
  fireEvent.click(screen.getByRole('button', { name: 'Status' }))
  fireEvent.click(screen.getAllByText('Agendado')[0])
  fireEvent.click(screen.getByRole('button', { name: 'Tipo' }))
  fireEvent.click(screen.getAllByText('Comissionamento')[0])
  expect(screen.getByText('Ana Lima')).toBeInTheDocument()
})

it('mostra "Limpar filtros" quando há filtro de data ativo e limpa ao clicar', async () => {
  mockStore()
  render(
    <MemoryRouter initialEntries={['/jobs?date=2024-01-15']}>
      <JobListPage />
    </MemoryRouter>
  )
  const clearButton = screen.getByRole('button', { name: /limpar filtros/i })
  fireEvent.click(clearButton)
  await waitFor(() => {
    expect(screen.queryByRole('button', { name: /limpar filtros/i })).not.toBeInTheDocument()
  })
})

it('fecha o modal de cancelamento sem confirmar', () => {
  const mockCancel = jest.fn()
  mockStore({ cancel: mockCancel })
  render(
    <MemoryRouter>
      <JobListPage />
    </MemoryRouter>
  )
  fireEvent.click(screen.getByText('Ana Lima'))
  fireEvent.click(screen.getByRole('button', { name: /^cancelar$/i }))
  fireEvent.click(screen.getByRole('button', { name: 'Não' }))
  expect(screen.queryByText('Confirmar cancelamento')).not.toBeInTheDocument()
  expect(mockCancel).not.toHaveBeenCalled()
})
