import api from '@/services/api'
import type { Employee, EmployeeFormData } from '@/models/employee.model'
import type { SalaryAdjustment, SalaryAdjustmentFormData } from '@/models/salary-adjustment.model'

export async function fetchEmployees(): Promise<Employee[]> {
  const { data } = await api.get<Employee[]>('/employees')
  return data
}

export async function fetchEmployee(id: string): Promise<Employee> {
  const { data } = await api.get<Employee>(`/employees/${id}`)
  return data
}

export async function createEmployee(formData: EmployeeFormData): Promise<Employee> {
  const { data } = await api.post<Employee>('/employees', formData)
  return data
}

export async function updateEmployee(id: string, formData: EmployeeFormData): Promise<Employee> {
  const { data } = await api.put<Employee>(`/employees/${id}`, formData)
  return data
}

export async function removeEmployee(id: string): Promise<void> {
  await api.delete(`/employees/${id}`)
}

export async function fetchSalaryAdjustments(employeeId: string): Promise<SalaryAdjustment[]> {
  const { data } = await api.get<SalaryAdjustment[]>(`/employees/${employeeId}/salary-adjustments`)
  return data
}

export async function createSalaryAdjustment(
  employeeId: string,
  formData: SalaryAdjustmentFormData
): Promise<SalaryAdjustment> {
  const { data } = await api.post<SalaryAdjustment>(
    `/employees/${employeeId}/salary-adjustments`,
    formData
  )
  return data
}

export async function removeSalaryAdjustment(id: string): Promise<void> {
  await api.delete(`/salary-adjustments/${id}`)
}
