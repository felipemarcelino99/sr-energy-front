import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { FinancialPage } from '@/views/pages/FinancialPage'
import { useTransactionStore } from '@/viewmodels/transaction.viewmodel'

jest.mock('@/viewmodels/transaction.viewmodel')
jest.mock('recharts', () => ({
  AreaChart: ({ children }: { children?: React.ReactNode }) => (
    <div data-testid="area-chart">{children}</div>
  ),
  Area: () => null,
  LineChart: ({ children }: { children?: React.ReactNode }) => (
    <div data-testid="line-chart">{children}</div>
  ),
  Line: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  Legend: () => null,
  ResponsiveContainer: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  PieChart: ({ children }: { children?: React.ReactNode }) => (
    <div data-testid="pie-chart">{children}</div>
  ),
  Pie: () => null,
  Cell: () => null,
}))
jest.mock('@/views/components/FinancialSummaryCards', () => ({
  FinancialSummaryCards: () => null,
}))

const mockStore = {
  load: jest.fn(),
  filtered: jest.fn().mockReturnValue([]),
  remove: jest.fn(),
  create: jest.fn(),
  summary: jest.fn().mockReturnValue({ totalCredits: 0, totalDebits: 0, balance: 0 }),
  monthly: jest.fn().mockReturnValue([{ month: '2024-01', credits: 1000, debits: 500 }]),
  filters: {},
  setFilters: jest.fn(),
  loading: false,
  error: null,
}

function renderPage() {
  return render(
    <MemoryRouter>
      <FinancialPage />
    </MemoryRouter>
  )
}

beforeEach(() => {
  ;(useTransactionStore as unknown as jest.Mock).mockReturnValue(mockStore)
  jest.clearAllMocks()
  ;(useTransactionStore as unknown as jest.Mock).mockReturnValue(mockStore)
})

describe('FinancialPage — F1: AreaChart', () => {
  it('renderiza AreaChart em vez de LineChart', () => {
    renderPage()
    expect(screen.getByTestId('area-chart')).toBeInTheDocument()
    expect(screen.queryByTestId('line-chart')).not.toBeInTheDocument()
  })

  it('renderiza PieChart para distribuição por categoria', () => {
    mockStore.filtered.mockReturnValue([
      {
        id: '1',
        type: 'credit',
        amount: 100,
        description: 'Test',
        category: 'Serviços',
        destination: null,
        date: '2024-01-01',
      },
    ])
    renderPage()
    expect(screen.getByTestId('pie-chart')).toBeInTheDocument()
  })
})

describe('FinancialPage — DataTable', () => {
  it('renderiza transações na DataTable com sort/resize', () => {
    mockStore.filtered.mockReturnValue([
      {
        id: '1',
        type: 'credit',
        amount: 100,
        description: 'Serviço prestado',
        category: 'Serviços',
        destination: null,
        date: '2024-01-01',
      },
    ])
    renderPage()
    expect(screen.getByText('Serviço prestado')).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: /Data/ })).toBeInTheDocument()
    expect(screen.getByTitle('Excluir')).toBeInTheDocument()
  })

  it('abre confirmação de exclusão ao clicar no botão de excluir', () => {
    mockStore.filtered.mockReturnValue([
      {
        id: '1',
        type: 'debit',
        amount: 50,
        description: 'Combustível',
        category: 'Combustível',
        destination: null,
        date: '2024-01-02',
      },
    ])
    renderPage()
    fireEvent.click(screen.getByTitle('Excluir'))
    expect(screen.getByText('Confirmar exclusão')).toBeInTheDocument()
  })
})

describe('FinancialPage — F2: category select', () => {
  it('exibe select de categoria no formulário de nova transação', () => {
    renderPage()
    fireEvent.click(screen.getByTitle('Novo lançamento'))
    expect(screen.getByRole('combobox', { name: /categoria/i })).toBeInTheDocument()
  })

  it('select de categoria contém opções predefinidas', () => {
    renderPage()
    fireEvent.click(screen.getByTitle('Novo lançamento'))
    const select = screen.getByRole('combobox', { name: /categoria/i })
    expect(select).toContainElement(screen.getByRole('option', { name: /serviços/i }))
  })
})
