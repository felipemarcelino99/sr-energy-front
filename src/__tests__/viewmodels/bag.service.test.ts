import api from '@/services/api'
import {
  fetchBags,
  fetchBag,
  createBag,
  updateBag,
  removeBag,
  uploadCertificate,
  removeCertificate,
} from '../../services/bag.service'
import type { BagFormData } from '@/models/bag.model'

jest.mock('@/services/api')
const mockApi = api as jest.Mocked<typeof api>

describe('bag.service — fetchBags', () => {
  it('chama GET /bags e retorna a lista', async () => {
    const bags = [{ id: '1', name: 'Mala' }]
    mockApi.get.mockResolvedValue({ data: bags })
    const result = await fetchBags()
    expect(mockApi.get).toHaveBeenCalledWith('/bags')
    expect(result).toEqual(bags)
  })
})

describe('bag.service — fetchBag', () => {
  it('chama GET /bags/:id', async () => {
    mockApi.get.mockResolvedValue({ data: { id: '1' } })
    await fetchBag('1')
    expect(mockApi.get).toHaveBeenCalledWith('/bags/1')
  })
})

describe('bag.service — createBag', () => {
  it('chama POST /bags com os dados', async () => {
    const formData: BagFormData = { name: 'Mala', model: 'X', quantity: 1 }
    mockApi.post.mockResolvedValue({ data: { id: '1', ...formData } })
    await createBag(formData)
    expect(mockApi.post).toHaveBeenCalledWith('/bags', formData)
  })
})

describe('bag.service — updateBag', () => {
  it('chama PUT /bags/:id com os dados', async () => {
    const partial = { name: 'Atualizada' }
    mockApi.put.mockResolvedValue({ data: { id: '1' } })
    await updateBag('1', partial)
    expect(mockApi.put).toHaveBeenCalledWith('/bags/1', partial)
  })
})

describe('bag.service — removeBag', () => {
  it('chama DELETE /bags/:id', async () => {
    mockApi.delete.mockResolvedValue({ data: undefined })
    await removeBag('1')
    expect(mockApi.delete).toHaveBeenCalledWith('/bags/1')
  })
})

describe('bag.service — uploadCertificate', () => {
  it('chama POST /bags/:id/certificates com FormData e header multipart', async () => {
    mockApi.post.mockResolvedValue({ data: { id: '1' } })
    const file = new File(['x'], 'cert.pdf')
    await uploadCertificate('1', file, '2027-01-01')
    expect(mockApi.post).toHaveBeenCalledWith('/bags/1/certificates', expect.any(FormData), {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  })
})

describe('bag.service — removeCertificate', () => {
  it('chama DELETE /bags/:id/certificates/:certId', async () => {
    mockApi.delete.mockResolvedValue({ data: { id: '1' } })
    await removeCertificate('1', 'cert-1')
    expect(mockApi.delete).toHaveBeenCalledWith('/bags/1/certificates/cert-1')
  })
})
