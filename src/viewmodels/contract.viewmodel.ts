import { create } from 'zustand'
import type { Contract, ContractFormData } from '@/models/contract.model'
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

  load: () => Promise<void>
  create: (data: ContractFormData) => Promise<void>
  update: (id: string, data: Partial<ContractFormData>) => Promise<void>
  remove: (id: string) => Promise<void>
}

export const useContractStore = create<ContractState>((set) => ({
  contracts: [],
  loading: false,
  error: null,

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
}))
