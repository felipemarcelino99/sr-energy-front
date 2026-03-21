import { useChatStore } from '@/viewmodels/chat.viewmodel'

jest.mock('@/services/chat.service', () => ({
  sendMessage: jest.fn(),
}))

import * as chatService from '@/services/chat.service'

beforeEach(() => {
  useChatStore.setState({ messages: [], loading: false, error: null, machineId: '' })
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
