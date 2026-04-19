import { render } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { EmployeeFormPage } from '@/views/pages/EmployeeFormPage'
import { useEmployeeStore } from '@/viewmodels/employee.viewmodel'

jest.mock('@/viewmodels/employee.viewmodel')
jest.mock('@/services/employee.service', () => ({
  fetchEmployee: jest.fn(),
  fetchSalaryAdjustments: jest.fn().mockResolvedValue([]),
}))

beforeEach(() => {
  ;(useEmployeeStore as unknown as jest.Mock).mockReturnValue({
    create: jest.fn(), update: jest.fn(), loading: false,
    adjustments: [], adjustmentsLoading: false,
    loadAdjustments: jest.fn().mockResolvedValue(undefined),
    addAdjustment: jest.fn(),
  })
})

it('o wrapper principal não contém classe max-w-xl', () => {
  const { container } = render(
    <MemoryRouter initialEntries={['/employees/new']}>
      <Routes><Route path="/employees/new" element={<EmployeeFormPage />} /></Routes>
    </MemoryRouter>
  )
  expect(container.querySelector('.max-w-xl')).not.toBeInTheDocument()
})
