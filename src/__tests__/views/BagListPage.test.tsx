import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { BagListPage } from '@/views/pages/BagListPage'
import { useBagStore } from '@/viewmodels/bag.viewmodel'
import type { Bag } from '@/models/bag.model'

jest.mock('@/viewmodels/bag.viewmodel')

const futureDate = new Date(Date.now() + 1000 * 60 * 60 * 24 * 365).toISOString()
const pastDate = new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString()
const soonDate = new Date(Date.now() + 1000 * 60 * 60 * 24 * 5).toISOString()

const mockBags: Bag[] = [
  {
    id: '1',
    name: 'Mala Elétrica',
    model: 'ME-100',
    quantity: 3,
    calibrationCertificates: [{ id: 'c1', fileUrl: 'x', expiryDate: futureDate }],
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: '2',
    name: 'Mala Vencida',
    model: 'MV-200',
    quantity: 1,
    calibrationCertificates: [{ id: 'c2', fileUrl: 'x', expiryDate: pastDate }],
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: '3',
    name: 'Mala Vencendo',
    model: 'MW-300',
    quantity: 2,
    calibrationCertificates: [{ id: 'c3', fileUrl: 'x', expiryDate: soonDate }],
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: '4',
    name: 'Mala Sem Cert',
    model: 'MS-400',
    quantity: 5,
    calibrationCertificates: [],
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
]

const mockLoad = jest.fn()
const mockRemove = jest.fn()
const mockSetSearch = jest.fn()

function setupStore(overrides: Partial<ReturnType<typeof useBagStore>> = {}) {
  ;(useBagStore as unknown as jest.Mock).mockReturnValue({
    load: mockLoad,
    filtered: () => mockBags,
    remove: mockRemove,
    loading: false,
    error: null,
    search: '',
    setSearch: mockSetSearch,
    ...overrides,
  })
}

function renderPage(initialPath = '/bags') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/bags" element={<BagListPage />} />
        <Route path="/bags/new" element={<div>Nova Mala Page</div>} />
        <Route path="/bags/:id/edit" element={<div>Edit Bag Page</div>} />
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

it('renders bag rows in the table', () => {
  renderPage()
  expect(screen.getByText('Mala Elétrica')).toBeInTheDocument()
  expect(screen.getByText('Mala Vencida')).toBeInTheDocument()
  expect(screen.getByText('Mala Vencendo')).toBeInTheDocument()
  expect(screen.getByText('Mala Sem Cert')).toBeInTheDocument()
})

it('shows certificate status badges', () => {
  renderPage()
  expect(screen.getByText('Válido')).toBeInTheDocument()
  expect(screen.getByText('Vencido')).toBeInTheDocument()
  expect(screen.getByText('Vencendo')).toBeInTheDocument()
})

it('shows Nova Mala link', () => {
  renderPage()
  expect(screen.getByText('Nova Mala')).toBeInTheDocument()
})

it('navigates to edit page when row is clicked', async () => {
  renderPage()
  fireEvent.click(screen.getByText('Mala Elétrica'))
  await waitFor(() => {
    expect(screen.getByText('Edit Bag Page')).toBeInTheDocument()
  })
})

it('navigates to edit page when Editar icon is clicked', async () => {
  renderPage()
  const menuButtons = screen.getAllByLabelText('Ações')
  fireEvent.click(menuButtons[0])
  fireEvent.click(screen.getAllByText('Editar')[0])
  await waitFor(() => {
    expect(screen.getByText('Edit Bag Page')).toBeInTheDocument()
  })
})

it('filters by certificate status using MultiSelect', () => {
  renderPage()
  fireEvent.click(screen.getByText('Status de certificado'))
  fireEvent.click(screen.getAllByText('Vencido')[0])
  expect(screen.getByText('Mala Vencida')).toBeInTheDocument()
  expect(screen.queryByText('Mala Elétrica')).not.toBeInTheDocument()
})

it('updates search value via input', () => {
  renderPage()
  const input = screen.getByPlaceholderText('Buscar por nome ou modelo…')
  fireEvent.change(input, { target: { value: 'Elétrica' } })
  expect(mockSetSearch).toHaveBeenCalledWith('Elétrica')
})

it('shows clear filters button when search is set and clears it', () => {
  setupStore({ search: 'foo' })
  renderPage()
  fireEvent.click(screen.getByText('Limpar filtros'))
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
  setupStore({ error: 'Erro ao carregar', loading: false })
  renderPage()
  expect(screen.getByText('Erro ao carregar')).toBeInTheDocument()
})

it('shows empty state when no bags', () => {
  setupStore({ filtered: () => [] })
  renderPage()
  expect(screen.getByText(/nenhuma mala/i)).toBeInTheDocument()
})
