import api from '@/services/api'
import type { Transaction, JobSummary, ExpiringContract } from '@/models/dashboard.model'
import { jobTypeLabel, type Job } from '@/models/job.model'

export async function fetchTransactions(): Promise<Transaction[]> {
  const { data } = await api.get<Transaction[]>('/transactions')
  return data
}

export async function fetchJobs(): Promise<JobSummary[]> {
  const { data } = await api.get<Job[]>('/jobs')
  return data.map((job) => ({
    id: job.id,
    title: jobTypeLabel(job.jobType),
    status: job.status,
    employeeId: job.employeeId,
    employeeName: job.employeeName,
    scheduledAt: job.scheduledDate,
  }))
}

interface ContractExpirySummary {
  id: string
  clientName: string
  endDate: string
}

export async function fetchExpiringContracts(): Promise<ExpiringContract[]> {
  const { data } = await api.get<ContractExpirySummary[]>('/contracts')
  const today = new Date()
  return data.map((c) => {
    const end = new Date(c.endDate)
    const daysUntilExpiry = Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    return {
      id: c.id,
      clientName: c.clientName,
      expiresAt: c.endDate,
      daysUntilExpiry,
    }
  })
}
