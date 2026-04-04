import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { MachineFormPage } from '@/views/pages/MachineFormPage'

// Mock machine service
jest.mock('@/services/machine.service', () => ({
  fetchMachine: jest.fn().mockResolvedValue({
    id: 'machine-1',
    name: 'Torno CNC',
    brand: 'Romi',
    model: 'D800',
    serialNumber: 'SN-001',
    year: 2020,
    manualUrl: null,
  }),
  fetchMachineJobs: jest.fn().mockResolvedValue([]),
}))

// Mock machine viewmodel
jest.mock('@/viewmodels/machine.viewmodel', () => ({
  useMachineStore: () => ({
    create: jest.fn(),
    update: jest.fn(),
    uploadManual: jest.fn(),
  }),
}))

// Mock tool viewmodel
const mockFetchMachineTools = jest.fn().mockResolvedValue(undefined)
const mockAddMachineTool = jest.fn().mockResolvedValue(undefined)
const mockRemoveMachineTool = jest.fn().mockResolvedValue(undefined)
const mockFetchTools = jest.fn().mockResolvedValue(undefined)

const mockToolStore = {
  tools: [],
  loading: false,
  machineTools: [],
  machineToolsLoading: false,
  fetchTools: mockFetchTools,
  fetchMachineTools: mockFetchMachineTools,
  addMachineTool: mockAddMachineTool,
  removeMachineTool: mockRemoveMachineTool,
}

jest.mock('@/viewmodels/tool.viewmodel', () => ({
  useToolStore: jest.fn(() => mockToolStore),
}))

import { useToolStore } from '@/viewmodels/tool.viewmodel'
const mockUseToolStore = useToolStore as unknown as jest.Mock

function renderEditPage(machineId = 'machine-1') {
  return render(
    <MemoryRouter initialEntries={[`/machines/${machineId}/edit`]}>
      <Routes>
        <Route path="/machines/:id/edit" element={<MachineFormPage />} />
      </Routes>
    </MemoryRouter>
  )
}

beforeEach(() => {
  jest.clearAllMocks()
  ;mockUseToolStore.mockReturnValue({ ...mockToolStore })
})

describe('MachineFormPage — Ferramentas tab', () => {
  it('renders "Ferramentas" tab in edit mode', async () => {
    renderEditPage()
    await waitFor(() => {
      expect(screen.getByRole('tab', { name: /ferramentas/i })).toBeInTheDocument()
    })
  })

  it('does not render "Ferramentas" tab in create mode', () => {
    render(
      <MemoryRouter initialEntries={['/machines/new']}>
        <Routes>
          <Route path="/machines/new" element={<MachineFormPage />} />
        </Routes>
      </MemoryRouter>
    )
    expect(screen.queryByRole('tab', { name: /ferramentas/i })).not.toBeInTheDocument()
  })

  it('clicking "Ferramentas" tab calls fetchMachineTools and fetchTools', async () => {
    renderEditPage()
    await waitFor(() => screen.getByRole('tab', { name: /ferramentas/i }))

    fireEvent.click(screen.getByRole('tab', { name: /ferramentas/i }))

    await waitFor(() => {
      expect(mockFetchMachineTools).toHaveBeenCalledWith('machine-1')
      expect(mockFetchTools).toHaveBeenCalledWith('active')
    })
  })

  it('shows "Nenhuma ferramenta associada" when machineTools is empty', async () => {
    renderEditPage()
    await waitFor(() => screen.getByRole('tab', { name: /ferramentas/i }))

    fireEvent.click(screen.getByRole('tab', { name: /ferramentas/i }))

    await waitFor(() => {
      expect(screen.getByText(/nenhuma ferramenta associada/i)).toBeInTheDocument()
    })
  })

  it('shows loading spinner when machineToolsLoading is true', async () => {
    ;mockUseToolStore.mockReturnValue({
      ...mockToolStore,
      machineToolsLoading: true,
    })

    renderEditPage()
    await waitFor(() => screen.getByRole('tab', { name: /ferramentas/i }))
    fireEvent.click(screen.getByRole('tab', { name: /ferramentas/i }))

    expect(screen.getByTestId('machine-tools-loading')).toBeInTheDocument()
  })

  it('renders associated tools list with name, quantity and remove button', async () => {
    ;mockUseToolStore.mockReturnValue({
      ...mockToolStore,
      machineTools: [
        {
          id: 'mt-1',
          machineId: 'machine-1',
          toolId: 'tool-1',
          quantityRequired: 3,
          tool: { id: 'tool-1', name: 'Chave de Fenda', status: 'active', quantity: 10, createdAt: '', updatedAt: '' },
        },
      ],
    })

    renderEditPage()
    await waitFor(() => screen.getByRole('tab', { name: /ferramentas/i }))
    fireEvent.click(screen.getByRole('tab', { name: /ferramentas/i }))

    await waitFor(() => {
      expect(screen.getByText('Chave de Fenda')).toBeInTheDocument()
      expect(screen.getByText('3')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /remover/i })).toBeInTheDocument()
    })
  })

  it('clicking "Remover" calls removeMachineTool and refreshes', async () => {
    ;mockUseToolStore.mockReturnValue({
      ...mockToolStore,
      machineTools: [
        {
          id: 'mt-1',
          machineId: 'machine-1',
          toolId: 'tool-1',
          quantityRequired: 3,
          tool: { id: 'tool-1', name: 'Chave de Fenda', status: 'active', quantity: 10, createdAt: '', updatedAt: '' },
        },
      ],
    })

    renderEditPage()
    await waitFor(() => screen.getByRole('tab', { name: /ferramentas/i }))
    fireEvent.click(screen.getByRole('tab', { name: /ferramentas/i }))

    await waitFor(() => screen.getByRole('button', { name: /remover/i }))
    fireEvent.click(screen.getByRole('button', { name: /remover/i }))

    await waitFor(() => {
      expect(mockRemoveMachineTool).toHaveBeenCalledWith('machine-1', 'tool-1')
      expect(mockFetchMachineTools).toHaveBeenCalledTimes(2) // once on tab click, once after remove
    })
  })

  it('add tool form has select and quantity input', async () => {
    renderEditPage()
    await waitFor(() => screen.getByRole('tab', { name: /ferramentas/i }))
    fireEvent.click(screen.getByRole('tab', { name: /ferramentas/i }))

    await waitFor(() => {
      expect(screen.getByRole('combobox', { name: /ferramenta/i })).toBeInTheDocument()
      expect(screen.getByRole('spinbutton', { name: /quantidade/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /adicionar/i })).toBeInTheDocument()
    })
  })

  it('select is populated with available tools', async () => {
    ;mockUseToolStore.mockReturnValue({
      ...mockToolStore,
      tools: [
        { id: 'tool-1', name: 'Chave de Fenda', status: 'active', quantity: 10, createdAt: '', updatedAt: '' },
        { id: 'tool-2', name: 'Martelo', status: 'active', quantity: 5, createdAt: '', updatedAt: '' },
      ],
    })

    renderEditPage()
    await waitFor(() => screen.getByRole('tab', { name: /ferramentas/i }))
    fireEvent.click(screen.getByRole('tab', { name: /ferramentas/i }))

    await waitFor(() => {
      expect(screen.getByRole('option', { name: 'Chave de Fenda' })).toBeInTheDocument()
      expect(screen.getByRole('option', { name: 'Martelo' })).toBeInTheDocument()
    })
  })

  it('clicking "Adicionar" calls addMachineTool with selected tool and quantity', async () => {
    ;mockUseToolStore.mockReturnValue({
      ...mockToolStore,
      tools: [
        { id: 'tool-1', name: 'Chave de Fenda', status: 'active', quantity: 10, createdAt: '', updatedAt: '' },
      ],
    })

    renderEditPage()
    await waitFor(() => screen.getByRole('tab', { name: /ferramentas/i }))
    fireEvent.click(screen.getByRole('tab', { name: /ferramentas/i }))

    await waitFor(() => screen.getByRole('combobox', { name: /ferramenta/i }))

    fireEvent.change(screen.getByRole('combobox', { name: /ferramenta/i }), {
      target: { value: 'tool-1' },
    })
    fireEvent.change(screen.getByRole('spinbutton', { name: /quantidade/i }), {
      target: { value: '2' },
    })
    fireEvent.click(screen.getByRole('button', { name: /adicionar/i }))

    await waitFor(() => {
      expect(mockAddMachineTool).toHaveBeenCalledWith('machine-1', 'tool-1', 2)
    })
  })

  it('"Adicionar" button is disabled when no tool is selected', async () => {
    renderEditPage()
    await waitFor(() => screen.getByRole('tab', { name: /ferramentas/i }))
    fireEvent.click(screen.getByRole('tab', { name: /ferramentas/i }))

    await waitFor(() => screen.getByRole('button', { name: /adicionar/i }))
    expect(screen.getByRole('button', { name: /adicionar/i })).toBeDisabled()
  })
})
