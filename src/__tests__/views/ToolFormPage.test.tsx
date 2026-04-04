import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { ToolFormPage } from '@/views/pages/tools/ToolFormPage'
import { useToolStore } from '@/viewmodels/tool.viewmodel'

jest.mock('@/viewmodels/tool.viewmodel')

const mockCreateTool = jest.fn().mockResolvedValue(undefined)
const mockUpdateTool = jest.fn().mockResolvedValue(undefined)
const mockFetchTools = jest.fn()

function renderCreate() {
  return render(
    <MemoryRouter initialEntries={['/tools/new']}>
      <Routes>
        <Route path="/tools/new" element={<ToolFormPage />} />
        <Route path="/tools" element={<div>Tools List</div>} />
      </Routes>
    </MemoryRouter>
  )
}

function renderEdit(id = '1') {
  return render(
    <MemoryRouter initialEntries={[`/tools/${id}/edit`]}>
      <Routes>
        <Route path="/tools/:id/edit" element={<ToolFormPage />} />
        <Route path="/tools" element={<div>Tools List</div>} />
      </Routes>
    </MemoryRouter>
  )
}

beforeEach(() => {
  jest.clearAllMocks()
  ;(useToolStore as unknown as jest.Mock).mockReturnValue({
    tools: [
      {
        id: '1',
        name: 'Chave de Fenda',
        description: 'Chave philips',
        status: 'active',
        quantity: 10,
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
      },
    ],
    loading: false,
    error: null,
    fetchTools: mockFetchTools,
    createTool: mockCreateTool,
    updateTool: mockUpdateTool,
  })
})

it('renders "Nova Ferramenta" title in create mode', () => {
  renderCreate()
  expect(screen.getByText('Nova Ferramenta')).toBeInTheDocument()
})

it('renders "Editar Ferramenta" title in edit mode', () => {
  renderEdit()
  expect(screen.getByText('Editar Ferramenta')).toBeInTheDocument()
})

it('renders Nome field', () => {
  renderCreate()
  expect(screen.getByLabelText(/nome/i)).toBeInTheDocument()
})

it('renders Descrição field', () => {
  renderCreate()
  expect(screen.getByLabelText(/descrição/i)).toBeInTheDocument()
})

it('renders Quantidade field', () => {
  renderCreate()
  expect(screen.getByLabelText(/quantidade/i)).toBeInTheDocument()
})

it('does not show Status field in create mode', () => {
  renderCreate()
  expect(screen.queryByLabelText(/status/i)).not.toBeInTheDocument()
})

it('shows Status field in edit mode', () => {
  renderEdit()
  expect(screen.getByLabelText(/status/i)).toBeInTheDocument()
})

it('shows validation error when submitting empty Nome', async () => {
  renderCreate()
  fireEvent.click(screen.getByText('Salvar'))
  await waitFor(() => {
    expect(screen.getByText(/nome é obrigatório/i)).toBeInTheDocument()
  })
})

it('calls createTool on valid submit in create mode', async () => {
  renderCreate()
  fireEvent.change(screen.getByLabelText(/nome/i), { target: { value: 'Alicate' } })
  fireEvent.change(screen.getByLabelText(/quantidade/i), { target: { value: '3' } })
  fireEvent.click(screen.getByText('Salvar'))
  await waitFor(() => {
    expect(mockCreateTool).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Alicate', quantity: 3 })
    )
  })
})

it('navigates to /tools on cancel', async () => {
  renderCreate()
  fireEvent.click(screen.getByText('Cancelar'))
  await waitFor(() => {
    expect(screen.getByText('Tools List')).toBeInTheDocument()
  })
})

it('pre-fills form fields in edit mode', () => {
  renderEdit()
  const nameInput = screen.getByLabelText(/nome/i) as HTMLInputElement
  expect(nameInput.value).toBe('Chave de Fenda')
})
