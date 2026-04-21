import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { JobStepper } from '@/views/components/JobStepper'
import { useToolStore } from '@/viewmodels/tool.viewmodel'

jest.mock('@/viewmodels/tool.viewmodel', () => ({
  useToolStore: jest.fn(),
}))

const mockUseToolStore = useToolStore as jest.MockedFunction<typeof useToolStore>

const defaultMachines = [
  { id: 'machine-1', name: 'Máquina A' },
  { id: 'machine-2', name: 'Máquina B' },
]

const defaultEmployees = [{ id: 'emp-1', name: 'João' }]

function buildStore(overrides: Partial<ReturnType<typeof useToolStore>> = {}) {
  return {
    machineTools: [],
    machineToolsLoading: false,
    fetchMachineTools: jest.fn().mockResolvedValue(undefined),
    tools: [],
    loading: false,
    error: null,
    fetchTools: jest.fn(),
    createTool: jest.fn(),
    updateTool: jest.fn(),
    removeTool: jest.fn(),
    addMachineTool: jest.fn(),
    removeMachineTool: jest.fn(),
    ...overrides,
  } as unknown as ReturnType<typeof useToolStore>
}

async function navigateToStep3(fetchMachineTools = jest.fn()) {
  const store = buildStore({ fetchMachineTools })
  mockUseToolStore.mockReturnValue(store)

  render(
    <JobStepper
      employees={defaultEmployees}
      machines={defaultMachines}
      onSubmit={jest.fn()}
    />
  )

  // Step 1: select employee + date, click next
  fireEvent.change(screen.getByLabelText(/funcionário/i), { target: { value: 'emp-1' } })
  fireEvent.change(screen.getByLabelText(/data/i), { target: { value: '2026-04-10' } })
  fireEvent.click(screen.getByText('Próximo'))

  // Step 2: fill city + state, click next
  fireEvent.change(screen.getByLabelText(/cidade/i), { target: { value: 'São Paulo' } })
  fireEvent.change(screen.getByLabelText(/estado/i), { target: { value: 'SP' } })
  fireEvent.change(screen.getByLabelText(/horário de início/i), { target: { value: '08:00' } })
  fireEvent.change(screen.getByLabelText(/horário de término/i), { target: { value: '17:00' } })
  fireEvent.click(screen.getByText('Próximo'))

  await waitFor(() => expect(screen.getByLabelText(/máquina/i)).toBeInTheDocument())

  return store
}

describe('MachineToolsPreview — in JobStepper Step 3', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('does not show tools section when no machine is selected', async () => {
    await navigateToStep3()
    expect(screen.queryByTestId('machine-tools-section')).not.toBeInTheDocument()
  })

  it('calls fetchMachineTools when machineId changes to non-empty', async () => {
    const fetchMachineTools = jest.fn().mockResolvedValue(undefined)
    const store = await navigateToStep3(fetchMachineTools)

    // Update the store mock to reflect current state (no tools yet)
    mockUseToolStore.mockReturnValue(buildStore({ fetchMachineTools }))

    fireEvent.change(screen.getByLabelText(/máquina/i), { target: { value: 'machine-1' } })

    await waitFor(() => {
      expect(fetchMachineTools).toHaveBeenCalledWith('machine-1')
    })
  })

  it('shows loading spinner while machineToolsLoading is true', async () => {
    const fetchMachineTools = jest.fn().mockResolvedValue(undefined)
    await navigateToStep3(fetchMachineTools)

    mockUseToolStore.mockReturnValue(
      buildStore({ fetchMachineTools, machineToolsLoading: true, machineTools: [] })
    )

    fireEvent.change(screen.getByLabelText(/máquina/i), { target: { value: 'machine-1' } })

    await waitFor(() => {
      expect(screen.getByTestId('machine-tools-loading')).toBeInTheDocument()
    })
  })

  it('shows tools list when machine has tools with sufficient stock', async () => {
    const fetchMachineTools = jest.fn().mockResolvedValue(undefined)
    await navigateToStep3(fetchMachineTools)

    mockUseToolStore.mockReturnValue(
      buildStore({
        fetchMachineTools,
        machineToolsLoading: false,
        machineTools: [
          {
            id: 'mt-1',
            machineId: 'machine-1',
            toolId: 'tool-1',
            quantityRequired: 2,
            tool: { id: 'tool-1', name: 'Chave de Fenda', status: 'active', quantity: 5, createdAt: '', updatedAt: '' },
          },
        ],
      })
    )

    fireEvent.change(screen.getByLabelText(/máquina/i), { target: { value: 'machine-1' } })

    await waitFor(() => {
      expect(screen.getByTestId('machine-tools-section')).toBeInTheDocument()
      expect(screen.getByText('Chave de Fenda')).toBeInTheDocument()
      expect(screen.getByText(/2/)).toBeInTheDocument()
    })

    expect(screen.queryByTestId('badge-insufficient-mt-1')).not.toBeInTheDocument()
  })

  it('shows "Estoque insuficiente" badge when tool quantity < quantityRequired', async () => {
    const fetchMachineTools = jest.fn().mockResolvedValue(undefined)
    await navigateToStep3(fetchMachineTools)

    mockUseToolStore.mockReturnValue(
      buildStore({
        fetchMachineTools,
        machineToolsLoading: false,
        machineTools: [
          {
            id: 'mt-2',
            machineId: 'machine-1',
            toolId: 'tool-2',
            quantityRequired: 5,
            tool: { id: 'tool-2', name: 'Alicate', status: 'active', quantity: 2, createdAt: '', updatedAt: '' },
          },
        ],
      })
    )

    fireEvent.change(screen.getByLabelText(/máquina/i), { target: { value: 'machine-1' } })

    await waitFor(() => {
      expect(screen.getByTestId('badge-insufficient-mt-2')).toBeInTheDocument()
      expect(screen.getByText(/estoque insuficiente/i)).toBeInTheDocument()
    })
  })

  it('shows warning alert when at least one tool has insufficient stock', async () => {
    const fetchMachineTools = jest.fn().mockResolvedValue(undefined)
    await navigateToStep3(fetchMachineTools)

    mockUseToolStore.mockReturnValue(
      buildStore({
        fetchMachineTools,
        machineToolsLoading: false,
        machineTools: [
          {
            id: 'mt-3',
            machineId: 'machine-1',
            toolId: 'tool-3',
            quantityRequired: 10,
            tool: { id: 'tool-3', name: 'Martelo', status: 'active', quantity: 1, createdAt: '', updatedAt: '' },
          },
          {
            id: 'mt-4',
            machineId: 'machine-1',
            toolId: 'tool-4',
            quantityRequired: 1,
            tool: { id: 'tool-4', name: 'Parafuso', status: 'active', quantity: 10, createdAt: '', updatedAt: '' },
          },
        ],
      })
    )

    fireEvent.change(screen.getByLabelText(/máquina/i), { target: { value: 'machine-1' } })

    await waitFor(() => {
      expect(screen.getByTestId('machine-tools-warning')).toBeInTheDocument()
      expect(screen.getByText(/1 ferramenta\(s\) com quantidade insuficiente/i)).toBeInTheDocument()
    })
  })

  it('does not block job submission when tools have insufficient stock', async () => {
    const onSubmit = jest.fn().mockResolvedValue(undefined)
    const fetchMachineTools = jest.fn().mockResolvedValue(undefined)

    mockUseToolStore.mockReturnValue(
      buildStore({
        fetchMachineTools,
        machineToolsLoading: false,
        machineTools: [
          {
            id: 'mt-5',
            machineId: 'machine-1',
            toolId: 'tool-5',
            quantityRequired: 99,
            tool: { id: 'tool-5', name: 'Ferramenta X', status: 'active', quantity: 1, createdAt: '', updatedAt: '' },
          },
        ],
      })
    )

    render(
      <JobStepper
        employees={defaultEmployees}
        machines={defaultMachines}
        onSubmit={onSubmit}
      />
    )

    // Navigate through all steps
    fireEvent.change(screen.getByLabelText(/funcionário/i), { target: { value: 'emp-1' } })
    fireEvent.change(screen.getByLabelText(/data/i), { target: { value: '2026-04-10' } })
    fireEvent.click(screen.getByText('Próximo'))

    fireEvent.change(screen.getByLabelText(/cidade/i), { target: { value: 'São Paulo' } })
    fireEvent.change(screen.getByLabelText(/estado/i), { target: { value: 'SP' } })
    fireEvent.change(screen.getByLabelText(/horário de início/i), { target: { value: '08:00' } })
    fireEvent.change(screen.getByLabelText(/horário de término/i), { target: { value: '17:00' } })
    fireEvent.click(screen.getByText('Próximo'))

    await waitFor(() => expect(screen.getByLabelText(/máquina/i)).toBeInTheDocument())

    fireEvent.change(screen.getByLabelText(/máquina/i), { target: { value: 'machine-1' } })
    fireEvent.change(screen.getByLabelText(/tipo de os/i), { target: { value: 'maintenance' } })
    fireEvent.change(screen.getByLabelText(/descrição/i), { target: { value: 'Manutenção geral' } })
    fireEvent.click(screen.getByText('Próximo'))

    // Step 4 review — confirm button should not be disabled
    await waitFor(() => expect(screen.getByTestId('review-step')).toBeInTheDocument())

    const confirmBtn = screen.getByText('Confirmar')
    expect(confirmBtn).not.toBeDisabled()
    fireEvent.click(confirmBtn)

    await waitFor(() => expect(onSubmit).toHaveBeenCalled())
  })
})
