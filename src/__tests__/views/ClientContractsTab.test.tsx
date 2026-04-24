import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { ClientContractsTab } from '@/views/components/ClientContractsTab'

jest.mock('@/services/contract.service', () => ({
  fetchContractsByClient: jest.fn(),
}))

import * as contractService from '@/services/contract.service'

const mockContract = {
  id: 'c1',
  clientId: '1',
  description: 'Contrato de Manutenção',
  startDate: '2024-01-01',
  endDate: '2025-12-31',
  contractType: 'service',
  contractValue: 5000,
  recurring: false,
  createdAt: '2024-01-01',
  updatedAt: '2024-01-01',
}

describe('ClientContractsTab', () => {
  it('exibe spinner enquanto carrega', () => {
    ;(contractService.fetchContractsByClient as jest.Mock).mockReturnValue(new Promise(() => {}))
    render(<MemoryRouter><ClientContractsTab clientId="1" /></MemoryRouter>)
    expect(document.querySelector('.loading')).toBeInTheDocument()
  })

  it('exibe contratos após carregar', async () => {
    ;(contractService.fetchContractsByClient as jest.Mock).mockResolvedValue([mockContract])
    render(<MemoryRouter><ClientContractsTab clientId="1" /></MemoryRouter>)
    await waitFor(() => {
      expect(screen.getByText('Contrato de Manutenção')).toBeInTheDocument()
    })
  })

  it('exibe mensagem quando não há contratos', async () => {
    ;(contractService.fetchContractsByClient as jest.Mock).mockResolvedValue([])
    render(<MemoryRouter><ClientContractsTab clientId="1" /></MemoryRouter>)
    await waitFor(() => {
      expect(screen.getByText(/nenhum contrato/i)).toBeInTheDocument()
    })
  })
})
