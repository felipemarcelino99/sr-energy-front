import { useClientStore } from '@/viewmodels/client.viewmodel'
import type { Client } from '@/models/client.model'

jest.mock('@/services/client.service', () => ({
  fetchClients: jest.fn(),
  createClient: jest.fn(),
  updateClient: jest.fn(),
  removeClient: jest.fn(),
  fetchClientsBySearch: jest.fn(),
}))

import * as clientService from '@/services/client.service'

const mockClient: Client = {
  id: '1',
  razaoSocial: 'Empresa Teste Ltda',
  cnpj: '11.222.333/0001-81',
  segmento: 'Industrial',
  endereco: {
    logradouro: 'Rua das Flores',
    numero: '100',
    bairro: 'Centro',
    cidade: 'São Paulo',
    estado: 'SP',
    cep: '01001-000',
  },
  telefone: '(11) 3333-4444',
  celular: '(11) 99999-8888',
  email: 'contato@empresa.com',
  status: 'active',
  createdAt: '2024-01-01',
  updatedAt: '2024-01-01',
}

const formData = {
  razaoSocial: 'Empresa Teste Ltda',
  cnpj: '11.222.333/0001-81',
  segmento: 'Industrial',
  endereco: {
    logradouro: 'Rua das Flores',
    numero: '100',
    bairro: 'Centro',
    cidade: 'São Paulo',
    estado: 'SP',
    cep: '01001-000',
  },
  email: 'contato@empresa.com',
  status: 'active' as const,
}

beforeEach(() => {
  useClientStore.setState({ clients: [], loading: false, error: null, search: '' })
  jest.clearAllMocks()
})

describe('client.viewmodel — load', () => {
  it('carrega clientes e atualiza o store', async () => {
    ;(clientService.fetchClients as jest.Mock).mockResolvedValue([mockClient])
    await useClientStore.getState().load()
    expect(useClientStore.getState().clients).toHaveLength(1)
    expect(useClientStore.getState().loading).toBe(false)
  })

  it('define erro quando a requisição falha', async () => {
    ;(clientService.fetchClients as jest.Mock).mockRejectedValue(new Error('Falha'))
    await useClientStore.getState().load()
    expect(useClientStore.getState().error).toBe('Falha')
    expect(useClientStore.getState().loading).toBe(false)
  })
})

describe('client.viewmodel — create', () => {
  it('chama o service e adiciona ao store', async () => {
    ;(clientService.createClient as jest.Mock).mockResolvedValue(mockClient)
    await useClientStore.getState().create(formData)
    expect(clientService.createClient).toHaveBeenCalledWith(formData)
    expect(useClientStore.getState().clients).toHaveLength(1)
  })
})

describe('client.viewmodel — update', () => {
  it('chama o service e atualiza o store', async () => {
    const updated = { ...mockClient, razaoSocial: 'Outra Empresa' }
    useClientStore.setState({ clients: [mockClient] })
    ;(clientService.updateClient as jest.Mock).mockResolvedValue(updated)
    await useClientStore.getState().update('1', { razaoSocial: 'Outra Empresa' })
    const c = useClientStore.getState().clients.find((c) => c.id === '1')
    expect(c?.razaoSocial).toBe('Outra Empresa')
  })
})

describe('client.viewmodel — remove', () => {
  it('chama o service e remove do store', async () => {
    useClientStore.setState({ clients: [mockClient] })
    ;(clientService.removeClient as jest.Mock).mockResolvedValue(undefined)
    await useClientStore.getState().remove('1')
    expect(clientService.removeClient).toHaveBeenCalledWith('1')
    expect(useClientStore.getState().clients).toHaveLength(0)
  })
})

describe('client.viewmodel — filtered', () => {
  beforeEach(() => {
    useClientStore.setState({ clients: [mockClient], search: '' })
  })

  it('retorna todos quando search está vazio', () => {
    expect(useClientStore.getState().filtered()).toHaveLength(1)
  })

  it('filtra por razaoSocial (case-insensitive)', () => {
    useClientStore.setState({ search: 'empresa teste' })
    expect(useClientStore.getState().filtered()).toHaveLength(1)
  })

  it('filtra por CNPJ', () => {
    useClientStore.setState({ search: '11.222.333' })
    expect(useClientStore.getState().filtered()).toHaveLength(1)
  })

  it('retorna vazio quando não há correspondência', () => {
    useClientStore.setState({ search: 'xyz não existe' })
    expect(useClientStore.getState().filtered()).toHaveLength(0)
  })
})
