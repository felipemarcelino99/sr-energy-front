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
  clientId: 'client-1',
  client: { id: 'client-1', razaoSocial: 'Empresa ABC', cnpj: '11.222.333/0001-81' },
  description: 'Manutenção anual',
  startDate: '2024-01-01',
  endDate: '2025-01-01',
  recurring: false,
  contractType: 'service',
  contractValue: 5000,
  createdAt: '2024-01-01',
  updatedAt: '2024-01-01',
}

const formData = {
  clientId: 'client-1',
  description: 'Manutenção anual',
  startDate: '2024-01-01',
  endDate: '2025-01-01',
  recurring: false,
  contractType: 'service' as const,
  contractValue: 5000,
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
    const updated = { ...mockContract, clientId: 'client-2' }
    useContractStore.setState({ contracts: [mockContract] })
    ;(contractService.updateContract as jest.Mock).mockResolvedValue(updated)
    await useContractStore.getState().update('1', { ...formData, clientId: 'client-2' })
    expect(contractService.updateContract).toHaveBeenCalled()
    const c = useContractStore.getState().contracts.find((c) => c.id === '1')
    expect(c?.clientId).toBe('client-2')
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

const makeContract = (id: string, razaoSocial: string, endDate: string, recurring: boolean, contractType: 'service' | 'rental', contractValue: number): Contract => ({
  ...mockContract,
  id,
  clientId: `client-${id}`,
  client: { id: `client-${id}`, razaoSocial, cnpj: '11.222.333/0001-81' },
  endDate,
  recurring,
  contractType,
  contractValue,
})

const contractsForFilter = [
  makeContract('1', 'Alfa', '2026-06-01', false, 'service', 1000),
  makeContract('2', 'Beta', '2024-01-01', true, 'rental', 2000),
  makeContract('3', 'Gama', '2099-01-01', false, 'service', 3000),
]

describe('filtered', () => {
  beforeEach(() => useContractStore.setState({
    contracts: contractsForFilter, search: '', statusFilter: undefined, typeFilter: undefined,
    sortField: 'endDate' as const, sortOrder: 'asc',
  } as Parameters<typeof useContractStore.setState>[0]))

  it('filtra por busca de cliente (razaoSocial)', () => {
    useContractStore.getState().setSearch('alfa')
    const result = useContractStore.getState().filtered()
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('1')
  })

  it('ordena por endDate asc por padrão', () => {
    const result = useContractStore.getState().filtered()
    expect(result.map((c) => c.id)).toEqual(['2', '1', '3'])
  })

  it('filtra por contractType "service"', () => {
    useContractStore.getState().setTypeFilter('service')
    const result = useContractStore.getState().filtered()
    expect(result).toHaveLength(2)
    expect(result.every((c) => c.contractType === 'service')).toBe(true)
  })

  it('filtra por contractType "rental"', () => {
    useContractStore.getState().setTypeFilter('rental')
    const result = useContractStore.getState().filtered()
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('2')
  })
})

describe('contract.viewmodel — terminate', () => {
  it('chama updateContract com endDate = hoje e atualiza o store', async () => {
    const today = new Date().toISOString().split('T')[0]
    const terminated = { ...mockContract, endDate: today }
    useContractStore.setState({ contracts: [mockContract] })
    ;(contractService.updateContract as jest.Mock).mockResolvedValue(terminated)
    await useContractStore.getState().terminate('1')
    expect(contractService.updateContract).toHaveBeenCalledWith('1', expect.objectContaining({ endDate: today }))
    expect(useContractStore.getState().contracts[0].endDate).toBe(today)
  })
})
