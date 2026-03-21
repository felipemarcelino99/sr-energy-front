import { create } from 'zustand'
import type { Transaction, TransactionFormData, TransactionType } from '@/models/transaction.model'
import { calcSummary, groupByMonth } from '@/models/transaction.model'
import { fetchTransactions, createTransaction, removeTransaction } from '@/services/transaction.service'

interface TransactionFilters {
  type?: TransactionType
  category?: string
  month?: string
}

interface TransactionState {
  transactions: Transaction[]
  loading: boolean
  error: string | null
  filters: TransactionFilters

  load: () => Promise<void>
  create: (data: TransactionFormData) => Promise<void>
  remove: (id: string) => Promise<void>
  setFilters: (filters: TransactionFilters) => void
  filtered: () => Transaction[]
  summary: () => ReturnType<typeof calcSummary>
  monthly: () => ReturnType<typeof groupByMonth>
}

export const useTransactionStore = create<TransactionState>((set, get) => ({
  transactions: [],
  loading: false,
  error: null,
  filters: {},

  load: async () => {
    set({ loading: true, error: null })
    try {
      const transactions = await fetchTransactions()
      set({ transactions, loading: false })
    } catch (err) {
      set({ error: (err as Error).message, loading: false })
    }
  },

  create: async (data) => {
    const transaction = await createTransaction(data)
    set((s) => ({ transactions: [...s.transactions, transaction] }))
  },

  remove: async (id) => {
    await removeTransaction(id)
    set((s) => ({ transactions: s.transactions.filter((t) => t.id !== id) }))
  },

  setFilters: (filters) => set({ filters }),

  filtered: () => {
    const { transactions, filters } = get()
    return transactions.filter((t) => {
      if (filters.type && t.type !== filters.type) return false
      if (filters.category && t.category !== filters.category) return false
      if (filters.month && !t.date.startsWith(filters.month)) return false
      return true
    })
  },

  summary: () => calcSummary(get().filtered()),
  monthly: () => groupByMonth(get().transactions),
}))
