import { create } from 'zustand'
import type { Bag, BagFormData } from '@/models/bag.model'
import { isCertificateExpiringSoon } from '@/models/bag.model'
import { fetchBags, createBag, updateBag, removeBag, uploadCertificate, removeCertificate } from '@/services/bag.service'

interface BagState {
  bags: Bag[]
  loading: boolean
  error: string | null
  search: string

  load: () => Promise<void>
  create: (data: BagFormData) => Promise<void>
  update: (id: string, data: Partial<BagFormData>) => Promise<void>
  remove: (id: string) => Promise<void>
  uploadCert: (bagId: string, file: File, expiryDate: string) => Promise<void>
  removeCert: (bagId: string, certId: string) => Promise<void>
  setSearch: (q: string) => void
  filtered: () => Bag[]
  expiringSoon: () => Bag[]
}

export const useBagStore = create<BagState>((set, get) => ({
  bags: [],
  loading: false,
  error: null,
  search: '',

  load: async () => {
    set({ loading: true, error: null })
    try {
      const bags = await fetchBags()
      set({ bags, loading: false })
    } catch (err) {
      set({ error: (err as Error).message, loading: false })
    }
  },

  create: async (data) => {
    const bag = await createBag(data)
    set((s) => ({ bags: [...s.bags, bag] }))
  },

  update: async (id, data) => {
    const updated = await updateBag(id, data)
    set((s) => ({ bags: s.bags.map((b) => (b.id === id ? updated : b)) }))
  },

  remove: async (id) => {
    await removeBag(id)
    set((s) => ({ bags: s.bags.filter((b) => b.id !== id) }))
  },

  uploadCert: async (bagId, file, expiryDate) => {
    const updated = await uploadCertificate(bagId, file, expiryDate)
    set((s) => ({ bags: s.bags.map((b) => (b.id === bagId ? updated : b)) }))
  },

  removeCert: async (bagId, certId) => {
    const updated = await removeCertificate(bagId, certId)
    set((s) => ({ bags: s.bags.map((b) => (b.id === bagId ? updated : b)) }))
  },

  setSearch: (q) => set({ search: q }),

  filtered: () => {
    const { bags, search } = get()
    const q = search.toLowerCase()
    if (!q) return bags
    return bags.filter(
      (b) => b.name.toLowerCase().includes(q) || b.model.toLowerCase().includes(q),
    )
  },

  expiringSoon: () => {
    return get().bags.filter((b) =>
      b.calibrationCertificates.some((c) => isCertificateExpiringSoon(c.expiryDate)),
    )
  },
}))
