import { create } from 'zustand'
import type { Transaction, JobSummary, ExpiringContract, FinancialSummary, JobStatusSummary, ContractStatusSummary, BagCertificateStatusSummary } from '@/models/dashboard.model'
import { calcFinancialSummary, groupJobsByStatus, filterExpiringContracts, groupContractsByStatus, groupBagsByCertificateStatus } from '@/models/dashboard.model'
import type { Bag } from '@/models/bag.model'
import { fetchTransactions, fetchJobs, fetchExpiringContracts } from '@/services/dashboard.service'
import { fetchBags } from '@/services/bag.service'

interface DashboardState {
  transactions: Transaction[]
  jobs: JobSummary[]
  expiringContracts: ExpiringContract[]
  bags: Bag[]
  loading: boolean
  error: string | null

  // Computed selectors
  financialSummary: () => FinancialSummary
  jobStatusSummary: () => JobStatusSummary[]
  contractsExpiringSoon: () => ExpiringContract[]
  contractStatusSummary: () => ContractStatusSummary[]
  bagCertificateStatusSummary: () => BagCertificateStatusSummary[]

  // Actions
  loadDashboard: () => Promise<void>
  filterJobsByEmployee: (employeeId: string) => JobSummary[]
  filterJobsByStatus: (status: string) => JobSummary[]
}

export const useDashboardStore = create<DashboardState>((set, get) => ({
  transactions: [],
  jobs: [],
  expiringContracts: [],
  bags: [],
  loading: false,
  error: null,

  financialSummary: () => calcFinancialSummary(get().transactions),
  jobStatusSummary: () => groupJobsByStatus(get().jobs),
  contractsExpiringSoon: () => filterExpiringContracts(get().expiringContracts, 30),
  contractStatusSummary: () => groupContractsByStatus(get().expiringContracts),
  bagCertificateStatusSummary: () => groupBagsByCertificateStatus(get().bags),

  loadDashboard: async () => {
    set({ loading: true, error: null })
    try {
      const [transactions, jobs, expiringContracts, bags] = await Promise.all([
        fetchTransactions(),
        fetchJobs(),
        fetchExpiringContracts(),
        fetchBags(),
      ])
      set({ transactions, jobs, expiringContracts, bags, loading: false })
    } catch (err) {
      set({ error: (err as Error).message, loading: false })
    }
  },

  filterJobsByEmployee: (employeeId) =>
    get().jobs.filter((j) => j.employeeId === employeeId),

  filterJobsByStatus: (status) =>
    get().jobs.filter((j) => j.status === status),
}))
