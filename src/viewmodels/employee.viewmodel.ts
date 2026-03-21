import { create } from 'zustand'
import type { Employee, EmployeeFormData } from '@/models/employee.model'
import {
  fetchEmployees,
  createEmployee,
  updateEmployee,
  removeEmployee,
} from '@/services/employee.service'

interface EmployeeState {
  employees: Employee[]
  loading: boolean
  error: string | null
  search: string

  load: () => Promise<void>
  create: (data: EmployeeFormData) => Promise<void>
  update: (id: string, data: EmployeeFormData) => Promise<void>
  remove: (id: string) => Promise<void>
  setSearch: (query: string) => void
  filtered: () => Employee[]
}

export const useEmployeeStore = create<EmployeeState>((set, get) => ({
  employees: [],
  loading: false,
  error: null,
  search: '',

  load: async () => {
    set({ loading: true, error: null })
    try {
      const employees = await fetchEmployees()
      set({ employees, loading: false })
    } catch (err) {
      set({ error: (err as Error).message, loading: false })
    }
  },

  create: async (data) => {
    const employee = await createEmployee(data)
    set((s) => ({ employees: [...s.employees, employee] }))
  },

  update: async (id, data) => {
    const updated = await updateEmployee(id, data)
    set((s) => ({
      employees: s.employees.map((e) => (e.id === id ? updated : e)),
    }))
  },

  remove: async (id) => {
    await removeEmployee(id)
    set((s) => ({ employees: s.employees.filter((e) => e.id !== id) }))
  },

  setSearch: (query) => set({ search: query }),

  filtered: () => {
    const { employees, search } = get()
    if (!search.trim()) return employees
    const q = search.toLowerCase()
    return employees.filter(
      (e) => e.name.toLowerCase().includes(q) || e.email.toLowerCase().includes(q)
    )
  },
}))
