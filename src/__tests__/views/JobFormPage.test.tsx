import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { JobFormPage } from '@/views/pages/JobFormPage'
import { useJobStore } from '@/viewmodels/job.viewmodel'
import { useMachineStore } from '@/viewmodels/machine.viewmodel'
import { useEmployeeStore } from '@/viewmodels/employee.viewmodel'
import { useBagStore } from '@/viewmodels/bag.viewmodel'
import { fetchJob } from '@/services/job.service'

jest.mock('@/viewmodels/job.viewmodel')
jest.mock('@/viewmodels/machine.viewmodel')
jest.mock('@/viewmodels/employee.viewmodel')
jest.mock('@/viewmodels/bag.viewmodel')
jest.mock('@/services/job.service', () => ({ fetchJob: jest.fn() }))

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>)
}

beforeEach(() => {
  jest.clearAllMocks()
  ;(useJobStore as unknown as jest.Mock).mockReturnValue({ create: jest.fn(), update: jest.fn() })
  ;(useMachineStore as unknown as jest.Mock).mockReturnValue({
    machines: [{ id: 'mach-1', name: 'Torno CNC' }],
    load: jest.fn(),
  })
  ;(useEmployeeStore as unknown as jest.Mock).mockReturnValue({
    employees: [{ id: 'emp-1', name: 'Ana Silva' }],
    load: jest.fn(),
  })
  ;(useBagStore as unknown as jest.Mock).mockReturnValue({
    bags: [{ id: 'bag-1', name: 'Mala A', model: 'X1' }],
    load: jest.fn(),
  })
})

it('renderiza link "Voltar à listagem" apontando para /jobs', () => {
  renderWithProviders(
    <MemoryRouter initialEntries={['/jobs/new']}>
      <Routes>
        <Route path="/jobs/new" element={<JobFormPage />} />
      </Routes>
    </MemoryRouter>
  )
  const link = screen.getByRole('link', { name: /voltar/i })
  expect(link).toHaveAttribute('href', '/jobs')
})

it('o wrapper principal não tem classe max-w-xl', () => {
  const { container } = renderWithProviders(
    <MemoryRouter initialEntries={['/jobs/new']}>
      <Routes>
        <Route path="/jobs/new" element={<JobFormPage />} />
      </Routes>
    </MemoryRouter>
  )
  expect(container.querySelector('.max-w-xl')).not.toBeInTheDocument()
  expect(container.querySelector('.max-w-2xl')).not.toBeInTheDocument()
})

it('renderiza edição de OS com job "esqueleto" (campos estendidos null) sem quebrar', async () => {
  ;(fetchJob as jest.Mock).mockResolvedValue({
    id: 'job-1',
    employeeId: null,
    machineId: null,
    description: '',
    scheduledDate: null,
    city: null,
    state: null,
    startTime: null,
    endTime: null,
    jobType: null,
    employeeIds: null,
    contractId: null,
    scopeDetail: null,
    bagId: null,
    serviceAddress: null,
    clientContactName: null,
    clientContactPhone: null,
  })
  renderWithProviders(
    <MemoryRouter initialEntries={['/jobs/job-1/edit']}>
      <Routes>
        <Route path="/jobs/:id/edit" element={<JobFormPage />} />
      </Routes>
    </MemoryRouter>
  )
  expect(await screen.findByText(/Editar OS/)).toBeInTheDocument()
})

it('renderiza edição de OS com job completo (campos estendidos preenchidos) sem quebrar', async () => {
  ;(fetchJob as jest.Mock).mockResolvedValue({
    id: 'job-1',
    employeeId: 'emp-1',
    machineId: 'mach-1',
    description: 'Manutenção preventiva',
    scheduledDate: '2025-06-01',
    city: 'São Paulo',
    state: 'SP',
    startTime: '08:00',
    endTime: '17:00',
    jobType: 'maintenance',
    employeeIds: ['emp-1'],
    contractId: 'c1',
    scopeDetail: 'Escopo detalhado',
    bagId: 'bag-1',
    serviceAddress: 'Rua X, 123',
    clientContactName: 'João',
    clientContactPhone: '11999999999',
  })
  renderWithProviders(
    <MemoryRouter initialEntries={['/jobs/job-1/edit']}>
      <Routes>
        <Route path="/jobs/:id/edit" element={<JobFormPage />} />
      </Routes>
    </MemoryRouter>
  )
  expect(await screen.findByText(/Editar OS — Manutenção preventiva/)).toBeInTheDocument()
})
