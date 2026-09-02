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

  it('atualiza mala via update()', async () => {
    useBagStore.setState({ bags: [makeBag({ id: 'b1', name: 'Antiga' })] })
    const updated = makeBag({ id: 'b1', name: 'Atualizada' })
    ;(bagService.updateBag as jest.Mock).mockResolvedValue(updated)
    await useBagStore.getState().update('b1', { name: 'Atualizada' })
    expect(bagService.updateBag).toHaveBeenCalledWith('b1', { name: 'Atualizada' })
    expect(useBagStore.getState().bags[0]).toEqual(updated)
  })

  it('envia certificado via uploadCert() e atualiza a mala no store', async () => {
    useBagStore.setState({ bags: [makeBag({ id: 'b1' })] })
    const updated = makeBag({
      id: 'b1',
      calibrationCertificates: [{ id: 'c1', fileUrl: 'u', expiryDate: '2027-01-01' }],
    })
    ;(bagService.uploadCertificate as jest.Mock).mockResolvedValue(updated)
    const file = new File(['x'], 'cert.pdf')
    await useBagStore.getState().uploadCert('b1', file, '2027-01-01')
    expect(bagService.uploadCertificate).toHaveBeenCalledWith('b1', file, '2027-01-01')
    expect(useBagStore.getState().bags[0]).toEqual(updated)
  })

  it('remove certificado via removeCert() e atualiza a mala no store', async () => {
    useBagStore.setState({
      bags: [
        makeBag({
          id: 'b1',
          calibrationCertificates: [{ id: 'c1', fileUrl: 'u', expiryDate: '2027-01-01' }],
        }),
      ],
    })
    const updated = makeBag({ id: 'b1', calibrationCertificates: [] })
    ;(bagService.removeCertificate as jest.Mock).mockResolvedValue(updated)
    await useBagStore.getState().removeCert('b1', 'c1')
    expect(bagService.removeCertificate).toHaveBeenCalledWith('b1', 'c1')
    expect(useBagStore.getState().bags[0]).toEqual(updated)
  })

  it('atualiza search via setSearch()', () => {
    useBagStore.getState().setSearch('nova busca')
    expect(useBagStore.getState().search).toBe('nova busca')
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
