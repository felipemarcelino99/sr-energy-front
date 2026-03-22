import { useEmployeeStore } from '@/viewmodels/employee.viewmodel'
import type { Employee } from '@/models/employee.model'

jest.mock('@/services/employee.service', () => ({
  fetchEmployees: jest.fn(),
  createEmployee: jest.fn(),
  updateEmployee: jest.fn(),
  removeEmployee: jest.fn(),
  fetchSalaryAdjustments: jest.fn(),
  createSalaryAdjustment: jest.fn(),
  removeSalaryAdjustment: jest.fn(),
}))

import * as employeeService from '@/services/employee.service'
const { fetchSalaryAdjustments, createSalaryAdjustment, removeSalaryAdjustment } = employeeService as jest.Mocked<typeof employeeService>

const mockEmployee: Employee = {
  id: '1',
  userId: null,
  name: 'Ana Silva',
  email: 'ana@example.com',
  phone: '11999999999',
  role: 'employee',
  salary: 5000,
  hiredAt: '2024-01-15',
  createdAt: '2024-01-15',
  updatedAt: '2024-01-15',
}

const formData = {
  name: 'Ana Silva',
  email: 'ana@example.com',
  phone: '11999999999',
  role: 'employee' as const,
  salary: 5000,
  hiredAt: '2024-01-15',
}

beforeEach(() => {
  useEmployeeStore.setState({ employees: [], loading: false, error: null, search: '' })
  jest.clearAllMocks()
})

describe('employee.viewmodel — create', () => {
  it('chama o service e adiciona ao store', async () => {
    ;(employeeService.createEmployee as jest.Mock).mockResolvedValue({ ...mockEmployee, id: '1' })
    await useEmployeeStore.getState().create(formData)
    expect(employeeService.createEmployee).toHaveBeenCalledWith(formData)
    expect(useEmployeeStore.getState().employees).toHaveLength(1)
  })
})

describe('employee.viewmodel — update', () => {
  it('chama o service e atualiza o store', async () => {
    const updated = { ...mockEmployee, name: 'Ana Costa' }
    useEmployeeStore.setState({ employees: [mockEmployee] })
    ;(employeeService.updateEmployee as jest.Mock).mockResolvedValue(updated)
    await useEmployeeStore.getState().update('1', { ...formData, name: 'Ana Costa' })
    expect(employeeService.updateEmployee).toHaveBeenCalled()
    const emp = useEmployeeStore.getState().employees.find((e) => e.id === '1')
    expect(emp?.name).toBe('Ana Costa')
  })
})

describe('employee.viewmodel — remove', () => {
  it('chama o service e remove do store', async () => {
    useEmployeeStore.setState({ employees: [mockEmployee] })
    ;(employeeService.removeEmployee as jest.Mock).mockResolvedValue(undefined)
    await useEmployeeStore.getState().remove('1')
    expect(employeeService.removeEmployee).toHaveBeenCalledWith('1')
    expect(useEmployeeStore.getState().employees).toHaveLength(0)
  })
})

describe('employee.viewmodel — filtro de busca', () => {
  const employees: Employee[] = [
    { ...mockEmployee, id: '1', name: 'Ana Silva', email: 'ana@example.com' },
    { ...mockEmployee, id: '2', name: 'Bob Santos', email: 'bob@example.com' },
    { ...mockEmployee, id: '3', name: 'Carlos Ana', email: 'carlos@example.com' },
  ]

  beforeEach(() => {
    useEmployeeStore.setState({ employees })
  })

  it('retorna todos quando busca está vazia', () => {
    useEmployeeStore.setState({ search: '' })
    expect(useEmployeeStore.getState().filtered()).toHaveLength(3)
  })

  it('filtra por nome (case insensitive)', () => {
    useEmployeeStore.setState({ search: 'ana' })
    const result = useEmployeeStore.getState().filtered()
    expect(result).toHaveLength(2)
    expect(result.map((e) => e.name)).toContain('Ana Silva')
    expect(result.map((e) => e.name)).toContain('Carlos Ana')
  })

  it('retorna vazio quando nenhum resultado', () => {
    useEmployeeStore.setState({ search: 'xyz' })
    expect(useEmployeeStore.getState().filtered()).toHaveLength(0)
  })
})

describe('salary adjustments', () => {
  beforeEach(() => {
    useEmployeeStore.setState({
      adjustments: [],
      adjustmentsLoading: false,
      adjustmentsError: null,
    })
  })

  it('loadAdjustments populates adjustments state', async () => {
    const mockAdjs = [
      { id: '1', employeeId: 'e1', previousSalary: 3000, newSalary: 3500, reason: 'Aumento anual', adjustedAt: '2024-01-01' },
    ]
    ;(fetchSalaryAdjustments as jest.Mock).mockResolvedValue(mockAdjs)

    await useEmployeeStore.getState().loadAdjustments('e1')

    expect(useEmployeeStore.getState().adjustments).toEqual(mockAdjs)
    expect(useEmployeeStore.getState().adjustmentsLoading).toBe(false)
  })

  it('loadAdjustments sets adjustmentsError on failure', async () => {
    ;(fetchSalaryAdjustments as jest.Mock).mockRejectedValue(new Error('Network error'))

    await useEmployeeStore.getState().loadAdjustments('e1')

    expect(useEmployeeStore.getState().adjustmentsError).toBe('Network error')
    expect(useEmployeeStore.getState().adjustmentsLoading).toBe(false)
  })

  it('addAdjustment prepends new adjustment to state', async () => {
    const newAdj = { id: '2', employeeId: 'e1', previousSalary: 3500, newSalary: 4000, reason: 'Promoção', adjustedAt: '2024-06-01' }
    ;(createSalaryAdjustment as jest.Mock).mockResolvedValue(newAdj)
    useEmployeeStore.setState({ adjustments: [] })

    await useEmployeeStore.getState().addAdjustment('e1', { newSalary: 4000, reason: 'Promoção' })

    expect(useEmployeeStore.getState().adjustments[0]).toEqual(newAdj)
  })

  it('removeAdjustment removes the entry from state', async () => {
    const adj = { id: '1', employeeId: 'e1', previousSalary: 3000, newSalary: 3500, reason: 'Aumento anual', adjustedAt: '2024-01-01' }
    useEmployeeStore.setState({ adjustments: [adj] })

    await useEmployeeStore.getState().removeAdjustment('1')

    expect(useEmployeeStore.getState().adjustments).toHaveLength(0)
  })
})
