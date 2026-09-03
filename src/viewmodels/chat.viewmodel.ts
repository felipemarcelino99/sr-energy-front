import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import type { ChatMessage } from '@/models/chat.model'
import {
  sendMessage as sendMessageApi,
  compareQuery,
  saveCuratedAnswer,
} from '@/services/chat.service'

function makeId() {
  return Math.random().toString(36).slice(2)
}

/**
 * Chat conversation is local UI state (not cacheable server data — it's an
 * append-only transcript tied to one screen), so it stays as component
 * state. The network call itself goes through `useMutation`.
 */
export function useChatStore() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [error, setError] = useState<string | null>(null)
  const [machineId, setMachineIdState] = useState('')
  const [compareMode, setCompareModeState] = useState(false)
  const [selectedMachines, setSelectedMachines] = useState<string[]>([])

  const mutation = useMutation({
    mutationFn: ({ content }: { content: string }) => {
      return compareMode
        ? compareQuery(selectedMachines, content)
        : sendMessageApi(machineId, content)
    },
  })

  function setMachineId(id: string) {
    setMachineIdState(id)
    setMessages([])
    setError(null)
  }

  function setCompareMode(enabled: boolean) {
    setCompareModeState(enabled)
    setSelectedMachines([])
    setMessages([])
    setError(null)
  }

  function toggleSelectedMachine(id: string) {
    setSelectedMachines((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
    )
  }

  async function sendMessage(content: string): Promise<void> {
    const userMsg: ChatMessage = {
      id: makeId(),
      role: 'user',
      content,
      timestamp: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, userMsg])
    setError(null)
    try {
      const answer = await mutation.mutateAsync({ content })
      const assistantMsg: ChatMessage = {
        id: makeId(),
        role: 'assistant',
        content: answer,
        timestamp: new Date().toISOString(),
      }
      setMessages((prev) => [...prev, assistantMsg])
    } catch (err) {
      setError((err as Error).message)
      throw err
    }
  }

  async function curateAnswer(msgIndex: number): Promise<void> {
    const assistantMsg = messages[msgIndex]
    const userMsg = messages[msgIndex - 1]
    if (!assistantMsg || assistantMsg.role !== 'assistant') return
    if (!userMsg || userMsg.role !== 'user') return
    await saveCuratedAnswer(machineId, userMsg.content, assistantMsg.content)
  }

  async function retryLastMessage(): Promise<void> {
    const lastUser = [...messages].reverse().find((m) => m.role === 'user')
    if (!lastUser) return
    setError(null)
    try {
      const answer = compareMode
        ? await compareQuery(selectedMachines, lastUser.content)
        : await sendMessageApi(machineId, lastUser.content)
      const assistantMsg: ChatMessage = {
        id: makeId(),
        role: 'assistant',
        content: answer,
        timestamp: new Date().toISOString(),
      }
      setMessages((prev) => [...prev, assistantMsg])
    } catch (err) {
      setError((err as Error).message)
    }
  }

  function clear() {
    setMessages([])
    setError(null)
  }

  return {
    messages,
    loading: mutation.isPending,
    error,
    machineId,
    compareMode,
    selectedMachines,

    setMachineId,
    setCompareMode,
    toggleSelectedMachine,
    sendMessage,
    curateAnswer,
    retryLastMessage,
    clear,
  }
}
