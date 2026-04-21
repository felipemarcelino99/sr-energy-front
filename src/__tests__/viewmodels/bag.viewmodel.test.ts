import { useBagStore } from '@/viewmodels/bag.viewmodel'
import type { Bag } from '@/models/bag.model'

jest.mock('@/services/bag.service', () => ({
  fetchBags: jest.fn(),
  createBag: jest.fn(),
  updateBag: jest.fn(),
  removeBag: jest.fn(),
  uploadCertificate: jest.fn(),
  removeCertificate: jest.fn(),
}))

import * as bagService from '@/services/bag.service'

const makeBag = (overrides: Partial<Bag> = {}): Bag => ({
  id: 'b1',
  name: 'Mala Teste',
  model: 'Modelo A',
  quantity: 2,
  calibrationCertificates: [],
  createdAt: '2025-01-01',
  updatedAt: '2025-01-01',
  ...overrides,
})

beforeEach(() => {
  useBagStore.setState({ bags: [], loading: false, error: null, search: '' })
  jest.clearAllMocks()
})

describe('useBagStore', () => {
  it('carrega malas via load()', async () => {
    const bags = [makeBag()]
    ;(bagService.fetchBags as jest.Mock).mockResolvedValue(bags)
    await useBagStore.getState().load()
    expect(useBagStore.getState().bags).toEqual(bags)
    expect(useBagStore.getState().loading).toBe(false)
  })

  it('define error quando load() falha', async () => {
    ;(bagService.fetchBags as jest.Mock).mockRejectedValue(new Error('Erro de rede'))
    await useBagStore.getState().load()
    expect(useBagStore.getState().error).toBe('Erro de rede')
  })

  it('adiciona mala via create()', async () => {
    const bag = makeBag({ id: 'b2', name: 'Nova Mala' })
    ;(bagService.createBag as jest.Mock).mockResolvedValue(bag)
    await useBagStore.getState().create({ name: 'Nova Mala', model: 'M', quantity: 1 })
    expect(useBagStore.getState().bags).toContainEqual(bag)
  })

  it('remove mala via remove()', async () => {
    useBagStore.setState({ bags: [makeBag({ id: 'b1' })] })
    ;(bagService.removeBag as jest.Mock).mockResolvedValue(undefined)
    await useBagStore.getState().remove('b1')
    expect(useBagStore.getState().bags).toHaveLength(0)
  })

  it('filtra por busca de texto', () => {
    useBagStore.setState({
      bags: [makeBag({ name: 'Mala Alpha' }), makeBag({ id: 'b2', name: 'Mala Beta', model: 'X' })],
      search: 'alpha',
    })
    const result = useBagStore.getState().filtered()
    expect(result).toHaveLength(1)
    expect(result[0].name).toBe('Mala Alpha')
  })

  it('retorna malas com certificados próximos ao vencimento', () => {
    const today = new Date()
    const in10Days = new Date(today.getTime() + 10 * 86400000).toISOString().split('T')[0]
    const in90Days = new Date(today.getTime() + 90 * 86400000).toISOString().split('T')[0]
    const bagSoon = makeBag({
      id: 'soon',
      calibrationCertificates: [{ id: 'c1', fileUrl: 'u', expiryDate: in10Days }],
    })
    const bagFar = makeBag({
      id: 'far',
      calibrationCertificates: [{ id: 'c2', fileUrl: 'u', expiryDate: in90Days }],
    })
    useBagStore.setState({ bags: [bagSoon, bagFar] })
    const expiring = useBagStore.getState().expiringSoon()
    expect(expiring).toHaveLength(1)
    expect(expiring[0].id).toBe('soon')
  })
})
