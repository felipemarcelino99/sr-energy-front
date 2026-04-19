import { create } from 'zustand'
import type { JobChecklistItem } from '@/models/tool.model'
import {
  fetchChecklist as fetchChecklistService,
  updateChecklistItem,
  duplicateChecklistForReport,
} from '@/services/checklist.service'

interface ChecklistState {
  items: JobChecklistItem[]
  loading: boolean
  error: string | null
  allChecked: boolean
  checkedCount: number

  fetchChecklist: (jobId: string, phase?: 'pre_work' | 'pre_report') => Promise<void>
  toggleItem: (jobId: string, itemId: string, checked: boolean) => Promise<void>
  duplicateForReport: (jobId: string) => Promise<void>
}

function deriveFromItems(items: JobChecklistItem[]) {
  const checkedCount = items.filter((i) => i.checked).length
  const allChecked = items.length > 0 && checkedCount === items.length
  return { checkedCount, allChecked }
}

export const useChecklistStore = create<ChecklistState>((set) => ({
  items: [],
  loading: false,
  error: null,
  allChecked: false,
  checkedCount: 0,

  fetchChecklist: async (jobId, phase) => {
    set({ loading: true, error: null })
    try {
      const items = await fetchChecklistService(jobId, phase)
      set({ items, loading: false, ...deriveFromItems(items) })
    } catch (err) {
      set({ error: (err as Error).message, loading: false })
    }
  },

  toggleItem: async (jobId, itemId, checked) => {
    const updated = await updateChecklistItem(jobId, itemId, checked)
    set((s) => {
      const existing = s.items.find((i) => i.id === itemId)
      const items = s.items.map((i) =>
        i.id === itemId ? { ...updated, tool: updated.tool ?? existing?.tool } : i,
      )
      return { items, ...deriveFromItems(items) }
    })
  },

  duplicateForReport: async (jobId) => {
    const items = await duplicateChecklistForReport(jobId)
    set({ items, ...deriveFromItems(items) })
  },
}))

// Patch setState so external callers (e.g. tests) also trigger derived recompute
const originalSetState = useChecklistStore.setState.bind(useChecklistStore)
useChecklistStore.setState = (partial, replace?) => {
  originalSetState(partial, replace as never)
  const { items } = useChecklistStore.getState()
  const derived = deriveFromItems(items)
  const state = useChecklistStore.getState()
  if (state.allChecked !== derived.allChecked || state.checkedCount !== derived.checkedCount) {
    originalSetState(derived, false as never)
  }
}
