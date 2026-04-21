import { create } from 'zustand'
import type { ChatMessage } from '@/models/chat.model'
import { sendMessage, compareQuery, saveCuratedAnswer } from '@/services/chat.service'

function makeId() {
  return Math.random().toString(36).slice(2)
}

interface ChatState {
  messages: ChatMessage[]
  loading: boolean
  error: string | null
  machineId: string
  compareMode: boolean
  selectedMachines: string[]

  setMachineId: (id: string) => void
  setCompareMode: (enabled: boolean) => void
  toggleSelectedMachine: (id: string) => void
  sendMessage: (content: string) => Promise<void>
  curateAnswer: (msgIndex: number) => Promise<void>
  retryLastMessage: () => Promise<void>
  clear: () => void
}

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  loading: false,
  error: null,
  machineId: '',
  compareMode: false,
  selectedMachines: [],

  setMachineId: (id) => set({ machineId: id, messages: [], error: null }),

  setCompareMode: (enabled) => set({ compareMode: enabled, selectedMachines: [], messages: [], error: null }),

  toggleSelectedMachine: (id) =>
    set((s) => ({
      selectedMachines: s.selectedMachines.includes(id)
        ? s.selectedMachines.filter((m) => m !== id)
        : [...s.selectedMachines, id],
    })),

  sendMessage: async (content) => {
    const userMsg: ChatMessage = { id: makeId(), role: 'user', content, timestamp: new Date().toISOString() }
    set((s) => ({ messages: [...s.messages, userMsg], loading: true, error: null }))
    try {
      const { machineId, compareMode, selectedMachines } = get()
      const answer = compareMode
        ? await compareQuery(selectedMachines, content)
        : await sendMessage(machineId, content)
      const assistantMsg: ChatMessage = { id: makeId(), role: 'assistant', content: answer, timestamp: new Date().toISOString() }
      set((s) => ({ messages: [...s.messages, assistantMsg], loading: false }))
    } catch (err) {
      set({ error: (err as Error).message, loading: false })
      throw err
    }
  },

  curateAnswer: async (msgIndex) => {
    const { messages, machineId } = get()
    const assistantMsg = messages[msgIndex]
    const userMsg = messages[msgIndex - 1]
    if (!assistantMsg || assistantMsg.role !== 'assistant') return
    if (!userMsg || userMsg.role !== 'user') return
    await saveCuratedAnswer(machineId, userMsg.content, assistantMsg.content)
  },

  retryLastMessage: async () => {
    const { messages, machineId } = get()
    const lastUser = [...messages].reverse().find((m) => m.role === 'user')
    if (!lastUser) return
    set({ error: null })
    try {
      const answer = await sendMessage(machineId, lastUser.content)
      const assistantMsg: ChatMessage = { id: makeId(), role: 'assistant', content: answer, timestamp: new Date().toISOString() }
      set((s) => ({ messages: [...s.messages, assistantMsg], loading: false }))
    } catch (err) {
      set({ error: (err as Error).message, loading: false })
    }
  },

  clear: () => set({ messages: [], error: null }),
}))
