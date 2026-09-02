import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ProposalListPage } from '@/views/pages/ProposalListPage'
import { useAuthStore } from '@/viewmodels/auth.viewmodel'
import { fetchProposals } from '@/services/proposal.service'
import { useEmployeeStore } from '@/viewmodels/employee.viewmodel'
import { useBagStore } from '@/viewmodels/bag.viewmodel'

jest.mock('@/viewmodels/auth.viewmodel')
jest.mock('@/services/proposal.service')
jest.mock('@/viewmodels/employee.viewmodel')
jest.mock('@/viewmodels/bag.viewmodel')

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
  endDate: '2030-01-01',
  fileUrl: undefined,
  status: 'pending',
  contractId: null,
  jobId: null,
  createdAt: '2025-01-01',
  updatedAt: '2025-01-01',
}

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <ProposalListPage />
      </MemoryRouter>
    </QueryClientProvider>
  )
}

beforeEach(() => {
  jest.clearAllMocks()
  ;(fetchProposals as jest.Mock).mockResolvedValue([proposal])
  ;(useEmployeeStore as unknown as jest.Mock).mockReturnValue({
    employees: [{ id: 'e1', name: 'Colaborador Teste' }],
    load: jest.fn(),
  })
  ;(useBagStore as unknown as jest.Mock).mockReturnValue({
    bags: [{ id: 'b1', name: 'Mala 1', model: 'M1' }],
    load: jest.fn(),
  })
})

it('exibe botões aceitar/recusar para propostas pendentes quando usuário é admin', async () => {
  ;(useAuthStore as unknown as jest.Mock).mockReturnValue({ user: { role: 'admin' } })
  renderPage()
  expect(await screen.findByTitle('Aceitar proposta')).toBeInTheDocument()
  expect(screen.getByTitle('Recusar proposta')).toBeInTheDocument()
})

it('não exibe botões aceitar/recusar quando usuário é employee', async () => {
  ;(useAuthStore as unknown as jest.Mock).mockReturnValue({ user: { role: 'employee' } })
  renderPage()
  expect(await screen.findByText('PC-0001')).toBeInTheDocument()
  expect(screen.queryByTitle('Aceitar proposta')).not.toBeInTheDocument()
  expect(screen.queryByTitle('Recusar proposta')).not.toBeInTheDocument()
})

it('abre o modal de aceitar com os campos opcionais da OS ao clicar em Aceitar', async () => {
  ;(useAuthStore as unknown as jest.Mock).mockReturnValue({ user: { role: 'admin' } })
  renderPage()
  const acceptButton = await screen.findByTitle('Aceitar proposta')
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
