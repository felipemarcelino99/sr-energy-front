import api from '@/services/api'
import type { Transaction, JobSummary, ExpiringContract } from '@/models/dashboard.model'
import type { Job } from '@/models/job.model'

export async function fetchTransactions(): Promise<Transaction[]> {
  const { data } = await api.get<Transaction[]>('/transactions')
  return data
}

export async function fetchJobs(): Promise<JobSummary[]> {
  const { data } = await api.get<Job[]>('/jobs')
  return data.map((job) => ({
    id: job.id,
    title: job.description,
    status: job.status,
    employeeId: job.employeeId,
    employeeName: job.employeeName,
    scheduledAt: job.scheduledDate,
  }))
}

export async function fetchExpiringContracts(): Promise<ExpiringContract[]> {
  const { data } = await api.get<ExpiringContract[]>('/contracts/expiring')
  return data
}
