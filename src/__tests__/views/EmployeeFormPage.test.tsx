import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { EmployeeFormPage } from '@/views/pages/EmployeeFormPage'
import { useEmployeeStore } from '@/viewmodels/employee.viewmodel'
import { fetchEmployee } from '@/services/employee.service'
import { fetchJobs } from '@/services/job.service'

jest.mock('@/viewmodels/employee.viewmodel')
jest.mock('@/services/employee.service', () => ({
  fetchEmployee: jest.fn(),
  fetchSalaryAdjustments: jest.fn().mockResolvedValue([]),
}))
jest.mock('@/services/job.service', () => ({
  fetchJobs: jest.fn().mockResolvedValue([]),
}))

const mockCreate = jest.fn().mockResolvedValue(undefined)
const mockUpdate = jest.fn().mockResolvedValue(undefined)
const mockLoadAdjustments = jest.fn().mockResolvedValue(undefined)
const mockAddAdjustment = jest.fn().mockResolvedValue(undefined)

const editEmployee = {
  id: 'e1',
  name: 'Ana Silva',
  email: 'ana@example.com',
  phone: '11999999999',
  role: 'employee',
  cnpj: '',
  salary: 5000,
  hiredAt: '2024-01-15',
}

function renderCreate() {
  return render(
    <MemoryRouter initialEntries={['/employees/new']}>
      <Routes>
        <Route path="/employees/new" element={<EmployeeFormPage />} />
        <Route path="/employees" element={<div>Employees List</div>} />
      </Routes>
    </MemoryRouter>
  )
}

function renderEdit(id = 'e1') {
  return render(
    <MemoryRouter initialEntries={[`/employees/${id}/edit`]}>
      <Routes>
        <Route path="/employees/:id/edit" element={<EmployeeFormPage />} />
        <Route path="/employees" element={<div>Employees List</div>} />
      </Routes>
    </MemoryRouter>
  )
}

beforeEach(() => {
  jest.clearAllMocks()
  ;(useEmployeeStore as unknown as jest.Mock).mockReturnValue({
    create: mockCreate,
    update: mockUpdate,
    loading: false,
    adjustments: [],
    adjustmentsLoading: false,
    loadAdjustments: mockLoadAdjustments,
    addAdjustment: mockAddAdjustment,
  })
  ;(fetchEmployee as jest.Mock).mockResolvedValue(editEmployee)
})

it('o wrapper principal não contém classe max-w-xl', () => {
  const { container } = render(
    <MemoryRouter initialEntries={['/employees/new']}>
      <Routes>
        <Route path="/employees/new" element={<EmployeeFormPage />} />
      </Routes>
    </MemoryRouter>
  )
  expect(container.querySelector('.max-w-xl')).not.toBeInTheDocument()
})

it('does not show tabs in create mode', () => {
  renderCreate()
  expect(screen.queryByRole('tab')).not.toBeInTheDocument()
  expect(screen.getByText('Criar')).toBeInTheDocument()
})

it('shows validation errors when submitting empty required fields', async () => {
  renderCreate()
  fireEvent.click(screen.getByText('Criar'))
  await waitFor(() => {
    expect(screen.getByTestId('error-name')).toBeInTheDocument()
    expect(screen.getByTestId('error-salary')).toBeInTheDocument()
  })
  expect(mockCreate).not.toHaveBeenCalled()
})

it('calls create on valid submit and navigates to /employees', async () => {
  renderCreate()
  fireEvent.change(screen.getByLabelText(/nome/i), { target: { value: 'João Souza' } })
  fireEvent.change(screen.getByLabelText(/e-mail/i), { target: { value: 'joao@example.com' } })
  fireEvent.change(screen.getByLabelText(/telefone/i), { target: { value: '11988887777' } })
  fireEvent.change(screen.getByLabelText(/salário/i), { target: { value: '4000' } })
  fireEvent.change(screen.getByLabelText(/contratação/i), { target: { value: '2026-01-01' } })

  fireEvent.click(screen.getByText('Criar'))
  await waitFor(() => {
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'João Souza', email: 'joao@example.com', salary: 4000 })
    )
  })
  await waitFor(() => {
    expect(screen.getByText('Employees List')).toBeInTheDocument()
  })
})

it('navigates to /employees on cancel without calling create', async () => {
  renderCreate()
  fireEvent.click(screen.getByText('Cancelar'))
  await waitFor(() => {
    expect(screen.getByText('Employees List')).toBeInTheDocument()
  })
  expect(mockCreate).not.toHaveBeenCalled()
})

it('pre-fills form and shows tabs in edit mode, calling update on submit', async () => {
  renderEdit()
  await waitFor(() => {
    expect(screen.getByLabelText(/nome/i)).toHaveValue('Ana Silva')
  })
  expect(screen.getByRole('tab', { name: /dados/i })).toBeInTheDocument()
  expect(screen.getByRole('tab', { name: /^os$/i })).toBeInTheDocument()
  expect(screen.getByRole('tab', { name: /reajustes/i })).toBeInTheDocument()

  fireEvent.click(screen.getByText('Salvar'))
  await waitFor(() => {
    expect(mockUpdate).toHaveBeenCalledWith(
      'e1',
      expect.objectContaining({ name: 'Ana Silva', email: 'ana@example.com' })
    )
  })
})

it('switches to the "trabalhos" tab and lists jobs for the employee', async () => {
  ;(fetchJobs as jest.Mock).mockResolvedValue([
    {
      id: 'j1',
      employeeId: 'e1',
      description: 'Manutenção preventiva',
      status: 'completed',
      jobType: 'maintenance',
      machineName: 'Máquina 1',
      city: 'São Paulo',
      state: 'SP',
      scheduledDate: '2026-01-10',
    },
    {
      id: 'j2',
      employeeId: 'other',
      description: 'Não deve aparecer',
      status: 'pending',
      jobType: 'deployment',
      machineName: 'Máquina 2',
      city: 'Rio',
      state: 'RJ',
      scheduledDate: '2026-01-11',
    },
  ])
  renderEdit()
  await waitFor(() => {
    expect(screen.getByLabelText(/nome/i)).toHaveValue('Ana Silva')
  })
  fireEvent.click(screen.getByRole('tab', { name: /^os$/i }))
  await waitFor(() => {
    expect(screen.getByText('Manutenção preventiva')).toBeInTheDocument()
  })
  expect(screen.queryByText('Não deve aparecer')).not.toBeInTheDocument()
})

it('switches to the "reajustes" tab and submits a salary adjustment', async () => {
  renderEdit()
  await waitFor(() => {
    expect(screen.getByLabelText(/nome/i)).toHaveValue('Ana Silva')
  })
  fireEvent.click(screen.getByRole('tab', { name: /reajustes/i }))

  fireEvent.change(screen.getByLabelText(/novo salário/i), { target: { value: '6000' } })
  fireEvent.change(screen.getByLabelText(/motivo/i), { target: { value: 'Promoção' } })
  fireEvent.click(screen.getByRole('button', { name: /registrar reajuste/i }))

  await waitFor(() => {
    expect(mockAddAdjustment).toHaveBeenCalledWith(
      'e1',
      expect.objectContaining({ reason: 'Promoção' })
    )
  })
})
