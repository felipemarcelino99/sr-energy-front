import { create } from 'zustand'
import type { ChatMessage } from '@/models/chat.model'
import { sendMessage } from '@/services/chat.service'

function makeId() {
  return Math.random().toString(36).slice(2)
}

interface ChatState {
  messages: ChatMessage[]
  loading: boolean
  error: string | null
  machineId: string

  setMachineId: (id: string) => void
  sendMessage: (content: string) => Promise<void>
  retryLastMessage: () => Promise<void>
  clear: () => void
}

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  loading: false,
  error: null,
  machineId: '',

  setMachineId: (id) => set({ machineId: id, messages: [], error: null }),

  sendMessage: async (content) => {
    const userMsg: ChatMessage = {
      id: makeId(),
      role: 'user',
      content,
      timestamp: new Date().toISOString(),
    }
    set((s) => ({ messages: [...s.messages, userMsg], loading: true, error: null }))
    try {
      const answer = await sendMessage(get().machineId, content)
      const assistantMsg: ChatMessage = {
        id: makeId(),
        role: 'assistant',
        content: answer,
        timestamp: new Date().toISOString(),
      }
      set((s) => ({ messages: [...s.messages, assistantMsg], loading: false }))
    } catch (err) {
      set({ error: (err as Error).message, loading: false })
      throw err
    }
  },

  retryLastMessage: async () => {
    const { messages } = get()
    const lastUser = [...messages].reverse().find((m) => m.role === 'user')
    if (!lastUser) return
    // Remove previous error state
    set({ error: null })
    try {
      const answer = await sendMessage(get().machineId, lastUser.content)
      const assistantMsg: ChatMessage = {
        id: makeId(),
        role: 'assistant',
        content: answer,
        timestamp: new Date().toISOString(),
      }
      set((s) => ({ messages: [...s.messages, assistantMsg], loading: false }))
    } catch (err) {
      set({ error: (err as Error).message, loading: false })
    }
  },

  clear: () => set({ messages: [], error: null }),
}))
