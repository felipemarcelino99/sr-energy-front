import api from '@/services/api'
import {
  fetchProposals,
  fetchProposal,
  createProposal,
  updateProposal,
  acceptProposal,
  rejectProposal,
} from '../../services/proposal.service'
import type { ProposalFormData } from '@/models/proposal.model'

jest.mock('@/services/api')
const mockApi = api as jest.Mocked<typeof api>

describe('proposal.service — fetchProposals', () => {
  it('chama GET /proposals sem params quando nenhum filtro é informado', async () => {
    mockApi.get.mockResolvedValue({ data: [] })
    await fetchProposals()
    expect(mockApi.get).toHaveBeenCalledWith('/proposals', { params: undefined })
  })

  it('chama GET /proposals com ?contractId= quando o filtro é informado (aba "Propostas" do Contrato)', async () => {
    mockApi.get.mockResolvedValue({ data: [] })
    await fetchProposals({ contractId: 'ct1' })
    expect(mockApi.get).toHaveBeenCalledWith('/proposals', { params: { contractId: 'ct1' } })
  })
})

describe('proposal.service — fetchProposal', () => {
  it('chama GET /proposals/:id', async () => {
    mockApi.get.mockResolvedValue({ data: { id: 'p1' } })
    await fetchProposal('p1')
    expect(mockApi.get).toHaveBeenCalledWith('/proposals/p1')
  })
})

describe('proposal.service — createProposal', () => {
  it('chama POST /proposals com os dados', async () => {
    const formData = {
      clientId: 'cl1',
      description: 'PC',
      contractType: 'service',
      contractValue: 100,
    } as ProposalFormData
    mockApi.post.mockResolvedValue({ data: { id: 'p1', ...formData } })
    await createProposal(formData)
    expect(mockApi.post).toHaveBeenCalledWith('/proposals', formData)
  })
})

describe('proposal.service — updateProposal', () => {
  it('chama PUT /proposals/:id com os dados parciais', async () => {
    mockApi.put.mockResolvedValue({ data: { id: 'p1' } })
    await updateProposal('p1', { description: 'Nova descrição' })
    expect(mockApi.put).toHaveBeenCalledWith('/proposals/p1', { description: 'Nova descrição' })
  })
})

describe('proposal.service — acceptProposal', () => {
  it('chama PATCH /proposals/:id/accept e retorna {proposal, job} (sem contract)', async () => {
    const response = { proposal: { id: 'p1', status: 'accepted' }, job: { id: 'j1' } }
    mockApi.patch.mockResolvedValue({ data: response })
    const result = await acceptProposal('p1')
    expect(mockApi.patch).toHaveBeenCalledWith('/proposals/p1/accept')
    expect(result).toEqual(response)
    expect(result).not.toHaveProperty('contract')
  })
})

describe('proposal.service — rejectProposal', () => {
  it('chama PATCH /proposals/:id/reject', async () => {
    mockApi.patch.mockResolvedValue({ data: { id: 'p1', status: 'rejected' } })
    await rejectProposal('p1')
    expect(mockApi.patch).toHaveBeenCalledWith('/proposals/p1/reject')
  })
})
