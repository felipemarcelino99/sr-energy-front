import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { ToolListPage } from '@/views/pages/tools/ToolListPage'
import { useToolStore } from '@/viewmodels/tool.viewmodel'
import type { Tool } from '@/models/tool.model'

jest.mock('@/viewmodels/tool.viewmodel')

const mockTools: Tool[] = [
  {
    id: '1',
    name: 'Chave de Fenda',
    description: 'Chave philips',
    status: 'active',
    quantity: 10,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: '2',
    name: 'Martelo',
    description: undefined,
    status: 'inactive',
    quantity: 5,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
]

const mockFetchTools = jest.fn()
const mockRemoveTool = jest.fn()
const mockUpdateTool = jest.fn()

function renderPage(initialPath = '/tools') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/tools" element={<ToolListPage />} />
        <Route path="/tools/new" element={<div>Nova Ferramenta Page</div>} />
        <Route path="/tools/:id/edit" element={<div>Edit Page</div>} />
      </Routes>
    </MemoryRouter>
  )
}

beforeEach(() => {
  jest.clearAllMocks()
  ;(useToolStore as unknown as jest.Mock).mockReturnValue({
    tools: mockTools,
    loading: false,
    error: null,
    fetchTools: mockFetchTools,
    removeTool: mockRemoveTool,
    updateTool: mockUpdateTool,
  })
})

it('calls fetchTools on mount', () => {
  renderPage()
  expect(mockFetchTools).toHaveBeenCalledTimes(1)
})

it('renders tool rows in the table', () => {
  renderPage()
  expect(screen.getByText('Chave de Fenda')).toBeInTheDocument()
  expect(screen.getByText('Martelo')).toBeInTheDocument()
})

it('renders active badge for active tool', () => {
  renderPage()
  expect(screen.getByText('Ativo')).toBeInTheDocument()
})

it('renders inactive badge for inactive tool', () => {
  renderPage()
  expect(screen.getByText('Inativo')).toBeInTheDocument()
})

it('shows Nova Ferramenta button', () => {
  renderPage()
  expect(screen.getByText('Nova Ferramenta')).toBeInTheDocument()
})

it('navigates to /tools/new when Nova Ferramenta is clicked', async () => {
  renderPage()
  fireEvent.click(screen.getByText('Nova Ferramenta'))
  await waitFor(() => {
    expect(screen.getByText('Nova Ferramenta Page')).toBeInTheDocument()
  })
})

it('navigates to edit page when Editar is clicked', async () => {
  renderPage()
  const editButtons = screen.getAllByTitle('Editar')
  fireEvent.click(editButtons[0])
  await waitFor(() => {
    expect(screen.getByText('Edit Page')).toBeInTheDocument()
  })
})

it('filters to active tools when Ativo option selected in the MultiSelect', () => {
  renderPage()
  fireEvent.click(screen.getByText('Status'))
  fireEvent.click(screen.getAllByText('Ativo')[0])
  expect(screen.getByText('Chave de Fenda')).toBeInTheDocument()
  expect(screen.queryByText('Martelo')).not.toBeInTheDocument()
})

it('filters to inactive tools when Inativo option selected in the MultiSelect', () => {
  renderPage()
  fireEvent.click(screen.getByText('Status'))
  fireEvent.click(screen.getAllByText('Inativo')[0])
  expect(screen.getByText('Martelo')).toBeInTheDocument()
  expect(screen.queryByText('Chave de Fenda')).not.toBeInTheDocument()
})

it('shows all tools when no status filter is selected', () => {
  renderPage()
  expect(screen.getByText('Chave de Fenda')).toBeInTheDocument()
  expect(screen.getByText('Martelo')).toBeInTheDocument()
})

it('shows loading spinner when loading', () => {
  ;(useToolStore as unknown as jest.Mock).mockReturnValue({
    tools: [],
    loading: true,
    error: null,
    fetchTools: mockFetchTools,
    removeTool: mockRemoveTool,
    updateTool: mockUpdateTool,
  })
  renderPage()
  expect(document.querySelector('.loading')).toBeInTheDocument()
})

it('shows empty state when no tools', () => {
  ;(useToolStore as unknown as jest.Mock).mockReturnValue({
    tools: [],
    loading: false,
    error: null,
    fetchTools: mockFetchTools,
    removeTool: mockRemoveTool,
    updateTool: mockUpdateTool,
  })
  renderPage()
  expect(screen.getByText(/nenhuma ferramenta/i)).toBeInTheDocument()
})
