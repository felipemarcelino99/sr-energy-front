import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { ContractListPage } from '@/views/pages/ContractListPage'
import { useContractStore } from '@/viewmodels/contract.viewmodel'
import { useAuthStore } from '@/viewmodels/auth.viewmodel'

jest.mock('@/viewmodels/contract.viewmodel')
jest.mock('@/viewmodels/auth.viewmodel')

const contract = {
  id: 'c1',
  clientId: 'cl1',
  client: { razaoSocial: 'Cliente Teste' },
  contractType: 'service',
  contractValue: 1000,
  startDate: '2025-01-01',
  endDate: '2030-01-01',
  recurring: false,
  fileUrl: undefined,
  approvalStatus: 'pending',
}

function mockContractStore() {
  ;(useContractStore as unknown as jest.Mock).mockReturnValue({
    load: jest.fn(),
    filtered: () => [contract],
    remove: jest.fn(),
    terminate: jest.fn(),
    accept: jest.fn(),
    reject: jest.fn(),
    loading: false,
    error: null,
    search: '',
    setSearch: jest.fn(),
    setStatusFilter: jest.fn(),
    setTypeFilter: jest.fn(),
    setRecurringFilter: jest.fn(),
  })
}

function renderPage() {
  return render(
    <MemoryRouter>
      <ContractListPage />
    </MemoryRouter>
  )
}

beforeEach(() => {
  mockContractStore()
})

it('exibe botões aceitar/recusar para propostas pendentes quando usuário é admin', () => {
  ;(useAuthStore as unknown as jest.Mock).mockReturnValue({ user: { role: 'admin' } })
  renderPage()
  expect(screen.getByTitle('Aceitar proposta')).toBeInTheDocument()
  expect(screen.getByTitle('Recusar proposta')).toBeInTheDocument()
})

it('não exibe botões aceitar/recusar quando usuário é employee', () => {
  ;(useAuthStore as unknown as jest.Mock).mockReturnValue({ user: { role: 'employee' } })
  renderPage()
  expect(screen.queryByTitle('Aceitar proposta')).not.toBeInTheDocument()
  expect(screen.queryByTitle('Recusar proposta')).not.toBeInTheDocument()
})
