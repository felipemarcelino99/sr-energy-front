import { act, renderHook } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { useChatStore } from '@/viewmodels/chat.viewmodel'

jest.mock('@/services/chat.service', () => ({
  sendMessage: jest.fn(),
  compareQuery: jest.fn(),
  saveCuratedAnswer: jest.fn(),
  deleteCuratedAnswer: jest.fn(),
}))

import * as chatService from '@/services/chat.service'

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  }
}

beforeEach(() => {
  jest.clearAllMocks()
})

describe('chat.viewmodel — sendMessage', () => {
  it('adiciona mensagem do usuário, chama service e adiciona resposta', async () => {
    ;(chatService.sendMessage as jest.Mock).mockResolvedValue('Resposta da IA')
    const { result } = renderHook(() => useChatStore(), { wrapper: createWrapper() })
    act(() => result.current.setMachineId('mach-1'))

    await act(() => result.current.sendMessage('Como fazer a manutenção?'))

    const messages = result.current.messages
    expect(messages).toHaveLength(2)
    expect(messages[0].role).toBe('user')
    expect(messages[0].content).toBe('Como fazer a manutenção?')
    expect(messages[1].role).toBe('assistant')
    expect(messages[1].content).toBe('Resposta da IA')
    expect(chatService.sendMessage).toHaveBeenCalledWith('mach-1', 'Como fazer a manutenção?')
  })

  it('loading é true durante a chamada e false ao concluir', async () => {
    let resolve!: (v: string) => void
    ;(chatService.sendMessage as jest.Mock).mockReturnValue(new Promise((res) => { resolve = res }))
    const { result } = renderHook(() => useChatStore(), { wrapper: createWrapper() })
    act(() => result.current.setMachineId('mach-1'))

    let sendPromise!: Promise<void>
    act(() => {
      sendPromise = result.current.sendMessage('Pergunta')
    })
    expect(result.current.loading).toBe(true)

    await act(async () => {
      resolve('Resposta')
      await sendPromise
    })
    expect(result.current.loading).toBe(false)
  })

  it('em caso de erro, retryLastMessage reenvia a última mensagem', async () => {
    ;(chatService.sendMessage as jest.Mock)
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce('Resposta após retry')
    const { result } = renderHook(() => useChatStore(), { wrapper: createWrapper() })
    act(() => result.current.setMachineId('mach-1'))

    await act(async () => {
      try {
        await result.current.sendMessage('Pergunta importante')
      } catch {
        // expected — assertion below checks the resulting error state
      }
    })
    expect(result.current.error).toBeTruthy()

    await act(() => result.current.retryLastMessage())

    const messages = result.current.messages
    const assistantMessages = messages.filter((m) => m.role === 'assistant')
    expect(assistantMessages).toHaveLength(1)
    expect(assistantMessages[0].content).toBe('Resposta após retry')
    expect(result.current.error).toBeNull()
  })
})

describe('useChatStore — compare mode', () => {
  it('setCompareMode toggles compareMode', () => {
    const { result } = renderHook(() => useChatStore(), { wrapper: createWrapper() })
    act(() => result.current.setCompareMode(true))
    expect(result.current.compareMode).toBe(true)
  })

  it('toggleSelectedMachine adds and removes machine ids', () => {
    const { result } = renderHook(() => useChatStore(), { wrapper: createWrapper() })
    act(() => result.current.toggleSelectedMachine('m1'))
    expect(result.current.selectedMachines).toContain('m1')
    act(() => result.current.toggleSelectedMachine('m1'))
    expect(result.current.selectedMachines).not.toContain('m1')
  })

  it('sendMessage uses compareQuery when compareMode is true', async () => {
    jest.mocked(chatService.compareQuery).mockResolvedValue('Resposta comparativa')
    const { result } = renderHook(() => useChatStore(), { wrapper: createWrapper() })
    act(() => {
      result.current.setCompareMode(true)
      result.current.toggleSelectedMachine('m1')
      result.current.toggleSelectedMachine('m2')
    })
    await act(() => result.current.sendMessage('Qual é melhor?'))
    const msgs = result.current.messages
    const last = msgs[msgs.length - 1]
    expect(last.role).toBe('assistant')
    expect(last.content).toBe('Resposta comparativa')
    expect(chatService.compareQuery).toHaveBeenCalledWith(['m1', 'm2'], 'Qual é melhor?')
  })
})

describe('useChatStore — curateAnswer', () => {
  it('calls saveCuratedAnswer with the question and answer pair', async () => {
    jest.mocked(chatService.saveCuratedAnswer).mockResolvedValue(undefined)
    ;(chatService.sendMessage as jest.Mock)
      .mockResolvedValueOnce('Resposta.')
    const { result } = renderHook(() => useChatStore(), { wrapper: createWrapper() })
    act(() => result.current.setMachineId('machine-1'))
    await act(() => result.current.sendMessage('Pergunta?'))

    await act(() => result.current.curateAnswer(1))
    expect(chatService.saveCuratedAnswer).toHaveBeenCalledWith('machine-1', 'Pergunta?', 'Resposta.')
  })

  it('does nothing if msgIndex does not point to an assistant message', async () => {
    jest.mocked(chatService.saveCuratedAnswer).mockResolvedValue(undefined)
    const { result } = renderHook(() => useChatStore(), { wrapper: createWrapper() })
    act(() => result.current.setMachineId('machine-1'))

    await act(() => result.current.curateAnswer(0))
    expect(chatService.saveCuratedAnswer).not.toHaveBeenCalled()
  })
})
