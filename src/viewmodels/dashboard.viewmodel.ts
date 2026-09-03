import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import type { Transaction, JobSummary, ExpiringContract } from '@/models/dashboard.model'
import {
  calcFinancialSummary,
  groupJobsByStatus,
  filterExpiringContracts,
  groupContractsByStatus,
  groupBagsByCertificateStatus,
} from '@/models/dashboard.model'
import type { Bag } from '@/models/bag.model'
import { fetchTransactions, fetchJobs, fetchExpiringContracts } from '@/services/dashboard.service'
import { fetchBags } from '@/services/bag.service'

export const transactionsQueryKey = ['dashboard', 'transactions'] as const
export const dashboardJobsQueryKey = ['dashboard', 'jobs'] as const
export const expiringContractsQueryKey = ['dashboard', 'expiring-contracts'] as const
export const bagsQueryKey = ['dashboard', 'bags'] as const

// Stable references so the `?? []` fallback doesn't create a new array
// identity on every render (which would defeat the useMemo below).
const EMPTY_TRANSACTIONS: Transaction[] = []
const EMPTY_JOBS: JobSummary[] = []
const EMPTY_CONTRACTS: ExpiringContract[] = []
const EMPTY_BAGS: Bag[] = []

/**
 * Server state (transactions/jobs/contracts/bags) via TanStack Query, with
 * computed selectors memoized on top. Public shape kept stable so consumers
 * that mock this hook wholesale (page tests) don't need to change.
 */
export function useDashboardStore() {
  const transactionsQuery = useQuery({ queryKey: transactionsQueryKey, queryFn: fetchTransactions })
  const jobsQuery = useQuery({ queryKey: dashboardJobsQueryKey, queryFn: fetchJobs })
  const expiringContractsQuery = useQuery({
    queryKey: expiringContractsQueryKey,
    queryFn: fetchExpiringContracts,
  })
  const bagsQuery = useQuery({ queryKey: bagsQueryKey, queryFn: fetchBags })

  const transactions: Transaction[] = transactionsQuery.data ?? EMPTY_TRANSACTIONS
  const jobs: JobSummary[] = jobsQuery.data ?? EMPTY_JOBS
  const expiringContracts: ExpiringContract[] = expiringContractsQuery.data ?? EMPTY_CONTRACTS
  const bags: Bag[] = bagsQuery.data ?? EMPTY_BAGS

  const queries = [transactionsQuery, jobsQuery, expiringContractsQuery, bagsQuery]
  const loading = queries.some((q) => q.isLoading)
  const firstError = queries.find((q) => q.isError)?.error as Error | undefined
  const error = firstError ? firstError.message : null

  const financialSummaryMemo = useMemo(() => calcFinancialSummary(transactions), [transactions])
  const jobStatusSummaryMemo = useMemo(() => groupJobsByStatus(jobs), [jobs])
  const contractsExpiringSoonMemo = useMemo(
    () => filterExpiringContracts(expiringContracts, 30),
    [expiringContracts]
  )
  const contractStatusSummaryMemo = useMemo(
    () => groupContractsByStatus(expiringContracts),
    [expiringContracts]
  )
  const bagCertificateStatusSummaryMemo = useMemo(() => groupBagsByCertificateStatus(bags), [bags])

  return {
    transactions,
    jobs,
    expiringContracts,
    bags,
    loading,
    error,

    financialSummary: () => financialSummaryMemo,
    jobStatusSummary: () => jobStatusSummaryMemo,
    contractsExpiringSoon: () => contractsExpiringSoonMemo,
    contractStatusSummary: () => contractStatusSummaryMemo,
    bagCertificateStatusSummary: () => bagCertificateStatusSummaryMemo,

    loadDashboard: async () => {
      await Promise.all(queries.map((q) => q.refetch()))
    },
    filterJobsByEmployee: (employeeId: string) => jobs.filter((j) => j.employeeId === employeeId),
    filterJobsByStatus: (status: string) => jobs.filter((j) => j.status === status),
  }
}
