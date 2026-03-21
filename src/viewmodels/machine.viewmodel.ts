import { create } from 'zustand'
import type { Machine, MachineFormData } from '@/models/machine.model'
import {
  fetchMachines,
  createMachine,
  updateMachine,
  removeMachine,
  uploadMachineManual,
} from '@/services/machine.service'

interface MachineState {
  machines: Machine[]
  loading: boolean
  error: string | null
  search: string

  load: () => Promise<void>
  create: (data: MachineFormData) => Promise<void>
  update: (id: string, data: Partial<MachineFormData>) => Promise<void>
  remove: (id: string) => Promise<void>
  uploadManual: (id: string, file: File) => Promise<void>
  setSearch: (query: string) => void
  filtered: () => Machine[]
}

export const useMachineStore = create<MachineState>((set, get) => ({
  machines: [],
  loading: false,
  error: null,
  search: '',

  load: async () => {
    set({ loading: true, error: null })
    try {
      const machines = await fetchMachines()
      set({ machines, loading: false })
    } catch (err) {
      set({ error: (err as Error).message, loading: false })
    }
  },

  create: async (data) => {
    const machine = await createMachine(data)
    set((s) => ({ machines: [...s.machines, machine] }))
  },

  update: async (id, data) => {
    const updated = await updateMachine(id, data)
    set((s) => ({
      machines: s.machines.map((m) => (m.id === id ? updated : m)),
    }))
  },

  remove: async (id) => {
    await removeMachine(id)
    set((s) => ({ machines: s.machines.filter((m) => m.id !== id) }))
  },

  uploadManual: async (id, file) => {
    const url = await uploadMachineManual(id, file)
    const updated = await updateMachine(id, { manualUrl: url })
    set((s) => ({
      machines: s.machines.map((m) => (m.id === id ? updated : m)),
    }))
  },

  setSearch: (query) => set({ search: query }),

  filtered: () => {
    const { machines, search } = get()
    if (!search.trim()) return machines
    const q = search.toLowerCase()
    return machines.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.brand.toLowerCase().includes(q) ||
        m.model.toLowerCase().includes(q)
    )
  },
}))
