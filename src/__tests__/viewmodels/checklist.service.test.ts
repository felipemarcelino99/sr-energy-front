import api from '@/services/api'
import {
  fetchChecklist,
  updateChecklistItem,
  duplicateChecklistForReport,
} from '../../services/checklist.service'

jest.mock('@/services/api')
const mockApi = api as jest.Mocked<typeof api>

describe('checklist.service — fetchChecklist', () => {
  it('chama GET /jobs/:id/checklist sem phase quando omitido', async () => {
    mockApi.get.mockResolvedValue({ data: [] })
    await fetchChecklist('job-1')
    expect(mockApi.get).toHaveBeenCalledWith('/jobs/job-1/checklist', { params: {} })
  })

  it('chama GET /jobs/:id/checklist?phase=pre_work quando passado', async () => {
    mockApi.get.mockResolvedValue({ data: [] })
    await fetchChecklist('job-1', 'pre_work')
    expect(mockApi.get).toHaveBeenCalledWith('/jobs/job-1/checklist', { params: { phase: 'pre_work' } })
  })

  it('chama GET /jobs/:id/checklist?phase=pre_report quando passado', async () => {
    mockApi.get.mockResolvedValue({ data: [] })
    await fetchChecklist('job-1', 'pre_report')
    expect(mockApi.get).toHaveBeenCalledWith('/jobs/job-1/checklist', { params: { phase: 'pre_report' } })
  })

  it('retorna array de itens', async () => {
    const items = [{ id: 'item-1', checked: false }]
    mockApi.get.mockResolvedValue({ data: items })
    const result = await fetchChecklist('job-1')
    expect(result).toEqual(items)
  })
})

describe('checklist.service — updateChecklistItem', () => {
  it('chama PATCH /jobs/:id/checklist/:itemId com checked', async () => {
    mockApi.patch.mockResolvedValue({ data: { id: 'item-1', checked: true } })
    await updateChecklistItem('job-1', 'item-1', true)
    expect(mockApi.patch).toHaveBeenCalledWith('/jobs/job-1/checklist/item-1', { checked: true })
  })

  it('retorna o item atualizado', async () => {
    const updated = { id: 'item-1', checked: true }
    mockApi.patch.mockResolvedValue({ data: updated })
    const result = await updateChecklistItem('job-1', 'item-1', true)
    expect(result).toEqual(updated)
  })
})

describe('checklist.service — duplicateChecklistForReport', () => {
  it('chama POST /jobs/:id/checklist/duplicate', async () => {
    mockApi.post.mockResolvedValue({ data: [] })
    await duplicateChecklistForReport('job-1')
    expect(mockApi.post).toHaveBeenCalledWith('/jobs/job-1/checklist/duplicate')
  })

  it('retorna array de itens duplicados', async () => {
    const items = [{ id: 'item-2', checked: false, phase: 'pre_report' }]
    mockApi.post.mockResolvedValue({ data: items })
    const result = await duplicateChecklistForReport('job-1')
    expect(result).toEqual(items)
  })
})
