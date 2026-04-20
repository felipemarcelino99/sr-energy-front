import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { ManagerDashboardPage } from '@/views/pages/ManagerDashboardPage'
import { useDashboardStore } from '@/viewmodels/dashboard.viewmodel'

jest.mock('@/viewmodels/dashboard.viewmodel')
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: jest.fn(),
}))

beforeEach(() => {
  ;(useDashboardStore as unknown as jest.Mock).mockReturnValue({
    loading: false,
    error: null,
    loadDashboard: jest.fn(),
    financialSummary: () => ({ totalIncome: 1000, totalExpense: 500, balance: 500 }),
    jobStatusSummary: () => [],
    contractStatusSummary: () => [],
    contractsExpiringSoon: () => [],
    jobs: [],
  })
})

it('não renderiza o resumo financeiro (FinancialCard)', () => {
  render(<MemoryRouter><ManagerDashboardPage /></MemoryRouter>)
  expect(screen.queryByTestId('financial-card')).not.toBeInTheDocument()
  expect(screen.queryByText(/receita|despesa|saldo/i)).not.toBeInTheDocument()
})

it('navega para /jobs/:id ao clicar numa row de trabalho recente', () => {
  const navigate = jest.fn()
  const { useNavigate } = require('react-router-dom')
  useNavigate.mockReturnValue(navigate)
  ;(useDashboardStore as unknown as jest.Mock).mockReturnValue({
    loading: false,
    error: null,
    loadDashboard: jest.fn(),
    financialSummary: () => ({}),
    jobStatusSummary: () => [],
    contractStatusSummary: () => [],
    contractsExpiringSoon: () => [],
    jobs: [{ id: 'job-99', title: 'Trabalho Teste', employeeName: 'Ana', scheduledAt: '2024-01-01', status: 'scheduled' }],
  })
  render(<MemoryRouter><ManagerDashboardPage /></MemoryRouter>)
  fireEvent.click(screen.getByText('Trabalho Teste'))
  expect(navigate).toHaveBeenCalledWith('/jobs/job-99')
})
