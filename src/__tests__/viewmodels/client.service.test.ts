import api from '@/services/api'
import {
  fetchClients,
  fetchClient,
  fetchClientsBySearch,
  createClient,
  updateClient,
  removeClient,
} from '../../services/client.service'
import type { ClientFormData } from '@/models/client.model'

jest.mock('@/services/api')
const mockApi = api as jest.Mocked<typeof api>

describe('client.service — fetchClients', () => {
  it('chama GET /clients e retorna a lista', async () => {
    const clients = [{ id: '1', razaoSocial: 'Cliente X' }]
    mockApi.get.mockResolvedValue({ data: clients })
    const result = await fetchClients()
    expect(mockApi.get).toHaveBeenCalledWith('/clients')
    expect(result).toEqual(clients)
  })
})

describe('client.service — fetchClient', () => {
  it('chama GET /clients/:id', async () => {
    mockApi.get.mockResolvedValue({ data: { id: '1' } })
    await fetchClient('1')
    expect(mockApi.get).toHaveBeenCalledWith('/clients/1')
  })
})

describe('client.service — fetchClientsBySearch', () => {
  it('chama GET /clients com params.search', async () => {
    mockApi.get.mockResolvedValue({ data: [] })
    await fetchClientsBySearch('acme')
    expect(mockApi.get).toHaveBeenCalledWith('/clients', { params: { search: 'acme' } })
  })
})

describe('client.service — createClient', () => {
  it('chama POST /clients com os dados', async () => {
    const formData: ClientFormData = {
      razaoSocial: 'Cliente X',
      cnpj: '11222333000181',
      segmento: 'Industrial',
      email: 'contato@clientex.com',
      status: 'active',
      endereco: {
        logradouro: 'Rua A',
        numero: '1',
        bairro: 'Centro',
        cidade: 'Curitiba',
        estado: 'PR',
        cep: '80000-000',
      },
    }
    mockApi.post.mockResolvedValue({ data: { id: '1', ...formData } })
    await createClient(formData)
    expect(mockApi.post).toHaveBeenCalledWith('/clients', formData)
  })
})

describe('client.service — updateClient', () => {
  it('chama PUT /clients/:id com os dados', async () => {
    const partial = { razaoSocial: 'Atualizada' }
    mockApi.put.mockResolvedValue({ data: { id: '1' } })
    await updateClient('1', partial)
    expect(mockApi.put).toHaveBeenCalledWith('/clients/1', partial)
  })
})

describe('client.service — removeClient', () => {
  it('chama DELETE /clients/:id', async () => {
    mockApi.delete.mockResolvedValue({ data: undefined })
    await removeClient('1')
    expect(mockApi.delete).toHaveBeenCalledWith('/clients/1')
  })
})
