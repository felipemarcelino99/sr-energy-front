import api from '@/services/api'
import {
  fetchEquipmentRentals,
  fetchEquipmentRental,
  createEquipmentRental,
  updateEquipmentRental,
  removeEquipmentRental,
} from '../../services/equipment-rental.service'
import type { EquipmentRentalFormData } from '@/models/equipment-rental.model'

jest.mock('@/services/api')
const mockApi = api as jest.Mocked<typeof api>

describe('equipment-rental.service — fetchEquipmentRentals', () => {
  it('chama GET /equipment-rentals e retorna a lista', async () => {
    const rentals = [{ id: '1' }]
    mockApi.get.mockResolvedValue({ data: rentals })
    const result = await fetchEquipmentRentals()
    expect(mockApi.get).toHaveBeenCalledWith('/equipment-rentals')
    expect(result).toEqual(rentals)
  })
})

describe('equipment-rental.service — fetchEquipmentRental', () => {
  it('chama GET /equipment-rentals/:id', async () => {
    mockApi.get.mockResolvedValue({ data: { id: '1' } })
    await fetchEquipmentRental('1')
    expect(mockApi.get).toHaveBeenCalledWith('/equipment-rentals/1')
  })
})

describe('equipment-rental.service — createEquipmentRental', () => {
  it('chama POST /equipment-rentals com os dados', async () => {
    const formData: EquipmentRentalFormData = {
      contractId: 'c1',
      bagId: 'b1',
      startDate: '2027-01-01',
      endDate: '2027-01-10',
      value: 100,
    }
    mockApi.post.mockResolvedValue({ data: { id: '1', ...formData } })
    await createEquipmentRental(formData)
    expect(mockApi.post).toHaveBeenCalledWith('/equipment-rentals', formData)
  })
})

describe('equipment-rental.service — updateEquipmentRental', () => {
  it('chama PUT /equipment-rentals/:id com os dados', async () => {
    const partial = { endDate: '2027-01-01' }
    mockApi.put.mockResolvedValue({ data: { id: '1' } })
    await updateEquipmentRental('1', partial)
    expect(mockApi.put).toHaveBeenCalledWith('/equipment-rentals/1', partial)
  })
})

describe('equipment-rental.service — removeEquipmentRental', () => {
  it('chama DELETE /equipment-rentals/:id', async () => {
    mockApi.delete.mockResolvedValue({ data: undefined })
    await removeEquipmentRental('1')
    expect(mockApi.delete).toHaveBeenCalledWith('/equipment-rentals/1')
  })
})
