import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { EmployeeListPage } from '@/views/pages/EmployeeListPage'
import { useEmployeeStore } from '@/viewmodels/employee.viewmodel'
import type { Employee } from '@/models/employee.model'

jest.mock('@/viewmodels/employee.viewmodel')

const mockEmployees: Employee[] = [
  {
    id: '1',
    userId: 'u1',
    name: 'Maria Silva',
    email: 'maria@example.com',
    phone: '11999999999',
    role: 'manager',
    salary: 8000,
    hiredAt: '2026-01-01T00:00:00Z',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: '2',
    userId: 'u2',
    name: 'João Souza',
    email: 'joao@example.com',
    phone: '11988888888',
    role: 'employee',
    salary: 3000,
    hiredAt: '2026-01-01T00:00:00Z',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
]

const mockLoad = jest.fn()
const mockRemove = jest.fn()
const mockSetSearch = jest.fn()

function setupStore(overrides: Partial<ReturnType<typeof useEmployeeStore>> = {}) {
  ;(useEmployeeStore as unknown as jest.Mock).mockReturnValue({
    load: mockLoad,
    filtered: () => mockEmployees,
    remove: mockRemove,
    loading: false,
    error: null,
    search: '',
    setSearch: mockSetSearch,
    ...overrides,
  })
}

function renderPage(initialPath = '/employees') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/employees" element={<EmployeeListPage />} />
        <Route path="/employees/new" element={<div>Novo Funcionário Page</div>} />
        <Route path="/employees/:id/edit" element={<div>Edit Employee Page</div>} />
      </Routes>
    </MemoryRouter>
  )
}

beforeEach(() => {
  jest.clearAllMocks()
  setupStore()
})

it('calls load on mount', () => {
  renderPage()
  expect(mockLoad).toHaveBeenCalledTimes(1)
})

it('renders employee rows in the table', () => {
  renderPage()
  expect(screen.getByText('Maria Silva')).toBeInTheDocument()
  expect(screen.getByText('João Souza')).toBeInTheDocument()
  expect(screen.getByText('Gestor')).toBeInTheDocument()
  expect(screen.getByText('Funcionário')).toBeInTheDocument()
})

it('shows Adicionar Funcionário button and navigates to new page', async () => {
  renderPage()
  fireEvent.click(screen.getByText('Adicionar Funcionário'))
  await waitFor(() => {
    expect(screen.getByText('Novo Funcionário Page')).toBeInTheDocument()
  })
})

it('navigates to edit page when row is clicked', async () => {
  renderPage()
  fireEvent.click(screen.getByText('Maria Silva'))
  await waitFor(() => {
    expect(screen.getByText('Edit Employee Page')).toBeInTheDocument()
  })
})

it('navigates to edit page via Editar icon', async () => {
  renderPage()
  const menuButtons = screen.getAllByLabelText('Ações')
  fireEvent.click(menuButtons[0])
  fireEvent.click(screen.getAllByText('Editar')[0])
  await waitFor(() => {
    expect(screen.getByText('Edit Employee Page')).toBeInTheDocument()
  })
})

it('filters by role using MultiSelect', () => {
  renderPage()
  fireEvent.click(screen.getByText('Função'))
  const opts = screen.getAllByText('Gestor')
  fireEvent.click(opts[0])
  expect(screen.getByText('Maria Silva')).toBeInTheDocument()
  expect(screen.queryByText('João Souza')).not.toBeInTheDocument()
})

it('updates search value via input', () => {
  renderPage()
  const input = screen.getByPlaceholderText('Buscar por nome ou e-mail…')
  fireEvent.change(input, { target: { value: 'Maria' } })
  expect(mockSetSearch).toHaveBeenCalledWith('Maria')
})

it('shows clear filters button and clears filters', () => {
  setupStore({ search: 'foo' })
  renderPage()
  fireEvent.click(screen.getByText('Limpar filtros'))
  expect(mockSetSearch).toHaveBeenCalledWith('')
})

it('removes employee after confirm dialog is accepted', async () => {
  jest.spyOn(window, 'confirm').mockReturnValue(true)
  renderPage()
  const menuButtons = screen.getAllByLabelText('Ações')
  fireEvent.click(menuButtons[0])
  fireEvent.click(screen.getAllByText('Excluir')[0])
  await waitFor(() => {
    expect(mockRemove).toHaveBeenCalledWith('1')
  })
  ;(window.confirm as jest.Mock).mockRestore()
})

it('does not remove employee when confirm dialog is dismissed', () => {
  jest.spyOn(window, 'confirm').mockReturnValue(false)
  renderPage()
  const menuButtons = screen.getAllByLabelText('Ações')
  fireEvent.click(menuButtons[0])
  fireEvent.click(screen.getAllByText('Excluir')[0])
  expect(mockRemove).not.toHaveBeenCalled()
  ;(window.confirm as jest.Mock).mockRestore()
})

it('shows loading skeleton when loading', () => {
  setupStore({ loading: true, filtered: () => [] })
  const { container } = renderPage()
  expect(container.querySelector('.animate-pulse')).toBeInTheDocument()
})

it('shows error alert when error is set', () => {
  setupStore({ error: 'Erro ao carregar funcionários', loading: false })
  renderPage()
  expect(screen.getByRole('alert')).toHaveTextContent('Erro ao carregar funcionários')
})

it('shows empty state when no employees', () => {
  setupStore({ filtered: () => [] })
  renderPage()
  expect(screen.getByText(/nenhum funcionário/i)).toBeInTheDocument()
})
