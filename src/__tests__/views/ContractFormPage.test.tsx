import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ContractFormPage } from '@/views/pages/ContractFormPage'
import { useContractStore } from '@/viewmodels/contract.viewmodel'
import { useClientStore } from '@/viewmodels/client.viewmodel'
import { fetchContract, uploadContractFile } from '@/services/contract.service'
import { fetchProposals } from '@/services/proposal.service'
import { fetchJobs } from '@/services/job.service'

jest.mock('@/viewmodels/contract.viewmodel')
jest.mock('@/services/contract.service', () => ({
  fetchContract: jest.fn(),
  uploadContractFile: jest.fn(),
}))
jest.mock('@/services/proposal.service', () => ({
  fetchProposals: jest.fn().mockResolvedValue([]),
}))
jest.mock('@/services/job.service', () => ({
  fetchJobs: jest.fn().mockResolvedValue([]),
}))
jest.mock('@/services/audit-log.service', () => ({
  fetchAuditLog: jest.fn().mockResolvedValue([]),
}))
jest.mock('@/services/document.service', () => ({
  fetchDocuments: jest.fn().mockResolvedValue([]),
}))
jest.mock('@/services/employee.service', () => ({
  fetchEmployees: jest.fn().mockResolvedValue([]),
}))

const mockCreate = jest.fn().mockResolvedValue(undefined)
const mockUpdate = jest.fn().mockResolvedValue(undefined)
const mockLoadClients = jest.fn()

const editContract = {
  id: 'ct1',
  number: 'CT-0001',
  clientId: 'cl1',
  description: 'Contrato de manutenção',
  startDate: '2026-01-01',
  endDate: '2026-12-31',
  fileUrl: undefined,
  recurring: false,
  contractType: 'service',
  contractValue: 5000,
}

function renderCreate() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/contracts/new']}>
        <Routes>
          <Route path="/contracts/new" element={<ContractFormPage />} />
          <Route path="/contracts" element={<div>Contracts List</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  )
}

function renderEdit(id = 'ct1') {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[`/contracts/${id}/edit`]}>
        <Routes>
          <Route path="/contracts/:id/edit" element={<ContractFormPage />} />
          <Route path="/contracts" element={<div>Contracts List</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  )
}

beforeEach(() => {
  jest.clearAllMocks()
  ;(useContractStore as unknown as jest.Mock).mockReturnValue({
    create: mockCreate,
    update: mockUpdate,
  })
  useClientStore.setState({
    clients: [{ id: 'cl1', razaoSocial: 'Cliente Teste', cnpj: '00.000.000/0001-00' }],
    loading: false,
    error: null,
    search: '',
    load: mockLoadClients,
  } as never)
  ;(fetchContract as jest.Mock).mockResolvedValue(editContract)
  ;(uploadContractFile as jest.Mock).mockResolvedValue('https://files/new.pdf')
  ;(fetchProposals as jest.Mock).mockResolvedValue([])
  ;(fetchJobs as jest.Mock).mockResolvedValue([])
})

it('o wrapper principal não contém classe max-w-xl', () => {
  renderCreate()
  expect(document.querySelector('.max-w-xl')).not.toBeInTheDocument()
})

it('shows validation error when submitting empty required fields', async () => {
  renderCreate()
  fireEvent.click(screen.getByText('Criar'))
  await waitFor(() => {
    expect(screen.getByTestId('error-clientId')).toBeInTheDocument()
  })
  expect(mockCreate).not.toHaveBeenCalled()
})

it('calls create on valid submit and navigates to /contracts', async () => {
  renderCreate()
  fireEvent.change(screen.getByLabelText(/descrição/i), { target: { value: 'Contrato novo' } })
  fireEvent.change(screen.getByLabelText(/data de início/i), { target: { value: '2026-01-01' } })
  fireEvent.change(screen.getByLabelText(/data de término/i), { target: { value: '2026-12-31' } })
  fireEvent.change(screen.getByLabelText(/valor do contrato/i), { target: { value: '3000' } })

  const clientInput = screen.getByPlaceholderText(/buscar cliente/i)
  fireEvent.change(clientInput, { target: { value: 'Cliente' } })
  fireEvent.mouseDown(screen.getByText('Cliente Teste'))

  fireEvent.click(screen.getByText('Criar'))
  await waitFor(() => {
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        clientId: 'cl1',
        description: 'Contrato novo',
        contractValue: 3000,
      })
    )
  })
  await waitFor(() => {
    expect(screen.getByText('Contracts List')).toBeInTheDocument()
  })
})

it('navigates to /contracts on cancel without calling create', async () => {
  renderCreate()
  fireEvent.click(screen.getByText('Cancelar'))
  await waitFor(() => {
    expect(screen.getByText('Contracts List')).toBeInTheDocument()
  })
  expect(mockCreate).not.toHaveBeenCalled()
})

it('pre-fills form fields in edit mode and calls update on submit', async () => {
  renderEdit()
  await waitFor(() => {
    expect(screen.getByLabelText(/descrição/i)).toHaveValue('Contrato de manutenção')
  })

  fireEvent.click(screen.getByText('Salvar'))
  await waitFor(() => {
    expect(mockUpdate).toHaveBeenCalledWith(
      'ct1',
      expect.objectContaining({ clientId: 'cl1', description: 'Contrato de manutenção' })
    )
  })
})

it('does not show a "PC de origem" link anymore', async () => {
  renderEdit()
  await waitFor(() => {
    expect(screen.getByLabelText(/descrição/i)).toHaveValue('Contrato de manutenção')
  })
  expect(screen.queryByText(/pc de origem/i)).not.toBeInTheDocument()
})

it('shows Dados/Propostas/OS tabs in edit mode, hidden in create mode', async () => {
  renderCreate()
  expect(screen.queryByRole('tab')).not.toBeInTheDocument()

  renderEdit()
  await waitFor(() => {
    expect(screen.getByRole('tab', { name: 'Dados' })).toBeInTheDocument()
  })
  expect(screen.getByRole('tab', { name: 'Propostas' })).toBeInTheDocument()
  expect(screen.getByRole('tab', { name: 'OS' })).toBeInTheDocument()
})

it('lists the PCs linked to the contract in the Propostas tab, with a link to each', async () => {
  ;(fetchProposals as jest.Mock).mockResolvedValue([
    {
      id: 'p1',
      number: 'PC-0001',
      description: 'Comissionamento',
      status: 'accepted',
      startDate: '2026-01-01',
    },
  ])
  renderEdit()
  await waitFor(() => {
    expect(screen.getByRole('tab', { name: 'Propostas' })).toBeInTheDocument()
  })
  fireEvent.click(screen.getByRole('tab', { name: 'Propostas' }))

  await waitFor(() => {
    expect(fetchProposals).toHaveBeenCalledWith({ contractId: 'ct1' })
  })
  await waitFor(() => {
    expect(screen.getByText('PC-0001')).toBeInTheDocument()
  })
  expect(screen.getByText('Ver PC').closest('a')).toHaveAttribute('href', '/proposals/p1/edit')
})

it('lists the OS linked to the contract in the OS tab, with a link to each', async () => {
  ;(fetchJobs as jest.Mock).mockResolvedValue([
    { id: 'j1', number: 'AA001', contractId: 'ct1', status: 'scheduled', employeeName: 'João' },
    { id: 'j2', number: 'AA002', contractId: 'ct2', status: 'scheduled', employeeName: 'Ana' },
  ])
  renderEdit()
  await waitFor(() => {
    expect(screen.getByRole('tab', { name: 'OS' })).toBeInTheDocument()
  })
  fireEvent.click(screen.getByRole('tab', { name: 'OS' }))

  await waitFor(() => {
    expect(screen.getByText('AA001')).toBeInTheDocument()
  })
  expect(screen.queryByText('AA002')).not.toBeInTheDocument()
  expect(screen.getByText('Ver OS').closest('a')).toHaveAttribute('href', '/jobs/j1/edit')
})

it('only shows the Salvar button on the Dados tab', async () => {
  renderEdit()
  await waitFor(() => {
    expect(screen.getByText('Salvar')).toBeInTheDocument()
  })
  fireEvent.click(screen.getByRole('tab', { name: 'Propostas' }))
  await waitFor(() => {
    expect(screen.queryByText('Salvar')).not.toBeInTheDocument()
  })
})

it('shows the timeline in edit mode', async () => {
  renderEdit()
  await waitFor(() => {
    expect(screen.getByText(/linha do tempo/i)).toBeInTheDocument()
  })
})
