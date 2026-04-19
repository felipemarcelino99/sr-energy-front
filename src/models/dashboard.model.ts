export interface FinancialSummary {
  totalIncome: number
  totalExpense: number
  balance: number
}

export type JobStatus = 'scheduled' | 'pending' | 'in_progress' | 'completed' | 'cancelled'

export interface JobStatusSummary {
  status: JobStatus
  count: number
}

export interface ExpiringContract {
  id: string
  clientName: string
  expiresAt: string // ISO date
  daysUntilExpiry: number
}

export interface Transaction {
  id: string
  type: 'credit' | 'debit'
  amount: number
  description: string
  date: string // ISO date
}

export interface JobSummary {
  id: string
  title: string
  status: JobStatus
  employeeId: string
  employeeName: string
  scheduledAt: string // ISO date
}

export function calcFinancialSummary(transactions: Transaction[]): FinancialSummary {
  const totalIncome = transactions
    .filter((t) => t.type === 'credit')
    .reduce((sum, t) => sum + t.amount, 0)
  const totalExpense = transactions
    .filter((t) => t.type === 'debit')
    .reduce((sum, t) => sum + t.amount, 0)
  return { totalIncome, totalExpense, balance: totalIncome - totalExpense }
}

export function groupJobsByStatus(jobs: JobSummary[]): JobStatusSummary[] {
  const map = new Map<JobStatus, number>()
  for (const job of jobs) {
    map.set(job.status, (map.get(job.status) ?? 0) + 1)
  }
  return Array.from(map.entries()).map(([status, count]) => ({ status, count }))
}

export function filterExpiringContracts(
  contracts: ExpiringContract[],
  withinDays = 30
): ExpiringContract[] {
  return contracts.filter((c) => c.daysUntilExpiry >= 0 && c.daysUntilExpiry <= withinDays)
}

export interface ContractStatusSummary {
  status: 'expiring' | 'expired'
  count: number
}

export function groupContractsByStatus(contracts: ExpiringContract[]): ContractStatusSummary[] {
  const expiring = contracts.filter((c) => c.daysUntilExpiry >= 0 && c.daysUntilExpiry <= 30).length
  const expired = contracts.filter((c) => c.daysUntilExpiry < 0).length
  const result: ContractStatusSummary[] = []
  if (expiring > 0) result.push({ status: 'expiring', count: expiring })
  if (expired > 0) result.push({ status: 'expired', count: expired })
  return result
}

export interface EmployeeDashboardData {
  myJobs: JobSummary[]
  nextJob: JobSummary | null
}

export function getNextJob(
  jobs: JobSummary[],
  now: string = new Date().toISOString().slice(0, 10)
): JobSummary | null {
  const upcoming = jobs
    .filter((j) => j.scheduledAt >= now && !['cancelled', 'completed', 'in_progress'].includes(j.status))
    .sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt))
  return upcoming[0] ?? null
}
