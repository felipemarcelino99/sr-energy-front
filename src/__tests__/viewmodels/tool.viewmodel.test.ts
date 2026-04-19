import { useToolStore } from '@/viewmodels/tool.viewmodel'
import type { Tool, MachineTool } from '@/models/tool.model'

jest.mock('@/services/tool.service')

import * as toolService from '@/services/tool.service'

const mockTool: Tool = {
  id: 'tool-1',
  name: 'Chave de Fenda',
  description: 'Chave de fenda Phillips',
  status: 'active',
  quantity: 10,
  createdAt: '2024-01-01',
  updatedAt: '2024-01-01',
}

const mockMachineTool: MachineTool = {
  id: 'mt-1',
  machineId: 'machine-1',
  toolId: 'tool-1',
  quantityRequired: 2,
  tool: mockTool,
}

const formData = {
  name: 'Chave de Fenda',
  description: 'Chave de fenda Phillips',
  status: 'active' as const,
  quantity: 10,
}

beforeEach(() => {
  useToolStore.setState({
    tools: [],
    loading: false,
    error: null,
    machineTools: [],
    machineToolsLoading: false,
  })
  jest.clearAllMocks()
})

describe('tool.viewmodel — fetchTools', () => {
  it('sets loading, fetches tools and updates store', async () => {
    ;(toolService.fetchTools as jest.Mock).mockResolvedValue([mockTool])
    await useToolStore.getState().fetchTools()
    expect(toolService.fetchTools).toHaveBeenCalledWith(undefined)
    expect(useToolStore.getState().tools).toHaveLength(1)
    expect(useToolStore.getState().loading).toBe(false)
  })

  it('passes status filter to service', async () => {
    ;(toolService.fetchTools as jest.Mock).mockResolvedValue([mockTool])
    await useToolStore.getState().fetchTools('active')
    expect(toolService.fetchTools).toHaveBeenCalledWith('active')
  })

  it('sets error on failure', async () => {
    ;(toolService.fetchTools as jest.Mock).mockRejectedValue(new Error('Network error'))
    await useToolStore.getState().fetchTools()
    expect(useToolStore.getState().error).toBe('Network error')
    expect(useToolStore.getState().loading).toBe(false)
  })
})

describe('tool.viewmodel — createTool', () => {
  it('calls service and adds tool to store', async () => {
    ;(toolService.createTool as jest.Mock).mockResolvedValue(mockTool)
    await useToolStore.getState().createTool(formData)
    expect(toolService.createTool).toHaveBeenCalledWith(formData)
    expect(useToolStore.getState().tools).toHaveLength(1)
    expect(useToolStore.getState().tools[0]).toEqual(mockTool)
  })
})

describe('tool.viewmodel — updateTool', () => {
  it('calls service and updates tool in store', async () => {
    const updated = { ...mockTool, name: 'Chave Phillips' }
    useToolStore.setState({ tools: [mockTool] })
    ;(toolService.updateTool as jest.Mock).mockResolvedValue(updated)
    await useToolStore.getState().updateTool('tool-1', { name: 'Chave Phillips' })
    expect(toolService.updateTool).toHaveBeenCalledWith('tool-1', { name: 'Chave Phillips' })
    const t = useToolStore.getState().tools.find((t) => t.id === 'tool-1')
    expect(t?.name).toBe('Chave Phillips')
  })
})

describe('tool.viewmodel — removeTool', () => {
  it('calls service and removes tool from store', async () => {
    useToolStore.setState({ tools: [mockTool] })
    ;(toolService.removeTool as jest.Mock).mockResolvedValue(undefined)
    await useToolStore.getState().removeTool('tool-1')
    expect(toolService.removeTool).toHaveBeenCalledWith('tool-1')
    expect(useToolStore.getState().tools).toHaveLength(0)
  })
})

describe('tool.viewmodel — fetchMachineTools', () => {
  it('sets machineToolsLoading, fetches and updates store', async () => {
    ;(toolService.fetchMachineTools as jest.Mock).mockResolvedValue([mockMachineTool])
    await useToolStore.getState().fetchMachineTools('machine-1')
    expect(toolService.fetchMachineTools).toHaveBeenCalledWith('machine-1')
    expect(useToolStore.getState().machineTools).toHaveLength(1)
    expect(useToolStore.getState().machineToolsLoading).toBe(false)
  })
})

describe('tool.viewmodel — addMachineTool', () => {
  it('calls service and adds machine tool to store', async () => {
    ;(toolService.addMachineTool as jest.Mock).mockResolvedValue(mockMachineTool)
    await useToolStore.getState().addMachineTool('machine-1', 'tool-1', 2)
    expect(toolService.addMachineTool).toHaveBeenCalledWith('machine-1', 'tool-1', 2)
    expect(useToolStore.getState().machineTools).toHaveLength(1)
  })
})

describe('tool.viewmodel — removeMachineTool', () => {
  it('calls service and removes machine tool from store', async () => {
    useToolStore.setState({ machineTools: [mockMachineTool] })
    ;(toolService.removeMachineTool as jest.Mock).mockResolvedValue(undefined)
    await useToolStore.getState().removeMachineTool('machine-1', 'tool-1')
    expect(toolService.removeMachineTool).toHaveBeenCalledWith('machine-1', 'tool-1')
    expect(useToolStore.getState().machineTools).toHaveLength(0)
  })
})
