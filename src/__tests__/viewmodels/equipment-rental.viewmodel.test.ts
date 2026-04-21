import { useEquipmentRentalStore } from '@/viewmodels/equipment-rental.viewmodel'
import type { EquipmentRental } from '@/models/equipment-rental.model'

jest.mock('@/services/equipment-rental.service', () => ({
  fetchEquipmentRentals: jest.fn(),
  createEquipmentRental: jest.fn(),
  updateEquipmentRental: jest.fn(),
  removeEquipmentRental: jest.fn(),
}))

import * as rentalService from '@/services/equipment-rental.service'

const makeRental = (overrides: Partial<EquipmentRental> = {}): EquipmentRental => ({
  id: 'r1',
  contractId: 'c1',
  contractClientName: 'Cliente A',
  bagId: 'b1',
  bagName: 'Mala X',
  startDate: '2025-01-01',
  endDate: '2025-06-01',
  value: 1000,
  createdAt: '2025-01-01',
  updatedAt: '2025-01-01',
  ...overrides,
})

beforeEach(() => {
  useEquipmentRentalStore.setState({ rentals: [], loading: false, error: null, search: '', contractFilter: '' })
  jest.clearAllMocks()
})

describe('useEquipmentRentalStore', () => {
  it('carrega locações via load()', async () => {
    const rentals = [makeRental()]
    ;(rentalService.fetchEquipmentRentals as jest.Mock).mockResolvedValue(rentals)
    await useEquipmentRentalStore.getState().load()
    expect(useEquipmentRentalStore.getState().rentals).toEqual(rentals)
  })

  it('define error quando load() falha', async () => {
    ;(rentalService.fetchEquipmentRentals as jest.Mock).mockRejectedValue(new Error('Erro'))
    await useEquipmentRentalStore.getState().load()
    expect(useEquipmentRentalStore.getState().error).toBe('Erro')
  })

  it('adiciona locação via create()', async () => {
    const rental = makeRental({ id: 'r2' })
    ;(rentalService.createEquipmentRental as jest.Mock).mockResolvedValue(rental)
    await useEquipmentRentalStore.getState().create({ contractId: 'c1', bagId: 'b1', startDate: '2025-01-01', endDate: '2025-06-01', value: 1000 })
    expect(useEquipmentRentalStore.getState().rentals).toContainEqual(rental)
  })

  it('remove locação via remove()', async () => {
    useEquipmentRentalStore.setState({ rentals: [makeRental()] })
    ;(rentalService.removeEquipmentRental as jest.Mock).mockResolvedValue(undefined)
    await useEquipmentRentalStore.getState().remove('r1')
    expect(useEquipmentRentalStore.getState().rentals).toHaveLength(0)
  })

  it('filtra por cliente via search', () => {
    useEquipmentRentalStore.setState({
      rentals: [makeRental({ contractClientName: 'Alpha Corp' }), makeRental({ id: 'r2', contractClientName: 'Beta Inc' })],
      search: 'alpha',
    })
    const result = useEquipmentRentalStore.getState().filtered()
    expect(result).toHaveLength(1)
    expect(result[0].contractClientName).toBe('Alpha Corp')
  })

  it('filtra por contrato via contractFilter', () => {
    useEquipmentRentalStore.setState({
      rentals: [makeRental({ contractId: 'c1' }), makeRental({ id: 'r2', contractId: 'c2' })],
      contractFilter: 'c1',
    })
    const result = useEquipmentRentalStore.getState().filtered()
    expect(result).toHaveLength(1)
    expect(result[0].contractId).toBe('c1')
  })
})
