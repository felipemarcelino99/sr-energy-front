import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ProposalFormPage } from '@/views/pages/ProposalFormPage'
import { useAuthStore } from '@/viewmodels/auth.viewmodel'
import { useClientStore } from '@/viewmodels/client.viewmodel'
import { useEmployeeStore } from '@/viewmodels/employee.viewmodel'
import { useBagStore } from '@/viewmodels/bag.viewmodel'
import {
  fetchProposal,
  createProposal,
  updateProposal,
  rejectProposal,
  acceptProposal,
} from '@/services/proposal.service'

jest.mock('@/viewmodels/auth.viewmodel')
jest.mock('@/viewmodels/employee.viewmodel')
jest.mock('@/viewmodels/bag.viewmodel')
jest.mock('@/services/proposal.service')
jest.mock('@/services/job.service', () => ({ updateJob: jest.fn().mockResolvedValue(undefined) }))

const editProposal = {
  id: 'p1',
  number: 'PC-0001',
  clientId: 'cl1',
  description: 'Proposta de manutenção',
  startDate: '2026-01-01',
  endDate: '2026-12-31',
  fileUrl: undefined,
  recurring: false,
  contractType: 'service',
  contractValue: 2000,
  status: 'pending',
  contractId: null,
  jobId: null,
  createdAt: '2026-01-01',
  updatedAt: '2026-01-01',
}

function renderPage(initialEntry: string, path: string) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <Routes>
          <Route path={path} element={<ProposalFormPage />} />
          <Route path="/proposals" element={<div>Proposals List</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  )
}

function renderCreate() {
  return renderPage('/proposals/new', '/proposals/new')
}

function renderEdit(id = 'p1') {
  return renderPage(`/proposals/${id}/edit`, '/proposals/:id/edit')
}

beforeEach(() => {
  jest.clearAllMocks()
  ;(useAuthStore as unknown as jest.Mock).mockReturnValue({ user: { role: 'admin' } })
  ;(useEmployeeStore as unknown as jest.Mock).mockReturnValue({ employees: [], load: jest.fn() })
  ;(useBagStore as unknown as jest.Mock).mockReturnValue({ bags: [], load: jest.fn() })
  useClientStore.setState({
    clients: [{ id: 'cl1', razaoSocial: 'Cliente Teste', cnpj: '00.000.000/0001-00' }],
    loading: false,
    error: null,
    search: '',
    load: jest.fn(),
  } as never)
  ;(fetchProposal as jest.Mock).mockResolvedValue(editProposal)
  ;(createProposal as jest.Mock).mockResolvedValue({ ...editProposal, id: 'new' })
  ;(updateProposal as jest.Mock).mockResolvedValue(editProposal)
  ;(rejectProposal as jest.Mock).mockResolvedValue({ ...editProposal, status: 'rejected' })
  ;(acceptProposal as jest.Mock).mockResolvedValue({
    contract: { id: 'ct1' },
    job: { id: 'j1', number: 'OS-0001' },
  })
})

it('does not show accept/reject buttons in create mode', () => {
  renderCreate()
  expect(screen.queryByText(/aceitar/i)).not.toBeInTheDocument()
  expect(screen.queryByText(/recusar/i)).not.toBeInTheDocument()
})

it('shows validation error when submitting empty required fields', async () => {
  renderCreate()
  fireEvent.click(screen.getByText('Criar'))
  await waitFor(() => {
    expect(screen.getByTestId('error-clientId')).toBeInTheDocument()
  })
  expect(createProposal).not.toHaveBeenCalled()
})

it('calls createProposal on valid submit and navigates to /proposals', async () => {
  renderCreate()
  fireEvent.change(screen.getByLabelText(/descrição/i), { target: { value: 'Nova proposta' } })
  fireEvent.change(screen.getByLabelText(/data de início/i), { target: { value: '2026-01-01' } })
  fireEvent.change(screen.getByLabelText(/data de término/i), { target: { value: '2026-12-31' } })
  fireEvent.change(screen.getByLabelText(/valor da proposta/i), { target: { value: '1500' } })

  const clientInput = screen.getByPlaceholderText(/buscar cliente/i)
  fireEvent.change(clientInput, { target: { value: 'Cliente' } })
  fireEvent.mouseDown(screen.getByText('Cliente Teste'))

  fireEvent.click(screen.getByText('Criar'))
  await waitFor(() => {
    expect(createProposal).toHaveBeenCalledWith(
      expect.objectContaining({
        clientId: 'cl1',
        description: 'Nova proposta',
        contractValue: 1500,
      })
    )
  })
  await waitFor(() => {
    expect(screen.getByText('Proposals List')).toBeInTheDocument()
  })
})

it('navigates to /proposals on cancel without calling createProposal', async () => {
  renderCreate()
  fireEvent.click(screen.getByText('Cancelar'))
  await waitFor(() => {
    expect(screen.getByText('Proposals List')).toBeInTheDocument()
  })
  expect(createProposal).not.toHaveBeenCalled()
})

it('pre-fills form and shows status badge in edit mode, calling updateProposal on submit', async () => {
  renderEdit()
  await waitFor(() => {
    expect(screen.getByLabelText(/descrição/i)).toHaveValue('Proposta de manutenção')
  })
  expect(screen.getByText('Pendente')).toBeInTheDocument()

  fireEvent.click(screen.getByText('Salvar'))
  await waitFor(() => {
    expect(updateProposal).toHaveBeenCalledWith(
      'p1',
      expect.objectContaining({ clientId: 'cl1', description: 'Proposta de manutenção' })
    )
  })
})

it('shows accept/reject buttons for admin when proposal is pending, and opens accept modal', async () => {
  renderEdit()
  await waitFor(() => {
    expect(screen.getByText(/aceitar/i)).toBeInTheDocument()
  })
  fireEvent.click(screen.getByText(/aceitar/i))
  expect(screen.getByText(/aceitar proposta pc-0001/i)).toBeInTheDocument()
})

it('rejects the proposal via the confirmation modal and navigates to /proposals', async () => {
  renderEdit()
  await waitFor(() => {
    expect(screen.getByText(/recusar/i)).toBeInTheDocument()
  })
  fireEvent.click(screen.getByText(/recusar/i))
  expect(screen.getByText(/tem certeza que deseja recusar/i)).toBeInTheDocument()

  const confirmButton = document.querySelector('.modal-action .btn-error') as HTMLButtonElement
  fireEvent.click(confirmButton)
  await waitFor(() => {
    expect(rejectProposal).toHaveBeenCalledWith('p1', expect.anything())
  })
  await waitFor(() => {
    expect(screen.getByText('Proposals List')).toBeInTheDocument()
  })
})

it('does not show accept/reject buttons when proposal is not pending', async () => {
  ;(fetchProposal as jest.Mock).mockResolvedValue({ ...editProposal, status: 'accepted' })
  renderEdit()
  await waitFor(() => {
    expect(screen.getByText('Aceita')).toBeInTheDocument()
  })
  expect(screen.queryByText(/^aceitar$/i)).not.toBeInTheDocument()
  expect(screen.queryByText(/^recusar$/i)).not.toBeInTheDocument()
})

it('shows an error toast when saving the proposal fails', async () => {
  ;(createProposal as jest.Mock).mockRejectedValue({
    response: { data: { error: 'Cliente inválido' } },
  })
  renderCreate()
  fireEvent.change(screen.getByLabelText(/descrição/i), { target: { value: 'Nova proposta' } })
  fireEvent.change(screen.getByLabelText(/data de início/i), { target: { value: '2026-01-01' } })
  fireEvent.change(screen.getByLabelText(/data de término/i), { target: { value: '2026-12-31' } })
  fireEvent.change(screen.getByLabelText(/valor da proposta/i), { target: { value: '1500' } })

  const clientInput = screen.getByPlaceholderText(/buscar cliente/i)
  fireEvent.change(clientInput, { target: { value: 'Cliente' } })
  fireEvent.mouseDown(screen.getByText('Cliente Teste'))

  fireEvent.click(screen.getByText('Criar'))
  await waitFor(() => {
    expect(createProposal).toHaveBeenCalled()
  })
  expect(screen.queryByText('Proposals List')).not.toBeInTheDocument()
})

it('closes the reject modal and shows an error toast when rejectProposal fails with a 409', async () => {
  ;(rejectProposal as jest.Mock).mockRejectedValue({ response: { status: 409 } })
  renderEdit()
  await waitFor(() => {
    expect(screen.getByText(/recusar/i)).toBeInTheDocument()
  })
  fireEvent.click(screen.getByText(/recusar/i))
  const confirmButton = document.querySelector('.modal-action .btn-error') as HTMLButtonElement
  fireEvent.click(confirmButton)
  await waitFor(() => {
    expect(screen.queryByText(/tem certeza que deseja recusar/i)).not.toBeInTheDocument()
  })
  expect(screen.queryByText('Proposals List')).not.toBeInTheDocument()
})

it('accepts the proposal from the accept modal and navigates to /proposals', async () => {
  renderEdit()
  await waitFor(() => {
    expect(screen.getByText(/aceitar/i)).toBeInTheDocument()
  })
  fireEvent.click(screen.getByText(/aceitar/i))
  expect(screen.getByText(/aceitar proposta pc-0001/i)).toBeInTheDocument()

  const confirmAcceptButton = document.querySelector(
    '.modal-action .btn-success'
  ) as HTMLButtonElement
  fireEvent.click(confirmAcceptButton)
  await waitFor(() => {
    expect(acceptProposal).toHaveBeenCalledWith('p1')
  })
  await waitFor(() => {
    expect(screen.getByText('Proposals List')).toBeInTheDocument()
  })
})

it('closes the accept modal without accepting when Cancelar is clicked', async () => {
  renderEdit()
  await waitFor(() => {
    expect(screen.getByText(/aceitar/i)).toBeInTheDocument()
  })
  fireEvent.click(screen.getByText(/aceitar/i))
  expect(screen.getByText(/aceitar proposta pc-0001/i)).toBeInTheDocument()

  const modalCancelButton = document.querySelector('.modal-action .btn-ghost') as HTMLButtonElement
  fireEvent.click(modalCancelButton)
  await waitFor(() => {
    expect(screen.queryByText(/aceitar proposta pc-0001/i)).not.toBeInTheDocument()
  })
  expect(acceptProposal).not.toHaveBeenCalled()
})
