import { create } from 'zustand'
import type { Client, ClientFormData } from '@/models/client.model'
import {
  fetchClients,
  createClient,
  updateClient,
  removeClient,
} from '@/services/client.service'

interface ClientState {
  clients: Client[]
  loading: boolean
  error: string | null
  search: string

  load: () => Promise<void>
  create: (data: ClientFormData) => Promise<void>
  update: (id: string, data: Partial<ClientFormData>) => Promise<void>
  remove: (id: string) => Promise<void>
  setSearch: (q: string) => void
  filtered: () => Client[]
}

export const useClientStore = create<ClientState>((set, get) => ({
  clients: [],
  loading: false,
  error: null,
  search: '',

  load: async () => {
    set({ loading: true, error: null })
    try {
      const clients = await fetchClients()
      set({ clients, loading: false })
    } catch (err) {
      set({ error: (err as Error).message, loading: false })
    }
  },

  create: async (data) => {
    const client = await createClient(data)
    set((s) => ({ clients: [...s.clients, client] }))
  },

  update: async (id, data) => {
    const updated = await updateClient(id, data)
    set((s) => ({
      clients: s.clients.map((c) => (c.id === id ? updated : c)),
    }))
  },

  remove: async (id) => {
    await removeClient(id)
    set((s) => ({ clients: s.clients.filter((c) => c.id !== id) }))
  },

  setSearch: (q) => set({ search: q }),

  filtered: () => {
    const { clients, search } = get()
    const q = search.toLowerCase()
    if (!q) return clients
    return clients.filter(
      (c) =>
        c.razaoSocial.toLowerCase().includes(q) ||
        c.cnpj.includes(q)
    )
  },
}))
