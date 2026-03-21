import api from '@/services/api'
import type { Transaction, TransactionFormData } from '@/models/transaction.model'

export async function fetchTransactions(): Promise<Transaction[]> {
  const { data } = await api.get<Transaction[]>('/transactions')
  return data
}

export async function createTransaction(formData: TransactionFormData): Promise<Transaction> {
  const { data } = await api.post<Transaction>('/transactions', formData)
  return data
}

export async function removeTransaction(id: string): Promise<void> {
  await api.delete(`/transactions/${id}`)
}
