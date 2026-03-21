import { useContractStore } from '@/viewmodels/contract.viewmodel'
import type { Contract } from '@/models/contract.model'

jest.mock('@/services/contract.service', () => ({
  fetchContracts: jest.fn(),
  createContract: jest.fn(),
  updateContract: jest.fn(),
  removeContract: jest.fn(),
}))

import * as contractService from '@/services/contract.service'

const mockContract: Contract = {
  id: '1',
  clientName: 'Empresa ABC',
  clientCnpj: '11.222.333/0001-81',
  description: 'Manutenção anual',
  startDate: '2024-01-01',
  endDate: '2025-01-01',
  createdAt: '2024-01-01',
  updatedAt: '2024-01-01',
}

const formData = {
  clientName: 'Empresa ABC',
  clientCnpj: '11.222.333/0001-81',
  description: 'Manutenção anual',
  startDate: '2024-01-01',
  endDate: '2025-01-01',
}

beforeEach(() => {
  useContractStore.setState({ contracts: [], loading: false, error: null })
  jest.clearAllMocks()
})

describe('contract.viewmodel — create', () => {
  it('chama o service e adiciona ao store', async () => {
    ;(contractService.createContract as jest.Mock).mockResolvedValue(mockContract)
    await useContractStore.getState().create(formData)
    expect(contractService.createContract).toHaveBeenCalledWith(formData)
    expect(useContractStore.getState().contracts).toHaveLength(1)
  })
})

describe('contract.viewmodel — update', () => {
  it('chama o service e atualiza o store', async () => {
    const updated = { ...mockContract, clientName: 'Empresa XYZ' }
    useContractStore.setState({ contracts: [mockContract] })
    ;(contractService.updateContract as jest.Mock).mockResolvedValue(updated)
    await useContractStore.getState().update('1', { ...formData, clientName: 'Empresa XYZ' })
    expect(contractService.updateContract).toHaveBeenCalled()
    const c = useContractStore.getState().contracts.find((c) => c.id === '1')
    expect(c?.clientName).toBe('Empresa XYZ')
  })
})

describe('contract.viewmodel — remove', () => {
  it('chama o service e remove do store', async () => {
    useContractStore.setState({ contracts: [mockContract] })
    ;(contractService.removeContract as jest.Mock).mockResolvedValue(undefined)
    await useContractStore.getState().remove('1')
    expect(contractService.removeContract).toHaveBeenCalledWith('1')
    expect(useContractStore.getState().contracts).toHaveLength(0)
  })
})
