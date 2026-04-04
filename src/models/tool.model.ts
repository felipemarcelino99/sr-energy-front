import { z } from 'zod'

export interface Tool {
  id: string
  name: string
  description?: string
  status: 'active' | 'inactive'
  quantity: number
  createdAt: string
  updatedAt: string
}

export interface MachineTool {
  id: string
  machineId: string
  toolId: string
  quantityRequired: number
  tool: Tool
}

export interface JobChecklistItem {
  id: string
  jobId: string
  employeeId: string
  toolId: string
  checked: boolean
  checkedAt?: string
  phase: 'pre_work' | 'pre_report'
  createdAt: string
  tool: Tool
}

export const toolSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  description: z.string().optional(),
  status: z.enum(['active', 'inactive']).default('active'),
  quantity: z.coerce.number().int().min(0, 'Quantidade não pode ser negativa'),
})

export type ToolFormData = z.infer<typeof toolSchema>
