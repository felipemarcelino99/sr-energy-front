import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AcceptProposalModal } from '@/views/components/AcceptProposalModal'
import { acceptProposal } from '@/services/proposal.service'
import { updateJob } from '@/services/job.service'
import { useEmployeeStore } from '@/viewmodels/employee.viewmodel'
import { useBagStore } from '@/viewmodels/bag.viewmodel'
import { toast } from '@/viewmodels/toast.viewmodel'

jest.mock('@/services/proposal.service')
jest.mock('@/services/job.service')
jest.mock('@/viewmodels/employee.viewmodel')
jest.mock('@/viewmodels/bag.viewmodel')
jest.mock('@/viewmodels/toast.viewmodel', () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}))

const loadEmployees = jest.fn()
const loadBags = jest.fn()

function renderModal(props?: Partial<React.ComponentProps<typeof AcceptProposalModal>>) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const onClose = jest.fn()
  const onAccepted = jest.fn()
  const utils = render(
    <QueryClientProvider client={queryClient}>
      <AcceptProposalModal
        proposalId="p1"
        proposalNumber="PC-0001"
        onClose={onClose}
        onAccepted={onAccepted}
        {...props}
      />
    </QueryClientProvider>
  )
  return { ...utils, onClose, onAccepted }
}

beforeEach(() => {
  jest.clearAllMocks()
  ;(useEmployeeStore as unknown as jest.Mock).mockReturnValue({
    employees: [{ id: 'e1', name: 'Ana Silva' }],
    load: loadEmployees,
  })
  ;(useBagStore as unknown as jest.Mock).mockReturnValue({
    bags: [{ id: 'b1', name: 'Mala 1', model: 'M1' }],
    load: loadBags,
  })
})

it('carrega funcionários e malas ao montar', () => {
  renderModal()
  expect(loadEmployees).toHaveBeenCalled()
  expect(loadBags).toHaveBeenCalled()
})

it('exibe o número da proposta no título', () => {
  renderModal()
  expect(screen.getByText(/Aceitar proposta PC-0001/)).toBeInTheDocument()
})

it('desabilita ações enquanto a mutation está pendente e chama onClose/onAccepted sem preencher dados da OS (branch sem update)', async () => {
  ;(acceptProposal as jest.Mock).mockResolvedValue({
    contract: { id: 'ct1' },
    job: { id: 'j1', number: 'AA001' },
  })
  const { onAccepted, onClose } = renderModal()

  fireEvent.click(screen.getByRole('button', { name: /^aceitar$/i }))

  await waitFor(() => {
    expect(acceptProposal).toHaveBeenCalledWith('p1')
  })
  expect(updateJob).not.toHaveBeenCalled()
  expect(toast.success).toHaveBeenCalledWith(
    'Proposta aceita. Contrato e OS AA001 criados — complete os dados da OS quando puder.'
  )
  expect(onAccepted).toHaveBeenCalledWith({ contractId: 'ct1', jobId: 'j1' })
  expect(onClose).toHaveBeenCalled()
})

it('atualiza a OS quando dados opcionais são preenchidos (branch com update) e mostra toast de "preenchidos com sucesso"', async () => {
  ;(acceptProposal as jest.Mock).mockResolvedValue({
    contract: { id: 'ct1' },
    job: { id: 'j1', number: 'AA001' },
  })
  ;(updateJob as jest.Mock).mockResolvedValue({})
  renderModal()

  fireEvent.click(screen.getByLabelText('Ana Silva'))
  fireEvent.change(screen.getByLabelText(/mala/i), { target: { value: 'b1' } })
  fireEvent.change(screen.getByLabelText(/data do serviço/i), { target: { value: '2026-05-01' } })
  fireEvent.change(screen.getByLabelText(/data final/i), { target: { value: '2026-05-02' } })
  fireEvent.change(screen.getByLabelText(/endereço de atendimento/i), {
    target: { value: 'Rua Teste, 123' },
  })
  fireEvent.change(screen.getByLabelText(/contato do cliente/i), { target: { value: 'João' } })
  fireEvent.change(screen.getByLabelText(/telefone do contato/i), {
    target: { value: '41999999999' },
  })
  fireEvent.change(screen.getByLabelText(/detalhamento do escopo/i), {
    target: { value: 'Escopo detalhado' },
  })

  fireEvent.click(screen.getByRole('button', { name: /^aceitar$/i }))

  await waitFor(() => {
    expect(updateJob).toHaveBeenCalledWith(
      'j1',
      expect.objectContaining({
        employeeIds: ['e1'],
        bagId: 'b1',
        scheduledDate: '2026-05-01',
        scheduledEndDate: '2026-05-02',
        serviceAddress: 'Rua Teste, 123',
        clientContactName: 'João',
        clientContactPhone: '41999999999',
        scopeDetail: 'Escopo detalhado',
      })
    )
  })
  expect(toast.success).toHaveBeenCalledWith(
    'Proposta aceita. Contrato e OS AA001 criados e preenchidos com sucesso.'
  )
})

it('exibe mensagem de erro específica para status 404', async () => {
  ;(acceptProposal as jest.Mock).mockRejectedValue({ response: { status: 404 } })
  renderModal()
  fireEvent.click(screen.getByRole('button', { name: /^aceitar$/i }))
  await waitFor(() => {
    expect(toast.error).toHaveBeenCalledWith('Esta proposta não foi encontrada.')
  })
})

it('exibe mensagem de erro específica para status 409', async () => {
  ;(acceptProposal as jest.Mock).mockRejectedValue({ response: { status: 409 } })
  renderModal()
  fireEvent.click(screen.getByRole('button', { name: /^aceitar$/i }))
  await waitFor(() => {
    expect(toast.error).toHaveBeenCalledWith('Esta proposta já não está pendente.')
  })
})

it('exibe mensagem de erro genérica de fallback quando não há mensagem da API', async () => {
  ;(acceptProposal as jest.Mock).mockRejectedValue(new Error('boom'))
  renderModal()
  fireEvent.click(screen.getByRole('button', { name: /^aceitar$/i }))
  await waitFor(() => {
    expect(toast.error).toHaveBeenCalledWith('Erro ao aceitar a proposta.')
  })
})

it('chama onClose ao clicar em Cancelar', () => {
  const { onClose } = renderModal()
  fireEvent.click(screen.getByRole('button', { name: /cancelar/i }))
  expect(onClose).toHaveBeenCalled()
})
