import { useTransactionStore } from '@/viewmodels/transaction.viewmodel'
import type { Transaction } from '@/models/transaction.model'

jest.mock('@/services/transaction.service', () => ({
  fetchTransactions: jest.fn(),
  createTransaction: jest.fn(),
  removeTransaction: jest.fn(),
}))

import * as txService from '@/services/transaction.service'

const makeT = (overrides: Partial<Transaction> = {}): Transaction => ({
  id: '1',
  type: 'credit',
  amount: 1000,
  description: 'Pagamento',
  category: 'Serviços',
  date: '2025-06-15',
  createdAt: '2025-06-15',
  ...overrides,
})

beforeEach(() => {
  useTransactionStore.setState({ transactions: [], loading: false, error: null, filters: {} })
  jest.clearAllMocks()
})

describe('transaction.viewmodel — load', () => {
  it('carrega transações e atualiza o store', async () => {
    ;(txService.fetchTransactions as jest.Mock).mockResolvedValue([makeT()])
    await useTransactionStore.getState().load()
    expect(useTransactionStore.getState().transactions).toHaveLength(1)
    expect(useTransactionStore.getState().loading).toBe(false)
  })

  it('define erro quando a requisição falha', async () => {
    ;(txService.fetchTransactions as jest.Mock).mockRejectedValue(new Error('Falha'))
    await useTransactionStore.getState().load()
    expect(useTransactionStore.getState().error).toBe('Falha')
    expect(useTransactionStore.getState().loading).toBe(false)
  })
})

describe('transaction.viewmodel — setFilters/summary/monthly', () => {
  it('atualiza os filtros no store', () => {
    useTransactionStore.getState().setFilters({ type: 'debit' })
    expect(useTransactionStore.getState().filters).toEqual({ type: 'debit' })
  })

  it('summary() resume as transações filtradas', () => {
    useTransactionStore.setState({
      transactions: [
        makeT({ id: '1', type: 'credit', amount: 100 }),
        makeT({ id: '2', type: 'debit', amount: 40 }),
      ],
      filters: {},
    })
    const s = useTransactionStore.getState().summary()
    expect(s.totalCredits).toBe(100)
    expect(s.totalDebits).toBe(40)
  })

  it('monthly() agrupa todas as transações por mês, ignorando filtros', () => {
    useTransactionStore.setState({
      transactions: [
        makeT({ id: '1', date: '2025-06-01', type: 'credit', amount: 100 }),
        makeT({ id: '2', date: '2025-07-01', type: 'debit', amount: 40 }),
      ],
      filters: { month: '2025-06' },
    })
    const m = useTransactionStore.getState().monthly()
    expect(m.length).toBeGreaterThanOrEqual(2)
  })
})

describe('transaction.viewmodel — filtros combinados', () => {
  const transactions = [
    makeT({ id: '1', type: 'credit', category: 'Serviços', date: '2025-06-01' }),
    makeT({ id: '2', type: 'debit', category: 'Equipamentos', date: '2025-06-15' }),
    makeT({ id: '3', type: 'credit', category: 'Serviços', date: '2025-07-01' }),
  ]

  beforeEach(() => {
    useTransactionStore.setState({ transactions, filters: {} })
  })

  it('retorna todos sem filtros', () => {
    expect(useTransactionStore.getState().filtered()).toHaveLength(3)
  })

  it('filtra por tipo', () => {
    useTransactionStore.setState({ filters: { type: 'credit' } })
    expect(useTransactionStore.getState().filtered()).toHaveLength(2)
  })

  it('filtra por categoria', () => {
    useTransactionStore.setState({ filters: { category: 'Equipamentos' } })
    expect(useTransactionStore.getState().filtered()).toHaveLength(1)
  })

  it('filtra por mês', () => {
    useTransactionStore.setState({ filters: { month: '2025-07' } })
    expect(useTransactionStore.getState().filtered()).toHaveLength(1)
  })

  it('filtros combinados', () => {
    useTransactionStore.setState({ filters: { type: 'credit', month: '2025-06' } })
    expect(useTransactionStore.getState().filtered()).toHaveLength(1)
  })
})

describe('transaction.viewmodel — create', () => {
  it('chama o service e adiciona ao store', async () => {
    ;(txService.createTransaction as jest.Mock).mockResolvedValue(makeT({ id: '99' }))
    await useTransactionStore.getState().create({
      type: 'credit',
      amount: 500,
      description: 'X',
      category: 'Y',
      date: '2025-06-01',
    })
    expect(txService.createTransaction).toHaveBeenCalled()
    expect(useTransactionStore.getState().transactions).toHaveLength(1)
  })
})

describe('transaction.viewmodel — remove', () => {
  it('chama o service e remove do store', async () => {
    useTransactionStore.setState({ transactions: [makeT({ id: '1' })] })
    ;(txService.removeTransaction as jest.Mock).mockResolvedValue(undefined)
    await useTransactionStore.getState().remove('1')
    expect(txService.removeTransaction).toHaveBeenCalledWith('1')
    expect(useTransactionStore.getState().transactions).toHaveLength(0)
  })
})
