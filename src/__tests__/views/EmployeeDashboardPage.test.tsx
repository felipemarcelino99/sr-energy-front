import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter, useNavigate } from 'react-router-dom'
import { EmployeeDashboardPage } from '@/views/pages/EmployeeDashboardPage'
import { useAuth } from '@/viewmodels/auth.context'
import { useEmployeeDashboardStore } from '@/viewmodels/employee.dashboard.viewmodel'

jest.mock('@/viewmodels/auth.context')
jest.mock('@/viewmodels/employee.dashboard.viewmodel')
jest.mock('@/views/components/ScheduleWidget', () => ({
  ScheduleWidget: () => <div data-testid="schedule-widget-stub" />,
}))
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: jest.fn(),
}))

beforeEach(() => {
  jest.clearAllMocks()
  ;(useAuth as jest.Mock).mockReturnValue({
    user: { id: 'u1', employeeId: 'emp-1', email: 'a@a.com', name: 'Ana', role: 'employee' },
  })
})

it('mostra skeleton de loading', () => {
  ;(useEmployeeDashboardStore as unknown as jest.Mock).mockReturnValue({
    loading: true,
    error: null,
    loadMyJobs: jest.fn(),
    myJobsByStatus: () => [],
    nextJob: () => null,
  })
  const { container } = render(
    <MemoryRouter>
      <EmployeeDashboardPage />
    </MemoryRouter>
  )
  expect(container.querySelector('.animate-pulse')).toBeInTheDocument()
})

it('mostra alerta de erro', () => {
  ;(useEmployeeDashboardStore as unknown as jest.Mock).mockReturnValue({
    loading: false,
    error: 'Falha ao carregar',
    loadMyJobs: jest.fn(),
    myJobsByStatus: () => [],
    nextJob: () => null,
  })
  render(
    <MemoryRouter>
      <EmployeeDashboardPage />
    </MemoryRouter>
  )
  expect(screen.getByRole('alert')).toHaveTextContent('Falha ao carregar')
})

it('carrega minhas OS ao montar quando há employeeId', () => {
  const loadMyJobs = jest.fn()
  ;(useEmployeeDashboardStore as unknown as jest.Mock).mockReturnValue({
    loading: false,
    error: null,
    loadMyJobs,
    myJobsByStatus: () => [],
    nextJob: () => null,
  })
  render(
    <MemoryRouter>
      <EmployeeDashboardPage />
    </MemoryRouter>
  )
  expect(loadMyJobs).toHaveBeenCalledWith('emp-1')
})

it('navega para /my-jobs com filtro de status ao clicar no card de status', () => {
  const navigate = jest.fn()
  ;(useNavigate as unknown as jest.Mock).mockReturnValue(navigate)
  ;(useEmployeeDashboardStore as unknown as jest.Mock).mockReturnValue({
    loading: false,
    error: null,
    loadMyJobs: jest.fn(),
    myJobsByStatus: () => [{ status: 'scheduled', count: 2 }],
    nextJob: () => null,
  })
  render(
    <MemoryRouter>
      <EmployeeDashboardPage />
    </MemoryRouter>
  )
  fireEvent.click(screen.getByTestId('status-card-scheduled'))
  expect(navigate).toHaveBeenCalledWith('/my-jobs?status=scheduled')
})
