import { useMachineStore } from '@/viewmodels/machine.viewmodel'
import type { Machine } from '@/models/machine.model'

jest.mock('@/services/machine.service', () => ({
  fetchMachines: jest.fn(),
  createMachine: jest.fn(),
  updateMachine: jest.fn(),
  removeMachine: jest.fn(),
  uploadMachineManual: jest.fn(),
}))

import * as machineService from '@/services/machine.service'

const mockMachine: Machine = {
  id: '1',
  name: 'Torno CNC',
  brand: 'Romi',
  model: 'D800',
  serialNumber: 'SN-001',
  year: 2020,
  createdAt: '2024-01-01',
  updatedAt: '2024-01-01',
}

const formData = {
  name: 'Torno CNC',
  brand: 'Romi',
  model: 'D800',
  serialNumber: 'SN-001',
  year: 2020,
}

beforeEach(() => {
  useMachineStore.setState({ machines: [], loading: false, error: null, search: '' })
  jest.clearAllMocks()
})

describe('machine.viewmodel — create', () => {
  it('chama o service e adiciona ao store', async () => {
    ;(machineService.createMachine as jest.Mock).mockResolvedValue(mockMachine)
    await useMachineStore.getState().create(formData)
    expect(machineService.createMachine).toHaveBeenCalledWith(formData)
    expect(useMachineStore.getState().machines).toHaveLength(1)
  })
})

describe('machine.viewmodel — update', () => {
  it('chama o service e atualiza o store', async () => {
    const updated = { ...mockMachine, name: 'Fresadora' }
    useMachineStore.setState({ machines: [mockMachine] })
    ;(machineService.updateMachine as jest.Mock).mockResolvedValue(updated)
    await useMachineStore.getState().update('1', { ...formData, name: 'Fresadora' })
    expect(machineService.updateMachine).toHaveBeenCalled()
    const m = useMachineStore.getState().machines.find((m) => m.id === '1')
    expect(m?.name).toBe('Fresadora')
  })
})

describe('machine.viewmodel — remove', () => {
  it('chama o service e remove do store', async () => {
    useMachineStore.setState({ machines: [mockMachine] })
    ;(machineService.removeMachine as jest.Mock).mockResolvedValue(undefined)
    await useMachineStore.getState().remove('1')
    expect(machineService.removeMachine).toHaveBeenCalledWith('1')
    expect(useMachineStore.getState().machines).toHaveLength(0)
  })
})

describe('machine.viewmodel — upload manual', () => {
  it('chama o service de upload e salva a URL no store', async () => {
    const url = 'https://storage.example.com/manual.pdf'
    useMachineStore.setState({ machines: [mockMachine] })
    ;(machineService.uploadMachineManual as jest.Mock).mockResolvedValue(url)
    ;(machineService.updateMachine as jest.Mock).mockResolvedValue({ ...mockMachine, manualUrl: url })
    await useMachineStore.getState().uploadManual('1', new File([''], 'manual.pdf'))
    expect(machineService.uploadMachineManual).toHaveBeenCalled()
    const m = useMachineStore.getState().machines.find((m) => m.id === '1')
    expect(m?.manualUrl).toBe(url)
  })
})
