import api from '@/services/api'
import type { Tool, MachineTool, ToolFormData } from '@/models/tool.model'

export async function fetchTools(status?: 'active' | 'inactive'): Promise<Tool[]> {
  const params: Record<string, string> = {}
  if (status) params.status = status
  const { data } = await api.get<Tool[]>('/tools', { params })
  return data
}

export async function fetchTool(id: string): Promise<Tool> {
  const { data } = await api.get<Tool>(`/tools/${id}`)
  return data
}

export async function createTool(formData: ToolFormData): Promise<Tool> {
  const { data } = await api.post<Tool>('/tools', formData)
  return data
}

export async function updateTool(id: string, formData: Partial<ToolFormData>): Promise<Tool> {
  const { data } = await api.put<Tool>(`/tools/${id}`, formData)
  return data
}

export async function removeTool(id: string): Promise<void> {
  await api.delete(`/tools/${id}`)
}

export async function fetchMachineTools(machineId: string): Promise<MachineTool[]> {
  const { data } = await api.get<any[]>(`/machines/${machineId}/tools`)
  return data.map((item) => ({ ...item, tool: item.tools ?? item.tool }))
}

export async function addMachineTool(
  machineId: string,
  toolId: string,
  quantityRequired: number,
): Promise<MachineTool> {
  const { data } = await api.post<any>(`/machines/${machineId}/tools`, {
    toolId,
    quantityRequired,
  })
  return { ...data, tool: data.tools ?? data.tool }
}

export async function removeMachineTool(machineId: string, toolId: string): Promise<void> {
  await api.delete(`/machines/${machineId}/tools/${toolId}`)
}
