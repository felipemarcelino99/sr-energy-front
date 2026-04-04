import { create } from 'zustand'
import type { Tool, MachineTool, ToolFormData } from '@/models/tool.model'
import {
  fetchTools as fetchToolsService,
  createTool as createToolService,
  updateTool as updateToolService,
  removeTool as removeToolService,
  fetchMachineTools as fetchMachineToolsService,
  addMachineTool as addMachineToolService,
  removeMachineTool as removeMachineToolService,
} from '@/services/tool.service'

interface ToolState {
  tools: Tool[]
  loading: boolean
  error: string | null
  machineTools: MachineTool[]
  machineToolsLoading: boolean

  fetchTools: (status?: 'active' | 'inactive') => Promise<void>
  createTool: (data: ToolFormData) => Promise<void>
  updateTool: (id: string, data: Partial<ToolFormData>) => Promise<void>
  removeTool: (id: string) => Promise<void>

  fetchMachineTools: (machineId: string) => Promise<void>
  addMachineTool: (machineId: string, toolId: string, quantity: number) => Promise<void>
  removeMachineTool: (machineId: string, toolId: string) => Promise<void>
}

export const useToolStore = create<ToolState>((set) => ({
  tools: [],
  loading: false,
  error: null,
  machineTools: [],
  machineToolsLoading: false,

  fetchTools: async (status) => {
    set({ loading: true, error: null })
    try {
      const tools = await fetchToolsService(status)
      set({ tools, loading: false })
    } catch (err) {
      set({ error: (err as Error).message, loading: false })
    }
  },

  createTool: async (data) => {
    const tool = await createToolService(data)
    set((s) => ({ tools: [...s.tools, tool] }))
  },

  updateTool: async (id, data) => {
    const updated = await updateToolService(id, data)
    set((s) => ({
      tools: s.tools.map((t) => (t.id === id ? updated : t)),
    }))
  },

  removeTool: async (id) => {
    await removeToolService(id)
    set((s) => ({ tools: s.tools.filter((t) => t.id !== id) }))
  },

  fetchMachineTools: async (machineId) => {
    set({ machineToolsLoading: true })
    try {
      const machineTools = await fetchMachineToolsService(machineId)
      set({ machineTools, machineToolsLoading: false })
    } catch (err) {
      set({ machineToolsLoading: false })
    }
  },

  addMachineTool: async (machineId, toolId, quantity) => {
    const machineTool = await addMachineToolService(machineId, toolId, quantity)
    set((s) => ({ machineTools: [...s.machineTools, machineTool] }))
  },

  removeMachineTool: async (machineId, toolId) => {
    await removeMachineToolService(machineId, toolId)
    set((s) => ({
      machineTools: s.machineTools.filter(
        (mt) => !(mt.machineId === machineId && mt.toolId === toolId)
      ),
    }))
  },
}))
