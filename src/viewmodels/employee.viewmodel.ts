import { create } from 'zustand'
import type { Employee, EmployeeFormData } from '@/models/employee.model'
import type { SalaryAdjustment, SalaryAdjustmentFormData } from '@/models/salary-adjustment.model'
import {
  fetchEmployees,
  createEmployee,
  updateEmployee,
  removeEmployee,
  fetchSalaryAdjustments,
  createSalaryAdjustment,
  removeSalaryAdjustment,
} from '@/services/employee.service'

interface EmployeeState {
  employees: Employee[]
  loading: boolean
  error: string | null
  search: string

  adjustments: SalaryAdjustment[]
  adjustmentsLoading: boolean
  adjustmentsError: string | null

  load: () => Promise<void>
  create: (data: EmployeeFormData) => Promise<void>
  update: (id: string, data: EmployeeFormData) => Promise<void>
  remove: (id: string) => Promise<void>
  setSearch: (query: string) => void
  filtered: () => Employee[]

  loadAdjustments: (employeeId: string) => Promise<void>
  addAdjustment: (employeeId: string, data: SalaryAdjustmentFormData) => Promise<void>
  removeAdjustment: (id: string) => Promise<void>
}

export const useEmployeeStore = create<EmployeeState>((set, get) => ({
  employees: [],
  loading: false,
  error: null,
  search: '',

  adjustments: [],
  adjustmentsLoading: false,
  adjustmentsError: null,

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

  loadAdjustments: async (employeeId) => {
    set({ adjustmentsLoading: true, adjustmentsError: null })
    try {
      const adjustments = await fetchSalaryAdjustments(employeeId)
      set({ adjustments, adjustmentsLoading: false })
    } catch (err) {
      set({ adjustmentsError: (err as Error).message, adjustmentsLoading: false })
    }
  },

  addAdjustment: async (employeeId, data) => {
    const adj = await createSalaryAdjustment(employeeId, data)
    set((s) => ({ adjustments: [adj, ...s.adjustments] }))
  },

  removeAdjustment: async (id) => {
    await removeSalaryAdjustment(id)
    set((s) => ({ adjustments: s.adjustments.filter((a) => a.id !== id) }))
  },
}))
