import api from '@/services/api'
import {
  fetchTools,
  fetchTool,
  createTool,
  updateTool,
  removeTool,
  fetchMachineTools,
  addMachineTool,
  removeMachineTool,
} from '../../services/tool.service'

jest.mock('@/services/api')
const mockApi = api as jest.Mocked<typeof api>

describe('tool.service — fetchTools', () => {
  it('chama GET /tools sem parâmetros quando status omitido', async () => {
    mockApi.get.mockResolvedValue({ data: [] })
    await fetchTools()
    expect(mockApi.get).toHaveBeenCalledWith('/tools', { params: {} })
  })

  it('chama GET /tools?status=active quando passado', async () => {
    mockApi.get.mockResolvedValue({ data: [] })
    await fetchTools('active')
    expect(mockApi.get).toHaveBeenCalledWith('/tools', { params: { status: 'active' } })
  })

  it('retorna array de tools', async () => {
    const tools = [{ id: '1', name: 'Ferramenta' }]
    mockApi.get.mockResolvedValue({ data: tools })
    const result = await fetchTools()
    expect(result).toEqual(tools)
  })
})

describe('tool.service — fetchTool', () => {
  it('chama GET /tools/:id', async () => {
    mockApi.get.mockResolvedValue({ data: { id: '1' } })
    await fetchTool('1')
    expect(mockApi.get).toHaveBeenCalledWith('/tools/1')
  })
})

describe('tool.service — createTool', () => {
  it('chama POST /tools com os dados', async () => {
    const formData = { name: 'Chave', quantity: 5, status: 'active' as const }
    mockApi.post.mockResolvedValue({ data: { id: '1', ...formData } })
    await createTool(formData)
    expect(mockApi.post).toHaveBeenCalledWith('/tools', formData)
  })
})

describe('tool.service — updateTool', () => {
  it('chama PUT /tools/:id com os dados', async () => {
    const partial = { name: 'Chave Atualizada' }
    mockApi.put.mockResolvedValue({ data: { id: '1' } })
    await updateTool('1', partial)
    expect(mockApi.put).toHaveBeenCalledWith('/tools/1', partial)
  })
})

describe('tool.service — removeTool', () => {
  it('chama DELETE /tools/:id', async () => {
    mockApi.delete.mockResolvedValue({ data: undefined })
    await removeTool('1')
    expect(mockApi.delete).toHaveBeenCalledWith('/tools/1')
  })
})

describe('tool.service — fetchMachineTools', () => {
  it('chama GET /machines/:id/tools', async () => {
    mockApi.get.mockResolvedValue({ data: [] })
    await fetchMachineTools('machine-1')
    expect(mockApi.get).toHaveBeenCalledWith('/machines/machine-1/tools')
  })
})

describe('tool.service — addMachineTool', () => {
  it('chama POST /machines/:id/tools com tool_id e quantity_required', async () => {
    mockApi.post.mockResolvedValue({ data: {} })
    await addMachineTool('machine-1', 'tool-1', 3)
    expect(mockApi.post).toHaveBeenCalledWith('/machines/machine-1/tools', {
      tool_id: 'tool-1',
      quantity_required: 3,
    })
  })
})

describe('tool.service — removeMachineTool', () => {
  it('chama DELETE /machines/:id/tools/:toolId', async () => {
    mockApi.delete.mockResolvedValue({ data: undefined })
    await removeMachineTool('machine-1', 'tool-1')
    expect(mockApi.delete).toHaveBeenCalledWith('/machines/machine-1/tools/tool-1')
  })
})
