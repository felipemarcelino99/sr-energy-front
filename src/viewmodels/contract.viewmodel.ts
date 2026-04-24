import { create } from 'zustand'
import type { Contract, ContractFormData, ContractStatus, ContractType } from '@/models/contract.model'
import { getContractStatus } from '@/models/contract.model'
import {
  fetchContracts,
  createContract,
  updateContract,
  removeContract,
} from '@/services/contract.service'

interface ContractState {
  contracts: Contract[]
  loading: boolean
  error: string | null
  search: string
  statusFilter: ContractStatus | undefined
  typeFilter: ContractType | undefined
  recurringFilter: boolean | undefined
  sortField: 'endDate' | 'clientId' | 'startDate'
  sortOrder: 'asc' | 'desc'

  load: () => Promise<void>
  create: (data: ContractFormData) => Promise<void>
  update: (id: string, data: Partial<ContractFormData>) => Promise<void>
  remove: (id: string) => Promise<void>
  terminate: (id: string) => Promise<void>
  setSearch: (q: string) => void
  setStatusFilter: (s: ContractStatus | undefined) => void
  setTypeFilter: (t: ContractType | undefined) => void
  setRecurringFilter: (r: boolean | undefined) => void
  setSort: (field: 'endDate' | 'clientId' | 'startDate', order: 'asc' | 'desc') => void
  filtered: () => Contract[]
}

export const useContractStore = create<ContractState>((set, get) => ({
  contracts: [],
  loading: false,
  error: null,
  search: '',
  statusFilter: undefined,
  typeFilter: undefined,
  recurringFilter: undefined,
  sortField: 'endDate' as const,
  sortOrder: 'asc',

  load: async () => {
    set({ loading: true, error: null })
    try {
      const contracts = await fetchContracts()
      set({ contracts, loading: false })
    } catch (err) {
      set({ error: (err as Error).message, loading: false })
    }
  },

  create: async (data) => {
    const contract = await createContract(data)
    set((s) => ({ contracts: [...s.contracts, contract] }))
  },

  update: async (id, data) => {
    const updated = await updateContract(id, data)
    set((s) => ({
      contracts: s.contracts.map((c) => (c.id === id ? updated : c)),
    }))
  },

  remove: async (id) => {
    await removeContract(id)
    set((s) => ({ contracts: s.contracts.filter((c) => c.id !== id) }))
  },

  terminate: async (id) => {
    const today = new Date().toISOString().split('T')[0]
    const updated = await updateContract(id, { endDate: today })
    set((s) => ({
      contracts: s.contracts.map((c) => (c.id === id ? updated : c)),
    }))
  },

  setSearch: (q) => set({ search: q }),
  setStatusFilter: (s) => set({ statusFilter: s }),
  setTypeFilter: (t) => set({ typeFilter: t }),
  setRecurringFilter: (r) => set({ recurringFilter: r }),
  setSort: (sortField, sortOrder) => set({ sortField, sortOrder }),

  filtered: () => {
    const { contracts, search, statusFilter, typeFilter, recurringFilter, sortField, sortOrder } = get()
    const q = search.toLowerCase()
    return [...contracts]
      .filter((c) => {
        if (q && !(c.client?.razaoSocial ?? '').toLowerCase().includes(q) && !(c.client?.cnpj ?? '').includes(q)) return false
        if (statusFilter && getContractStatus(c.endDate) !== statusFilter) return false
        if (typeFilter && c.contractType !== typeFilter) return false
        if (recurringFilter !== undefined && c.recurring !== recurringFilter) return false
        return true
      })
      .sort((a, b) => {
        const valA = a[sortField]
        const valB = b[sortField]
        const cmp = valA < valB ? -1 : valA > valB ? 1 : 0
        return sortOrder === 'asc' ? cmp : -cmp
      })
  },
}))
