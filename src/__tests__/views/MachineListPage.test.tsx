import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { MachineListPage } from '@/views/pages/MachineListPage'
import { useMachineStore } from '@/viewmodels/machine.viewmodel'
import type { Machine } from '@/models/machine.model'

jest.mock('@/viewmodels/machine.viewmodel')

const mockMachines: Machine[] = [
  {
    id: '1',
    name: 'Gerador A',
    brand: 'Marca X',
    model: 'GX-1000',
    serialNumber: 'SN-001',
    year: 2020,
    manualUrl: 'https://example.com/manual.pdf',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: '2',
    name: 'Compressor B',
    brand: 'Marca Y',
    model: 'CY-2000',
    serialNumber: 'SN-002',
    year: 2022,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
]

const mockLoad = jest.fn()
const mockRemove = jest.fn()
const mockSetSearch = jest.fn()

function setupStore(overrides: Partial<ReturnType<typeof useMachineStore>> = {}) {
  ;(useMachineStore as unknown as jest.Mock).mockReturnValue({
    load: mockLoad,
    filtered: () => mockMachines,
    remove: mockRemove,
    loading: false,
    error: null,
    search: '',
    setSearch: mockSetSearch,
    ...overrides,
  })
}

function renderPage(initialPath = '/machines') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/machines" element={<MachineListPage />} />
        <Route path="/machines/new" element={<div>Nova Máquina Page</div>} />
        <Route path="/machines/:id/edit" element={<div>Edit Machine Page</div>} />
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

it('renders machine rows in the table', () => {
  renderPage()
  expect(screen.getByText('Gerador A')).toBeInTheDocument()
  expect(screen.getByText('Compressor B')).toBeInTheDocument()
  expect(screen.getByText('Marca X')).toBeInTheDocument()
  expect(screen.getByText('SN-001')).toBeInTheDocument()
})

it('shows Adicionar Máquina link', () => {
  renderPage()
  expect(screen.getByText('Adicionar Máquina')).toBeInTheDocument()
})

it('navigates to edit page when row is clicked', async () => {
  renderPage()
  fireEvent.click(screen.getByText('Gerador A'))
  await waitFor(() => {
    expect(screen.getByText('Edit Machine Page')).toBeInTheDocument()
  })
})

it('navigates to edit page via Editar icon', async () => {
  renderPage()
  const editButtons = screen.getAllByTitle('Editar')
  fireEvent.click(editButtons[0])
  await waitFor(() => {
    expect(screen.getByText('Edit Machine Page')).toBeInTheDocument()
  })
})

it('renders manual download link when manualUrl exists', () => {
  renderPage()
  expect(screen.getByTitle('Baixar manual')).toBeInTheDocument()
})

it('updates search value via input', () => {
  renderPage()
  const input = screen.getByPlaceholderText('Buscar por nome, marca ou modelo...')
  fireEvent.change(input, { target: { value: 'Gerador' } })
  expect(mockSetSearch).toHaveBeenCalledWith('Gerador')
})

it('shows clear button when search is set and clears it', () => {
  setupStore({ search: 'foo' })
  renderPage()
  fireEvent.click(screen.getByText('Limpar'))
  expect(mockSetSearch).toHaveBeenCalledWith('')
})

it('opens delete confirmation modal and confirms delete', async () => {
  renderPage()
  const deleteButtons = screen.getAllByTitle('Excluir')
  fireEvent.click(deleteButtons[0])
  expect(screen.getByText('Confirmar exclusão')).toBeInTheDocument()
  const confirmButtons = screen.getAllByRole('button', { name: 'Excluir' })
  fireEvent.click(confirmButtons[confirmButtons.length - 1])
  await waitFor(() => {
    expect(mockRemove).toHaveBeenCalledWith('1')
  })
})

it('cancels delete confirmation', () => {
  renderPage()
  const deleteButtons = screen.getAllByTitle('Excluir')
  fireEvent.click(deleteButtons[0])
  fireEvent.click(screen.getByText('Cancelar'))
  expect(screen.queryByText('Confirmar exclusão')).not.toBeInTheDocument()
})

it('shows loading spinner when loading', () => {
  setupStore({ loading: true, filtered: () => [] })
  renderPage()
  expect(document.querySelector('.loading')).toBeInTheDocument()
})

it('shows error message when error is set', () => {
  setupStore({ error: 'Erro ao carregar máquinas', loading: false })
  renderPage()
  expect(screen.getByText('Erro ao carregar máquinas')).toBeInTheDocument()
})

it('shows empty state when no machines', () => {
  setupStore({ filtered: () => [] })
  renderPage()
  expect(screen.getByText(/nenhuma máquina/i)).toBeInTheDocument()
})
