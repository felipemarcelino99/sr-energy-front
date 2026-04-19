import { act, renderHook } from '@testing-library/react'
import { useChatStore } from '@/viewmodels/chat.viewmodel'

jest.mock('@/services/chat.service', () => ({
  sendMessage: jest.fn(),
  compareQuery: jest.fn(),
  saveCuratedAnswer: jest.fn(),
  deleteCuratedAnswer: jest.fn(),
}))

import * as chatService from '@/services/chat.service'

beforeEach(() => {
  useChatStore.setState({ messages: [], loading: false, error: null, machineId: '', compareMode: false, selectedMachines: [] })
  jest.clearAllMocks()
})

describe('chat.viewmodel — sendMessage', () => {
  it('adiciona mensagem do usuário, chama service e adiciona resposta', async () => {
    ;(chatService.sendMessage as jest.Mock).mockResolvedValue('Resposta da IA')
    useChatStore.setState({ machineId: 'mach-1' })
    await useChatStore.getState().sendMessage('Como fazer a manutenção?')
    const messages = useChatStore.getState().messages
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
    useChatStore.setState({ machineId: 'mach-1' })
    const promise = useChatStore.getState().sendMessage('Pergunta')
    expect(useChatStore.getState().loading).toBe(true)
    resolve('Resposta')
    await promise
    expect(useChatStore.getState().loading).toBe(false)
  })

  it('em caso de erro, retryLastMessage reenvia a última mensagem', async () => {
    ;(chatService.sendMessage as jest.Mock)
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce('Resposta após retry')
    useChatStore.setState({ machineId: 'mach-1' })
    try {
      await useChatStore.getState().sendMessage('Pergunta importante')
    } catch {}
    expect(useChatStore.getState().error).toBeTruthy()
    await useChatStore.getState().retryLastMessage()
    const messages = useChatStore.getState().messages
    const assistantMessages = messages.filter((m) => m.role === 'assistant')
    expect(assistantMessages).toHaveLength(1)
    expect(assistantMessages[0].content).toBe('Resposta após retry')
    expect(useChatStore.getState().error).toBeNull()
  })
})

describe('useChatStore — compare mode', () => {
  it('setCompareMode toggles compareMode', () => {
    const { result } = renderHook(() => useChatStore())
    act(() => result.current.setCompareMode(true))
    expect(result.current.compareMode).toBe(true)
  })

  it('toggleSelectedMachine adds and removes machine ids', () => {
    const { result } = renderHook(() => useChatStore())
    act(() => result.current.toggleSelectedMachine('m1'))
    expect(result.current.selectedMachines).toContain('m1')
    act(() => result.current.toggleSelectedMachine('m1'))
    expect(result.current.selectedMachines).not.toContain('m1')
  })

  it('sendMessage uses compareQuery when compareMode is true', async () => {
    jest.mocked(chatService.compareQuery).mockResolvedValue('Resposta comparativa')
    const { result } = renderHook(() => useChatStore())
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
    const { result } = renderHook(() => useChatStore())
    act(() => {
      useChatStore.setState({
        machineId: 'machine-1',
        messages: [
          { id: '1', role: 'user', content: 'Pergunta?', timestamp: '' },
          { id: '2', role: 'assistant', content: 'Resposta.', timestamp: '' },
        ],
      })
    })
    await act(() => result.current.curateAnswer(1))
    expect(chatService.saveCuratedAnswer).toHaveBeenCalledWith('machine-1', 'Pergunta?', 'Resposta.')
  })

  it('does nothing if msgIndex does not point to an assistant message', async () => {
    jest.mocked(chatService.saveCuratedAnswer).mockResolvedValue(undefined)
    const { result } = renderHook(() => useChatStore())
    act(() => {
      useChatStore.setState({
        machineId: 'machine-1',
        messages: [{ id: '1', role: 'user', content: 'Pergunta?', timestamp: '' }],
      })
    })
    await act(() => result.current.curateAnswer(0))
    expect(chatService.saveCuratedAnswer).not.toHaveBeenCalled()
  })
})
