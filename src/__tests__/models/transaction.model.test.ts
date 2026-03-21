import { calcSummary, groupByMonth, transactionSchema } from '@/models/transaction.model'
import type { Transaction } from '@/models/transaction.model'

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

describe('transaction.model — calcSummary', () => {
  it('calcula entradas, saídas e saldo corretamente', () => {
    const transactions = [
      makeT({ id: '1', type: 'credit', amount: 5000 }),
      makeT({ id: '2', type: 'credit', amount: 3000 }),
      makeT({ id: '3', type: 'debit', amount: 2000 }),
    ]
    const summary = calcSummary(transactions)
    expect(summary.totalCredits).toBe(8000)
    expect(summary.totalDebits).toBe(2000)
    expect(summary.balance).toBe(6000)
  })

  it('retorna zeros para lista vazia', () => {
    const summary = calcSummary([])
    expect(summary.totalCredits).toBe(0)
    expect(summary.totalDebits).toBe(0)
    expect(summary.balance).toBe(0)
  })
})

describe('transaction.model — groupByMonth', () => {
  it('agrupa transações por mês', () => {
    const transactions = [
      makeT({ id: '1', type: 'credit', amount: 1000, date: '2025-06-01' }),
      makeT({ id: '2', type: 'debit', amount: 500, date: '2025-06-15' }),
      makeT({ id: '3', type: 'credit', amount: 2000, date: '2025-07-01' }),
    ]
    const groups = groupByMonth(transactions)
    expect(groups).toHaveLength(2)
    expect(groups[0].month).toBe('2025-06')
    expect(groups[0].credits).toBe(1000)
    expect(groups[0].debits).toBe(500)
    expect(groups[1].month).toBe('2025-07')
    expect(groups[1].credits).toBe(2000)
  })

  it('retorna lista vazia para array vazio', () => {
    expect(groupByMonth([])).toHaveLength(0)
  })
})

describe('transaction.model — schema', () => {
  it('aceita dados válidos', () => {
    const result = transactionSchema.safeParse({
      type: 'credit',
      amount: 1000,
      description: 'Pagamento',
      category: 'Serviços',
      date: '2025-06-01',
    })
    expect(result.success).toBe(true)
  })

  it('rejeita valor zero', () => {
    const result = transactionSchema.safeParse({
      type: 'credit', amount: 0, description: 'X', category: 'Y', date: '2025-06-01',
    })
    expect(result.success).toBe(false)
  })

  it('rejeita valor negativo', () => {
    const result = transactionSchema.safeParse({
      type: 'debit', amount: -100, description: 'X', category: 'Y', date: '2025-06-01',
    })
    expect(result.success).toBe(false)
  })

  it('rejeita tipo inválido', () => {
    const result = transactionSchema.safeParse({
      type: 'invalid', amount: 100, description: 'X', category: 'Y', date: '2025-06-01',
    })
    expect(result.success).toBe(false)
  })
})
