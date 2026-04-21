import { z } from 'zod'

export type MessageRole = 'user' | 'assistant'

export interface ChatMessage {
  id: string
  role: MessageRole
  content: string
  timestamp: string
}

export interface ChatSession {
  machineId: string
  messages: ChatMessage[]
}

export const chatInputSchema = z.object({
  message: z.string().min(1, 'Mensagem não pode estar vazia'),
  machineId: z.string().min(1, 'Selecione uma máquina'),
})

export type ChatInputData = z.infer<typeof chatInputSchema>

export interface CuratedAnswer {
  id: string
  machineId: string
  question: string
  answer: string
  createdBy: string
  createdAt: string
}

export interface CompareRequest {
  machineIds: string[]
  message: string
}
