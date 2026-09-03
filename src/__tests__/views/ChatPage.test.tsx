import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ChatPage } from '@/views/pages/ChatPage'
import { useChatStore } from '@/viewmodels/chat.viewmodel'
import { useMachineStore } from '@/viewmodels/machine.viewmodel'

jest.mock('@/viewmodels/chat.viewmodel')
jest.mock('@/viewmodels/machine.viewmodel')

function mockChatStore(overrides: Partial<ReturnType<typeof useChatStore>> = {}) {
  ;(useChatStore as unknown as jest.Mock).mockReturnValue({
    messages: [],
    loading: false,
    error: null,
    machineId: '',
    setMachineId: jest.fn(),
    sendMessage: jest.fn(),
    retryLastMessage: jest.fn(),
    clear: jest.fn(),
    ...overrides,
  })
}

beforeEach(() => {
  jest.clearAllMocks()
  ;(useMachineStore as unknown as jest.Mock).mockReturnValue({
    machines: [{ id: 'mach-1', name: 'Torno CNC' }],
    load: jest.fn(),
  })
  window.HTMLElement.prototype.scrollIntoView = jest.fn()
})

it('carrega máquinas ao montar', () => {
  const load = jest.fn()
  ;(useMachineStore as unknown as jest.Mock).mockReturnValue({ machines: [], load })
  mockChatStore()
  render(<ChatPage />)
  expect(load).toHaveBeenCalled()
})

it('mostra aviso quando nenhuma máquina foi selecionada', () => {
  mockChatStore({ machineId: '' })
  render(<ChatPage />)
  expect(screen.getByText('Selecione uma máquina para iniciar o chat.')).toBeInTheDocument()
})

it('seleciona máquina e limpa o chat anterior', () => {
  const setMachineId = jest.fn()
  const clear = jest.fn()
  mockChatStore({ machineId: '', setMachineId, clear })
  render(<ChatPage />)
  fireEvent.change(screen.getByRole('combobox'), { target: { value: 'mach-1' } })
  expect(setMachineId).toHaveBeenCalledWith('mach-1')
  expect(clear).toHaveBeenCalled()
})

it('mostra as mensagens do chat quando há máquina selecionada', () => {
  mockChatStore({
    machineId: 'mach-1',
    messages: [
      { id: '1', role: 'user', content: 'Como faço manutenção?', timestamp: '2025-01-01' },
      { id: '2', role: 'assistant', content: 'Siga o manual.', timestamp: '2025-01-01' },
    ],
  })
  render(<ChatPage />)
  expect(screen.getByText('Como faço manutenção?')).toBeInTheDocument()
  expect(screen.getByText('Siga o manual.')).toBeInTheDocument()
})

it('envia mensagem ao submeter o formulário', async () => {
  const sendMessage = jest.fn().mockResolvedValue(undefined)
  mockChatStore({ machineId: 'mach-1', sendMessage })
  render(<ChatPage />)
  const input = screen.getByPlaceholderText('Digite sua pergunta...')
  fireEvent.change(input, { target: { value: 'Qual o intervalo de troca de óleo?' } })
  fireEvent.click(screen.getByRole('button', { name: 'Enviar' }))
  await waitFor(() => {
    expect(sendMessage).toHaveBeenCalledWith('Qual o intervalo de troca de óleo?')
  })
})

it('não envia mensagem vazia', () => {
  const sendMessage = jest.fn()
  mockChatStore({ machineId: 'mach-1', sendMessage })
  render(<ChatPage />)
  expect(screen.getByRole('button', { name: 'Enviar' })).toBeDisabled()
})

it('mostra erro com botão de tentar novamente', () => {
  const retryLastMessage = jest.fn()
  mockChatStore({ machineId: 'mach-1', error: 'Falha ao consultar IA', retryLastMessage })
  render(<ChatPage />)
  expect(screen.getByText('Falha ao consultar IA')).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }))
  expect(retryLastMessage).toHaveBeenCalled()
})
