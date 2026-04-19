import { useChecklistStore } from '@/viewmodels/checklist.viewmodel'
import type { JobChecklistItem } from '@/models/tool.model'

jest.mock('@/services/checklist.service')

import * as checklistService from '@/services/checklist.service'

const mockTool = {
  id: 'tool-1',
  name: 'Chave de Fenda',
  status: 'active' as const,
  quantity: 10,
  createdAt: '2024-01-01',
  updatedAt: '2024-01-01',
}

const makeItem = (id: string, checked: boolean, phase: 'pre_work' | 'pre_report' = 'pre_work'): JobChecklistItem => ({
  id,
  jobId: 'job-1',
  employeeId: 'emp-1',
  toolId: 'tool-1',
  checked,
  phase,
  createdAt: '2024-01-01',
  tool: mockTool,
})

beforeEach(() => {
  useChecklistStore.setState({
    items: [],
    loading: false,
    error: null,
  })
  jest.clearAllMocks()
})

describe('checklist.viewmodel — fetchChecklist', () => {
  it('sets loading, fetches items and updates store', async () => {
    const items = [makeItem('item-1', false)]
    ;(checklistService.fetchChecklist as jest.Mock).mockResolvedValue(items)
    await useChecklistStore.getState().fetchChecklist('job-1')
    expect(checklistService.fetchChecklist).toHaveBeenCalledWith('job-1', undefined)
    expect(useChecklistStore.getState().items).toHaveLength(1)
    expect(useChecklistStore.getState().loading).toBe(false)
  })

  it('passes phase filter to service', async () => {
    ;(checklistService.fetchChecklist as jest.Mock).mockResolvedValue([])
    await useChecklistStore.getState().fetchChecklist('job-1', 'pre_report')
    expect(checklistService.fetchChecklist).toHaveBeenCalledWith('job-1', 'pre_report')
  })

  it('sets error on failure', async () => {
    ;(checklistService.fetchChecklist as jest.Mock).mockRejectedValue(new Error('Fetch failed'))
    await useChecklistStore.getState().fetchChecklist('job-1')
    expect(useChecklistStore.getState().error).toBe('Fetch failed')
    expect(useChecklistStore.getState().loading).toBe(false)
  })
})

describe('checklist.viewmodel — toggleItem', () => {
  it('calls service and updates item checked state in store', async () => {
    const item = makeItem('item-1', false)
    const updated = { ...item, checked: true, checkedAt: '2024-01-02T10:00:00Z' }
    useChecklistStore.setState({ items: [item] })
    ;(checklistService.updateChecklistItem as jest.Mock).mockResolvedValue(updated)
    await useChecklistStore.getState().toggleItem('job-1', 'item-1', true)
    expect(checklistService.updateChecklistItem).toHaveBeenCalledWith('job-1', 'item-1', true)
    const stored = useChecklistStore.getState().items.find((i) => i.id === 'item-1')
    expect(stored?.checked).toBe(true)
  })
})

describe('checklist.viewmodel — duplicateForReport', () => {
  it('calls service and replaces items in store', async () => {
    const reportItems = [makeItem('item-2', false, 'pre_report')]
    ;(checklistService.duplicateChecklistForReport as jest.Mock).mockResolvedValue(reportItems)
    await useChecklistStore.getState().duplicateForReport('job-1')
    expect(checklistService.duplicateChecklistForReport).toHaveBeenCalledWith('job-1')
    expect(useChecklistStore.getState().items).toEqual(reportItems)
  })
})

describe('checklist.viewmodel — allChecked computed', () => {
  it('returns true when all items are checked', () => {
    useChecklistStore.setState({
      items: [makeItem('item-1', true), makeItem('item-2', true)],
    })
    expect(useChecklistStore.getState().allChecked).toBe(true)
  })

  it('returns false when some items are unchecked', () => {
    useChecklistStore.setState({
      items: [makeItem('item-1', true), makeItem('item-2', false)],
    })
    expect(useChecklistStore.getState().allChecked).toBe(false)
  })

  it('returns false when there are no items', () => {
    useChecklistStore.setState({ items: [] })
    expect(useChecklistStore.getState().allChecked).toBe(false)
  })
})

describe('checklist.viewmodel — checkedCount computed', () => {
  it('counts only checked items', () => {
    useChecklistStore.setState({
      items: [makeItem('item-1', true), makeItem('item-2', false), makeItem('item-3', true)],
    })
    expect(useChecklistStore.getState().checkedCount).toBe(2)
  })

  it('returns 0 when no items are checked', () => {
    useChecklistStore.setState({
      items: [makeItem('item-1', false)],
    })
    expect(useChecklistStore.getState().checkedCount).toBe(0)
  })
})
