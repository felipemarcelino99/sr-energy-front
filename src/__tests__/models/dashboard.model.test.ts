import {
  calcFinancialSummary,
  groupJobsByStatus,
  filterExpiringContracts,
  type Transaction,
  type JobSummary,
  type ExpiringContract,
} from '@/models/dashboard.model'

const transactions: Transaction[] = [
  { id: '1', type: 'credit', amount: 5000, description: 'Serviço A', date: '2026-03-01' },
  { id: '2', type: 'credit', amount: 3000, description: 'Serviço B', date: '2026-03-05' },
  { id: '3', type: 'debit', amount: 1500, description: 'Material', date: '2026-03-10' },
]

describe('calcFinancialSummary', () => {
  it('calcula entradas, saídas e saldo corretamente', () => {
    const result = calcFinancialSummary(transactions)
    expect(result.totalIncome).toBe(8000)
    expect(result.totalExpense).toBe(1500)
    expect(result.balance).toBe(6500)
  })

  it('retorna zeros para lista vazia', () => {
    const result = calcFinancialSummary([])
    expect(result.totalIncome).toBe(0)
    expect(result.totalExpense).toBe(0)
    expect(result.balance).toBe(0)
  })
})

const jobs: JobSummary[] = [
  { id: '1', title: 'Job A', status: 'pending', employeeId: 'e1', employeeName: 'Ana', scheduledAt: '2026-03-20' },
  { id: '2', title: 'Job B', status: 'completed', employeeId: 'e2', employeeName: 'Bob', scheduledAt: '2026-03-18' },
  { id: '3', title: 'Job C', status: 'pending', employeeId: 'e1', employeeName: 'Ana', scheduledAt: '2026-03-22' },
  { id: '4', title: 'Job D', status: 'in_progress', employeeId: 'e3', employeeName: 'Cal', scheduledAt: '2026-03-21' },
]

describe('groupJobsByStatus', () => {
  it('agrupa trabalhos por status corretamente', () => {
    const result = groupJobsByStatus(jobs)
    const scheduled = result.find((r) => r.status === 'pending')
    const completed = result.find((r) => r.status === 'completed')
    const inProgress = result.find((r) => r.status === 'in_progress')
    expect(scheduled?.count).toBe(2)
    expect(completed?.count).toBe(1)
    expect(inProgress?.count).toBe(1)
  })
})

const contracts: ExpiringContract[] = [
  { id: '1', clientName: 'Empresa A', expiresAt: '2026-04-05', daysUntilExpiry: 16 },
  { id: '2', clientName: 'Empresa B', expiresAt: '2026-05-01', daysUntilExpiry: 42 },
  { id: '3', clientName: 'Empresa C', expiresAt: '2026-04-15', daysUntilExpiry: 26 },
  { id: '4', clientName: 'Empresa D', expiresAt: '2026-03-10', daysUntilExpiry: -10 },
]

describe('filterExpiringContracts', () => {
  it('filtra contratos expirando nos próximos 30 dias', () => {
    const result = filterExpiringContracts(contracts, 30)
    expect(result).toHaveLength(2)
    expect(result.map((c) => c.id)).toContain('1')
    expect(result.map((c) => c.id)).toContain('3')
  })

  it('exclui contratos já vencidos (daysUntilExpiry < 0)', () => {
    const result = filterExpiringContracts(contracts, 30)
    expect(result.map((c) => c.id)).not.toContain('4')
  })
})
