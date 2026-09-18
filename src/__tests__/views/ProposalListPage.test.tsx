import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ProposalListPage } from '@/views/pages/ProposalListPage'
import { useAuthStore } from '@/viewmodels/auth.viewmodel'
import { fetchProposals, rejectProposal, acceptProposal } from '@/services/proposal.service'
import { useEmployeeStore } from '@/viewmodels/employee.viewmodel'
import { useBagStore } from '@/viewmodels/bag.viewmodel'
import { toast } from '@/viewmodels/toast.viewmodel'

jest.mock('@/viewmodels/auth.viewmodel')
jest.mock('@/services/proposal.service')
jest.mock('@/viewmodels/employee.viewmodel')
jest.mock('@/viewmodels/bag.viewmodel')
jest.mock('@/viewmodels/toast.viewmodel', () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}))

const proposal = {
  id: 'p1',
  number: 'PC-0001',
  clientId: 'cl1',
  clients: { id: 'cl1', razaoSocial: 'Cliente Teste', cnpj: '00.000.000/0001-00' },
  description: 'Proposta de teste',
  contractType: 'service',
  contractValue: 1000,
  recurring: false,
  startDate: '2025-01-01',
  fileUrl: 'https://files/x.pdf',
  status: 'pending',
  contractId: null,
  jobId: null,
  createdAt: '2025-01-01',
  updatedAt: '2025-01-01',
}

const rentalProposal = {
  ...proposal,
  id: 'p2',
  number: 'PC-0002',
  clients: { id: 'cl2', razaoSocial: 'Outra Empresa', cnpj: '11.111.111/0001-11' },
  contractType: 'rental',
  fileUrl: undefined,
  status: 'accepted',
}

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/proposals']}>
        <Routes>
          <Route path="/proposals" element={<ProposalListPage />} />
          <Route path="/proposals/new" element={<div>New Proposal Page</div>} />
          <Route path="/proposals/:id/edit" element={<div>Proposal Edit Page</div>} />
          <Route path="/jobs/:id/edit" element={<div>Job Edit Page</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  )
}

beforeEach(() => {
  jest.clearAllMocks()
  ;(fetchProposals as jest.Mock).mockResolvedValue([proposal, rentalProposal])
  ;(useEmployeeStore as unknown as jest.Mock).mockReturnValue({
    employees: [{ id: 'e1', name: 'Colaborador Teste' }],
    load: jest.fn(),
  })
  ;(useBagStore as unknown as jest.Mock).mockReturnValue({
    bags: [{ id: 'b1', name: 'Mala 1', model: 'M1' }],
    load: jest.fn(),
  })
  ;(useAuthStore as unknown as jest.Mock).mockReturnValue({ user: { role: 'admin' } })
})

it('exibe ações aceitar/recusar para propostas pendentes quando usuário é admin', async () => {
  renderPage()
  const menuButtons = await screen.findAllByLabelText('Ações')
  await userEvent.click(menuButtons[0])
  expect(screen.getByText('Aceitar')).toBeInTheDocument()
  expect(screen.getByText('Recusar')).toBeInTheDocument()
})

it('não exibe ações aceitar/recusar quando usuário é employee', async () => {
  ;(useAuthStore as unknown as jest.Mock).mockReturnValue({ user: { role: 'employee' } })
  renderPage()
  expect(await screen.findByText('PC-0001')).toBeInTheDocument()
  const menuButtons = screen.getAllByLabelText('Ações')
  await userEvent.click(menuButtons[0])
  expect(screen.queryByText('Aceitar')).not.toBeInTheDocument()
  expect(screen.queryByText('Recusar')).not.toBeInTheDocument()
})

it('abre o modal de aceitar com os campos opcionais da OS ao clicar em Aceitar', async () => {
  renderPage()
  const menuButtons = await screen.findAllByLabelText('Ações')
  await userEvent.click(menuButtons[0])
  const acceptButton = screen.getByText('Aceitar')
  await userEvent.click(acceptButton)

  expect(screen.getByText(/Aceitar proposta PC-0001/)).toBeInTheDocument()
  expect(screen.getByText('Colaborador Teste')).toBeInTheDocument()
  expect(screen.getByLabelText(/Mala/)).toBeInTheDocument()
  expect(screen.getByLabelText(/Data do serviço/)).toBeInTheDocument()
  expect(screen.getByLabelText(/Endereço de atendimento/)).toBeInTheDocument()
  expect(screen.getByLabelText(/Contato do cliente/)).toBeInTheDocument()
  expect(screen.getByLabelText(/Telefone do contato/)).toBeInTheDocument()
  expect(screen.getByLabelText(/Detalhamento do escopo/)).toBeInTheDocument()
})

it('aceita a proposta pelo menu de ações e navega direto para a OS criada', async () => {
  ;(acceptProposal as jest.Mock).mockResolvedValue({
    proposal: { id: 'p1', status: 'accepted' },
    job: { id: 'j1', number: 'AA001' },
  })
  renderPage()
  const menuButtons = await screen.findAllByLabelText('Ações')
  await userEvent.click(menuButtons[0])
  await userEvent.click(screen.getByText('Aceitar'))
  await userEvent.click(screen.getByRole('button', { name: /^aceitar$/i }))

  await waitFor(() => {
    expect(acceptProposal).toHaveBeenCalledWith('p1')
  })
  await waitFor(() => {
    expect(screen.getByText('Job Edit Page')).toBeInTheDocument()
  })
})

it('mostra o skeleton de carregamento enquanto as propostas ainda não chegaram', () => {
  ;(fetchProposals as jest.Mock).mockReturnValue(new Promise(() => {}))
  renderPage()
  expect(document.querySelector('.animate-pulse')).toBeInTheDocument()
})

it('mostra um alerta de erro quando falha ao carregar as propostas', async () => {
  ;(fetchProposals as jest.Mock).mockRejectedValue(new Error('boom'))
  renderPage()
  await waitFor(() => {
    expect(screen.getByText(/erro ao carregar propostas/i)).toBeInTheDocument()
  })
})

it('filtra por número ou nome do cliente através da busca', async () => {
  renderPage()
  await screen.findByText('PC-0001')
  const search = screen.getByPlaceholderText(/buscar por número ou cliente/i)
  await userEvent.type(search, 'Outra')

  expect(screen.queryByText('PC-0001')).not.toBeInTheDocument()
  expect(screen.getByText('PC-0002')).toBeInTheDocument()
})

it('filtra por status através do MultiSelect e mostra "Limpar filtros"', async () => {
  renderPage()
  await screen.findByText('PC-0001')

  await userEvent.click(screen.getByText('Status'))
  await userEvent.click(screen.getAllByText('Aceita')[0])

  expect(screen.queryByText('PC-0001')).not.toBeInTheDocument()
  expect(screen.getByText('PC-0002')).toBeInTheDocument()
  expect(screen.getByText('Limpar filtros')).toBeInTheDocument()
})

it('limpa a busca pelo botão "Limpar filtros" e restaura a lista completa', async () => {
  renderPage()
  await screen.findByText('PC-0001')
  const search = screen.getByPlaceholderText(/buscar por número ou cliente/i)
  fireEvent.change(search, { target: { value: 'Outra' } })
  expect(screen.queryByText('PC-0001')).not.toBeInTheDocument()

  fireEvent.click(screen.getByText('Limpar filtros'))
  await waitFor(() => {
    expect(screen.getByText('PC-0001')).toBeInTheDocument()
  })
})

it('filtra por tipo (Locação) através do MultiSelect', async () => {
  renderPage()
  await screen.findByText('PC-0001')

  await userEvent.click(screen.getByText('Tipo'))
  await userEvent.click(screen.getAllByText('Locação')[0])

  expect(screen.queryByText('PC-0001')).not.toBeInTheDocument()
  expect(screen.getByText('PC-0002')).toBeInTheDocument()
})

it('navega para /proposals/new ao clicar em "Nova Proposta"', async () => {
  renderPage()
  await screen.findByText('PC-0001')
  await userEvent.click(screen.getByText('Nova Proposta'))
  await waitFor(() => {
    expect(screen.getByText('New Proposal Page')).toBeInTheDocument()
  })
})

it('navega para /proposals/:id/edit ao clicar em uma linha da tabela', async () => {
  renderPage()
  const row = await screen.findByText('PC-0001')
  await userEvent.click(row)
  await waitFor(() => {
    expect(screen.getByText('Proposal Edit Page')).toBeInTheDocument()
  })
})

it('recusa a proposta pelo menu de ações e mostra toast de sucesso', async () => {
  ;(rejectProposal as jest.Mock).mockResolvedValue({ id: 'p1', status: 'rejected' })
  renderPage()
  const menuButtons = await screen.findAllByLabelText('Ações')
  await userEvent.click(menuButtons[0])
  await userEvent.click(screen.getByText('Recusar'))
  expect(screen.getByText(/tem certeza que deseja recusar/i)).toBeInTheDocument()

  const confirmButton = document.querySelector('.modal-action .btn-error') as HTMLButtonElement
  await userEvent.click(confirmButton)

  await waitFor(() => {
    expect(rejectProposal).toHaveBeenCalledWith('p1', expect.anything())
  })
  expect(toast.success).toHaveBeenCalledWith('Proposta recusada.')
  await waitFor(() => {
    expect(screen.queryByText(/tem certeza que deseja recusar/i)).not.toBeInTheDocument()
  })
})

it('mostra toast de erro específico quando a recusa falha com 409', async () => {
  ;(rejectProposal as jest.Mock).mockRejectedValue({ response: { status: 409 } })
  renderPage()
  const menuButtons = await screen.findAllByLabelText('Ações')
  await userEvent.click(menuButtons[0])
  await userEvent.click(screen.getByText('Recusar'))

  const confirmButton = document.querySelector('.modal-action .btn-error') as HTMLButtonElement
  await userEvent.click(confirmButton)

  await waitFor(() => {
    expect(toast.error).toHaveBeenCalledWith('Esta proposta já não está pendente.')
  })
})

it('fecha o modal de recusa ao cancelar, sem chamar rejectProposal', async () => {
  renderPage()
  const menuButtons = await screen.findAllByLabelText('Ações')
  await userEvent.click(menuButtons[0])
  await userEvent.click(screen.getByText('Recusar'))

  const cancelButton = document.querySelector('.modal-action .btn-ghost') as HTMLButtonElement
  await userEvent.click(cancelButton)

  await waitFor(() => {
    expect(screen.queryByText(/tem certeza que deseja recusar/i)).not.toBeInTheDocument()
  })
  expect(rejectProposal).not.toHaveBeenCalled()
})

it('navega para a edição da proposta ao clicar em Editar no menu de ações', async () => {
  ;(useAuthStore as unknown as jest.Mock).mockReturnValue({ user: { role: 'employee' } })
  renderPage()
  const menuButtons = await screen.findAllByLabelText('Ações')
  await userEvent.click(menuButtons[0])
  await userEvent.click(screen.getByText('Editar'))
  await waitFor(() => {
    expect(screen.getByText('Proposal Edit Page')).toBeInTheDocument()
  })
})

it('mostra o link de download apenas quando a proposta tem arquivo, sem navegar para a linha ao clicar', async () => {
  renderPage()
  await screen.findByText('PC-0001')
  const downloadLinks = screen.getAllByTitle('Baixar arquivo')
  expect(downloadLinks).toHaveLength(1)
  await userEvent.click(downloadLinks[0])
  expect(screen.queryByText('Proposal Edit Page')).not.toBeInTheDocument()
})

it('mostra mensagem de erro genérica de fallback quando a recusa falha sem status conhecido', async () => {
  ;(rejectProposal as jest.Mock).mockRejectedValue(new Error('boom'))
  renderPage()
  const menuButtons = await screen.findAllByLabelText('Ações')
  await userEvent.click(menuButtons[0])
  await userEvent.click(screen.getByText('Recusar'))

  const confirmButton = document.querySelector('.modal-action .btn-error') as HTMLButtonElement
  await userEvent.click(confirmButton)

  await waitFor(() => {
    expect(toast.error).toHaveBeenCalledWith('Erro ao recusar a proposta.')
  })
})
