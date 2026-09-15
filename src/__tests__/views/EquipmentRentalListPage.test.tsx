import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { EquipmentRentalListPage } from '@/views/pages/EquipmentRentalListPage'
import { useEquipmentRentalStore } from '@/viewmodels/equipment-rental.viewmodel'
import type { EquipmentRental } from '@/models/equipment-rental.model'

jest.mock('@/viewmodels/equipment-rental.viewmodel')

const mockRentals: EquipmentRental[] = [
  {
    id: '1',
    contractId: 'c1',
    contractClientName: 'Cliente A',
    bagId: 'b1',
    bagName: 'Mala Elétrica',
    startDate: '2026-01-01T00:00:00Z',
    endDate: '2026-02-01T00:00:00Z',
    value: 1500,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: '2',
    contractId: 'c2',
    contractClientName: 'Cliente B',
    bagId: 'b2',
    bagName: 'Mala Hidráulica',
    startDate: '2026-03-01T00:00:00Z',
    endDate: '2026-04-01T00:00:00Z',
    value: 2500,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
]

const mockLoad = jest.fn()
const mockRemove = jest.fn()
const mockSetSearch = jest.fn()

function setupStore(overrides: Partial<ReturnType<typeof useEquipmentRentalStore>> = {}) {
  ;(useEquipmentRentalStore as unknown as jest.Mock).mockReturnValue({
    load: mockLoad,
    filtered: () => mockRentals,
    remove: mockRemove,
    loading: false,
    error: null,
    search: '',
    setSearch: mockSetSearch,
    ...overrides,
  })
}

function renderPage(initialPath = '/equipment-rentals') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/equipment-rentals" element={<EquipmentRentalListPage />} />
        <Route path="/equipment-rentals/new" element={<div>Nova Locação Page</div>} />
        <Route path="/equipment-rentals/:id/edit" element={<div>Edit Rental Page</div>} />
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

it('renders rental rows in the table', () => {
  renderPage()
  expect(screen.getByText('Cliente A')).toBeInTheDocument()
  expect(screen.getByText('Cliente B')).toBeInTheDocument()
  expect(screen.getByText('Mala Elétrica')).toBeInTheDocument()
  expect(screen.getByText('Mala Hidráulica')).toBeInTheDocument()
})

it('shows Nova Locação link', () => {
  renderPage()
  expect(screen.getByText('Nova Locação')).toBeInTheDocument()
})

it('navigates to edit page when row is clicked', async () => {
  renderPage()
  fireEvent.click(screen.getByText('Cliente A'))
  await waitFor(() => {
    expect(screen.getByText('Edit Rental Page')).toBeInTheDocument()
  })
})

it('navigates to edit page via Editar icon', async () => {
  renderPage()
  const menuButtons = screen.getAllByLabelText('Ações')
  fireEvent.click(menuButtons[0])
  fireEvent.click(screen.getAllByText('Editar')[0])
  await waitFor(() => {
    expect(screen.getByText('Edit Rental Page')).toBeInTheDocument()
  })
})

it('updates search value via input', () => {
  renderPage()
  const input = screen.getByPlaceholderText('Buscar por cliente ou mala…')
  fireEvent.change(input, { target: { value: 'Cliente A' } })
  expect(mockSetSearch).toHaveBeenCalledWith('Cliente A')
})

it('shows clear button when search is set and clears it', () => {
  setupStore({ search: 'foo' })
  renderPage()
  fireEvent.click(screen.getByText('Limpar'))
  expect(mockSetSearch).toHaveBeenCalledWith('')
})

it('opens delete confirmation modal and confirms delete', async () => {
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

it('shows loading skeleton when loading', () => {
  setupStore({ loading: true, filtered: () => [] })
  renderPage()
  expect(document.querySelector('.animate-pulse')).toBeInTheDocument()
})

it('shows error message when error is set', () => {
  setupStore({ error: 'Erro ao carregar locações', loading: false })
  renderPage()
  expect(screen.getByText('Erro ao carregar locações')).toBeInTheDocument()
})

it('shows empty state when no rentals', () => {
  setupStore({ filtered: () => [] })
  renderPage()
  expect(screen.getByText(/nenhuma locação/i)).toBeInTheDocument()
})
