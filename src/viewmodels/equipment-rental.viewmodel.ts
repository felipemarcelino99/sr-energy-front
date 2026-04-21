import { create } from 'zustand'
import type { EquipmentRental, EquipmentRentalFormData } from '@/models/equipment-rental.model'
import {
  fetchEquipmentRentals,
  createEquipmentRental,
  updateEquipmentRental,
  removeEquipmentRental,
} from '@/services/equipment-rental.service'

interface EquipmentRentalState {
  rentals: EquipmentRental[]
  loading: boolean
  error: string | null
  search: string
  contractFilter: string

  load: () => Promise<void>
  create: (data: EquipmentRentalFormData) => Promise<void>
  update: (id: string, data: Partial<EquipmentRentalFormData>) => Promise<void>
  remove: (id: string) => Promise<void>
  setSearch: (q: string) => void
  setContractFilter: (id: string) => void
  filtered: () => EquipmentRental[]
}

export const useEquipmentRentalStore = create<EquipmentRentalState>((set, get) => ({
  rentals: [],
  loading: false,
  error: null,
  search: '',
  contractFilter: '',

  load: async () => {
    set({ loading: true, error: null })
    try {
      const rentals = await fetchEquipmentRentals()
      set({ rentals, loading: false })
    } catch (err) {
      set({ error: (err as Error).message, loading: false })
    }
  },

  create: async (data) => {
    const rental = await createEquipmentRental(data)
    set((s) => ({ rentals: [...s.rentals, rental] }))
  },

  update: async (id, data) => {
    const updated = await updateEquipmentRental(id, data)
    set((s) => ({ rentals: s.rentals.map((r) => (r.id === id ? updated : r)) }))
  },

  remove: async (id) => {
    await removeEquipmentRental(id)
    set((s) => ({ rentals: s.rentals.filter((r) => r.id !== id) }))
  },

  setSearch: (q) => set({ search: q }),
  setContractFilter: (id) => set({ contractFilter: id }),

  filtered: () => {
    const { rentals, search, contractFilter } = get()
    const q = search.toLowerCase()
    return rentals.filter((r) => {
      if (contractFilter && r.contractId !== contractFilter) return false
      if (q && !(r.contractClientName ?? '').toLowerCase().includes(q) && !(r.bagName ?? '').toLowerCase().includes(q)) return false
      return true
    })
  },
}))
