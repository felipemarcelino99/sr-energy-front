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
      type: 'credit', amount: 500, description: 'X', category: 'Y', date: '2025-06-01',
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
