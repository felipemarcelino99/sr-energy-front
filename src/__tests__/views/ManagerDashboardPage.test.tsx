import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { ManagerDashboardPage } from '@/views/pages/ManagerDashboardPage'
import { useDashboardStore } from '@/viewmodels/dashboard.viewmodel'

jest.mock('@/viewmodels/dashboard.viewmodel')

beforeEach(() => {
  ;(useDashboardStore as unknown as jest.Mock).mockReturnValue({
    loading: false,
    error: null,
    loadDashboard: jest.fn(),
    financialSummary: () => ({ totalIncome: 1000, totalExpense: 500, balance: 500 }),
    jobStatusSummary: () => [],
    contractsExpiringSoon: () => [],
    jobs: [],
  })
})

it('não renderiza o resumo financeiro (FinancialCard)', () => {
  render(<MemoryRouter><ManagerDashboardPage /></MemoryRouter>)
  expect(screen.queryByTestId('financial-card')).not.toBeInTheDocument()
  expect(screen.queryByText(/receita|despesa|saldo/i)).not.toBeInTheDocument()
})
