import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { ClientFormPage } from '@/views/pages/ClientFormPage'
import { useClientStore } from '@/viewmodels/client.viewmodel'

jest.mock('@/services/client.service', () => ({
  fetchClients: jest.fn().mockResolvedValue([]),
  fetchClient: jest.fn().mockResolvedValue(null),
  fetchClientsBySearch: jest.fn().mockResolvedValue([]),
  createClient: jest.fn().mockResolvedValue({}),
  updateClient: jest.fn().mockResolvedValue({}),
  removeClient: jest.fn().mockResolvedValue(undefined),
}))

jest.mock('@/services/contract.service', () => ({
  fetchContracts: jest.fn().mockResolvedValue([]),
  fetchContractsByClient: jest.fn().mockResolvedValue([]),
  createContract: jest.fn().mockResolvedValue({}),
  updateContract: jest.fn().mockResolvedValue({}),
  removeContract: jest.fn().mockResolvedValue(undefined),
  fetchContract: jest.fn().mockResolvedValue(null),
  uploadContractFile: jest.fn().mockResolvedValue(''),
}))

beforeEach(() => {
  useClientStore.setState({ clients: [], loading: false, error: null, search: '' })
})

function renderCreate() {
  return render(
    <MemoryRouter initialEntries={['/clients/new']}>
      <Routes>
        <Route path="/clients/new" element={<ClientFormPage />} />
      </Routes>
    </MemoryRouter>
  )
}

function renderEdit(id = '1') {
  return render(
    <MemoryRouter initialEntries={[`/clients/${id}/edit`]}>
      <Routes>
        <Route path="/clients/:id/edit" element={<ClientFormPage />} />
      </Routes>
    </MemoryRouter>
  )
}

describe('ClientFormPage — criação', () => {
  it('exibe título "Novo Cliente"', () => {
    renderCreate()
    expect(screen.getByText(/novo cliente/i)).toBeInTheDocument()
  })

  it('não exibe abas no modo de criação', () => {
    renderCreate()
    expect(screen.queryByRole('tab')).not.toBeInTheDocument()
  })
})

describe('ClientFormPage — edição', () => {
  it('exibe abas "Dados Cadastrais" e "Contratos"', async () => {
    renderEdit()
    await waitFor(() => {
      expect(screen.getByRole('tab', { name: /dados cadastrais/i })).toBeInTheDocument()
      expect(screen.getByRole('tab', { name: /contratos/i })).toBeInTheDocument()
    })
  })
})
