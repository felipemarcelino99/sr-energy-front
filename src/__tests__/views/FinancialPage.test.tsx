import { render, screen, fireEvent } from '@testing-library/react'
import { FinancialPage } from '@/views/pages/FinancialPage'
import { useTransactionStore } from '@/viewmodels/transaction.viewmodel'

jest.mock('@/viewmodels/transaction.viewmodel')
jest.mock('recharts', () => ({
  AreaChart: ({ children, 'data-testid': testId }: { children?: React.ReactNode; 'data-testid'?: string }) => (
    <div data-testid="area-chart">{children}</div>
  ),
  Area: () => null,
  LineChart: ({ children }: { children?: React.ReactNode }) => <div data-testid="line-chart">{children}</div>,
  Line: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  Legend: () => null,
  ResponsiveContainer: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  PieChart: ({ children }: { children?: React.ReactNode }) => <div data-testid="pie-chart">{children}</div>,
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

beforeEach(() => {
  ;(useTransactionStore as unknown as jest.Mock).mockReturnValue(mockStore)
  jest.clearAllMocks()
  ;(useTransactionStore as unknown as jest.Mock).mockReturnValue(mockStore)
})

describe('FinancialPage — F1: AreaChart', () => {
  it('renderiza AreaChart em vez de LineChart', () => {
    render(<FinancialPage />)
    expect(screen.getByTestId('area-chart')).toBeInTheDocument()
    expect(screen.queryByTestId('line-chart')).not.toBeInTheDocument()
  })

  it('renderiza PieChart para distribuição por categoria', () => {
    mockStore.filtered.mockReturnValue([
      { id: '1', type: 'credit', amount: 100, description: 'Test', category: 'Serviços', destination: null, date: '2024-01-01' },
    ])
    render(<FinancialPage />)
    expect(screen.getByTestId('pie-chart')).toBeInTheDocument()
  })
})

describe('FinancialPage — F2: category select', () => {
  it('exibe select de categoria no formulário de nova transação', () => {
    render(<FinancialPage />)
    fireEvent.click(screen.getByTitle('Novo lançamento'))
    expect(screen.getByRole('combobox', { name: /categoria/i })).toBeInTheDocument()
  })

  it('select de categoria contém opções predefinidas', () => {
    render(<FinancialPage />)
    fireEvent.click(screen.getByTitle('Novo lançamento'))
    const select = screen.getByRole('combobox', { name: /categoria/i })
    expect(select).toContainElement(screen.getByRole('option', { name: /serviços/i }))
  })
})
