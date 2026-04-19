import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { JobFormPage } from '@/views/pages/JobFormPage'
import { useJobStore } from '@/viewmodels/job.viewmodel'
import { useMachineStore } from '@/viewmodels/machine.viewmodel'
import { useEmployeeStore } from '@/viewmodels/employee.viewmodel'

jest.mock('@/viewmodels/job.viewmodel')
jest.mock('@/viewmodels/machine.viewmodel')
jest.mock('@/viewmodels/employee.viewmodel')
jest.mock('@/services/job.service', () => ({ fetchJob: jest.fn() }))

beforeEach(() => {
  ;(useJobStore as unknown as jest.Mock).mockReturnValue({ create: jest.fn(), update: jest.fn() })
  ;(useMachineStore as unknown as jest.Mock).mockReturnValue({ machines: [], load: jest.fn() })
  ;(useEmployeeStore as unknown as jest.Mock).mockReturnValue({ employees: [], load: jest.fn() })
})

it('renderiza link "Voltar à listagem" apontando para /jobs', () => {
  render(
    <MemoryRouter initialEntries={['/jobs/new']}>
      <Routes><Route path="/jobs/new" element={<JobFormPage />} /></Routes>
    </MemoryRouter>
  )
  const link = screen.getByRole('link', { name: /voltar/i })
  expect(link).toHaveAttribute('href', '/jobs')
})

it('o wrapper principal não tem classe max-w-xl', () => {
  const { container } = render(
    <MemoryRouter initialEntries={['/jobs/new']}>
      <Routes><Route path="/jobs/new" element={<JobFormPage />} /></Routes>
    </MemoryRouter>
  )
  expect(container.querySelector('.max-w-xl')).not.toBeInTheDocument()
  expect(container.querySelector('.max-w-2xl')).not.toBeInTheDocument()
})
