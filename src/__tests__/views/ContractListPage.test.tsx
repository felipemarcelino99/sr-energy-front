import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { ContractListPage } from '@/views/pages/ContractListPage'
import { useContractStore } from '@/viewmodels/contract.viewmodel'
import type { Contract } from '@/models/contract.model'

jest.mock('@/viewmodels/contract.viewmodel')

const activeEndDate = new Date(Date.now() + 1000 * 60 * 60 * 24 * 365).toISOString()
const expiredEndDate = new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString()

const mockContracts: Contract[] = [
  {
    id: '1',
    number: 'C-001',
    clientId: 'cl1',
    client: { id: 'cl1', razaoSocial: 'Cliente A', cnpj: '00.000.000/0001-00' },
    description: 'Serviço de manutenção',
    startDate: '2026-01-01T00:00:00Z',
    endDate: activeEndDate,
    fileUrl: 'https://example.com/file.pdf',
    recurring: true,
    contractType: 'service',
    contractValue: 1000,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: '2',
    number: 'C-002',
    clientId: 'cl2',
    client: { id: 'cl2', razaoSocial: 'Cliente B', cnpj: '11.111.111/0001-11' },
    description: 'Locação de equipamento',
    startDate: '2025-01-01T00:00:00Z',
    endDate: expiredEndDate,
    recurring: false,
    contractType: 'rental',
    contractValue: 2000,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
]

const mockLoad = jest.fn()
const mockRemove = jest.fn()
const mockTerminate = jest.fn()
const mockSetSearch = jest.fn()
const mockSetStatusFilter = jest.fn()
const mockSetTypeFilter = jest.fn()
const mockSetRecurringFilter = jest.fn()

function setupStore(overrides: Partial<ReturnType<typeof useContractStore>> = {}) {
  ;(useContractStore as unknown as jest.Mock).mockReturnValue({
    load: mockLoad,
    filtered: () => mockContracts,
    remove: mockRemove,
    terminate: mockTerminate,
    loading: false,
    error: null,
    search: '',
    setSearch: mockSetSearch,
    setStatusFilter: mockSetStatusFilter,
    setTypeFilter: mockSetTypeFilter,
    setRecurringFilter: mockSetRecurringFilter,
    ...overrides,
  })
}

function renderPage(initialPath = '/contracts') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/contracts" element={<ContractListPage />} />
        <Route path="/contracts/new" element={<div>Novo Contrato Page</div>} />
        <Route path="/contracts/:id/edit" element={<div>Edit Contract Page</div>} />
      </Routes>
    </MemoryRouter>
  )
}

beforeEach(() => {
  jest.clearAllMocks()
  setupStore()
})

it('calls load and resets store filters on mount', () => {
  renderPage()
  expect(mockLoad).toHaveBeenCalledTimes(1)
  expect(mockSetStatusFilter).toHaveBeenCalledWith(undefined)
  expect(mockSetTypeFilter).toHaveBeenCalledWith(undefined)
  expect(mockSetRecurringFilter).toHaveBeenCalledWith(undefined)
})

it('renders contract rows in the table', () => {
  renderPage()
  expect(screen.getByText('Cliente A')).toBeInTheDocument()
  expect(screen.getByText('Cliente B')).toBeInTheDocument()
  expect(screen.getByText('Serviço')).toBeInTheDocument()
  expect(screen.getByText('Locação')).toBeInTheDocument()
})

it('shows Adicionar Contrato link', () => {
  renderPage()
  expect(screen.getByText('Adicionar Contrato')).toBeInTheDocument()
})

it('navigates to edit page when row is clicked', async () => {
  renderPage()
  fireEvent.click(screen.getByText('Cliente A'))
  await waitFor(() => {
    expect(screen.getByText('Edit Contract Page')).toBeInTheDocument()
  })
})

it('navigates to edit page via Editar icon', async () => {
  renderPage()
  const menuButtons = screen.getAllByLabelText('Ações')
  fireEvent.click(menuButtons[0])
  fireEvent.click(screen.getAllByText('Editar')[0])
  await waitFor(() => {
    expect(screen.getByText('Edit Contract Page')).toBeInTheDocument()
  })
})

it('filters by type using MultiSelect', () => {
  renderPage()
  fireEvent.click(screen.getByText('Tipo'))
  fireEvent.click(screen.getAllByText('Locação')[0])
  expect(screen.getByText('Cliente B')).toBeInTheDocument()
  expect(screen.queryByText('Cliente A')).not.toBeInTheDocument()
})

it('filters by recurring using MultiSelect', () => {
  renderPage()
  fireEvent.click(screen.getByText('Recorrência'))
  fireEvent.click(screen.getAllByText('Recorrente')[0])
  expect(screen.getByText('Cliente A')).toBeInTheDocument()
  expect(screen.queryByText('Cliente B')).not.toBeInTheDocument()
})

it('updates search value via input', () => {
  renderPage()
  const input = screen.getByPlaceholderText('Buscar por cliente ou CNPJ...')
  fireEvent.change(input, { target: { value: 'Cliente A' } })
  expect(mockSetSearch).toHaveBeenCalledWith('Cliente A')
})

it('opens delete confirmation and confirms delete', async () => {
  renderPage()
  const menuButtons = screen.getAllByLabelText('Ações')
  fireEvent.click(menuButtons[0])
  fireEvent.click(screen.getAllByText('Excluir')[0])
  expect(screen.getByText('Confirmar exclusão')).toBeInTheDocument()
  const confirmButtons = screen.getAllByRole('button', { name: 'Excluir' })
  fireEvent.click(confirmButtons[confirmButtons.length - 1])
  await waitFor(() => {
    expect(mockRemove).toHaveBeenCalledWith('1')
  })
})

it('cancels delete confirmation', () => {
  renderPage()
  const menuButtons = screen.getAllByLabelText('Ações')
  fireEvent.click(menuButtons[0])
  fireEvent.click(screen.getAllByText('Excluir')[0])
  fireEvent.click(screen.getByText('Cancelar'))
  expect(screen.queryByText('Confirmar exclusão')).not.toBeInTheDocument()
})

it('opens terminate modal and confirms termination for active contract', async () => {
  renderPage()
  const menuButtons = screen.getAllByLabelText('Ações')
  fireEvent.click(menuButtons[0])
  fireEvent.click(screen.getAllByText('Encerrar contrato')[0])
  expect(screen.getByText('Encerrar contrato', { selector: 'h3' })).toBeInTheDocument()
  const confirmTerminateButtons = screen.getAllByRole('button', { name: 'Encerrar' })
  fireEvent.click(confirmTerminateButtons[confirmTerminateButtons.length - 1])
  await waitFor(() => {
    expect(mockTerminate).toHaveBeenCalledWith('1')
  })
})

it('cancels terminate modal', () => {
  renderPage()
  const menuButtons = screen.getAllByLabelText('Ações')
  fireEvent.click(menuButtons[0])
  fireEvent.click(screen.getAllByText('Encerrar contrato')[0])
  fireEvent.click(screen.getByText('Cancelar'))
  expect(
    screen.queryByText('Esta ação definirá a data de término como hoje. Confirmar?')
  ).not.toBeInTheDocument()
})

it('shows loading skeleton when loading', () => {
  setupStore({ loading: true, filtered: () => [] })
  renderPage()
  expect(document.querySelector('.animate-pulse')).toBeInTheDocument()
})

it('shows error message when error is set', () => {
  setupStore({ error: 'Erro ao carregar contratos', loading: false })
  renderPage()
  expect(screen.getByText('Erro ao carregar contratos')).toBeInTheDocument()
})

it('shows empty state when no contracts', () => {
  setupStore({ filtered: () => [] })
  renderPage()
  expect(screen.getByText(/nenhum contrato/i)).toBeInTheDocument()
})
