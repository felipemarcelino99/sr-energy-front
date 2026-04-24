import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { ClientListPage } from '@/views/pages/ClientListPage'
import { useClientStore } from '@/viewmodels/client.viewmodel'
import type { Client } from '@/models/client.model'

jest.mock('@/services/client.service', () => ({
  fetchClients: jest.fn().mockResolvedValue([]),
  fetchClient: jest.fn().mockResolvedValue(null),
  fetchClientsBySearch: jest.fn().mockResolvedValue([]),
  createClient: jest.fn().mockResolvedValue({}),
  updateClient: jest.fn().mockResolvedValue({}),
  removeClient: jest.fn().mockResolvedValue(undefined),
}))

import * as clientService from '@/services/client.service'

const mockClient: Client = {
  id: '1',
  razaoSocial: 'Empresa Alfa Ltda',
  cnpj: '11.222.333/0001-81',
  segmento: 'Industrial',
  endereco: { logradouro: 'Rua A', numero: '1', bairro: 'B', cidade: 'SP', estado: 'SP', cep: '01001-000' },
  email: 'alfa@empresa.com',
  status: 'active',
  createdAt: '2024-01-01',
  updatedAt: '2024-01-01',
}

beforeEach(() => {
  jest.clearAllMocks()
  ;(clientService.fetchClients as jest.Mock).mockResolvedValue([mockClient])
  useClientStore.setState({ clients: [mockClient], loading: false, error: null, search: '' })
})

function renderPage() {
  return render(
    <MemoryRouter>
      <ClientListPage />
    </MemoryRouter>
  )
}

describe('ClientListPage', () => {
  it('exibe título "Clientes"', () => {
    renderPage()
    expect(screen.getByText('Clientes')).toBeInTheDocument()
  })

  it('exibe botão "Adicionar Cliente"', () => {
    renderPage()
    expect(screen.getByText(/adicionar cliente/i)).toBeInTheDocument()
  })

  it('exibe a razão social do cliente na tabela', async () => {
    renderPage()
    await waitFor(() => {
      expect(screen.getByText('Empresa Alfa Ltda')).toBeInTheDocument()
    })
  })

  it('exibe mensagem quando não há clientes', async () => {
    ;(clientService.fetchClients as jest.Mock).mockResolvedValue([])
    useClientStore.setState({ clients: [], loading: false, error: null, search: '' })
    renderPage()
    await waitFor(() => {
      expect(screen.getByText(/nenhum cliente/i)).toBeInTheDocument()
    })
  })
})
