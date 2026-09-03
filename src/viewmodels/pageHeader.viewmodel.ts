import { create } from 'zustand'

interface PageHeader {
  title: string
  subtitle?: string
  onBack?: () => void
}

interface PageHeaderState extends PageHeader {
  setPageHeader: (header: PageHeader) => void
  resetPageHeader: () => void
}

const DEFAULT_HEADER: PageHeader = { title: '', subtitle: undefined, onBack: undefined }

export const usePageHeaderStore = create<PageHeaderState>((set) => ({
  ...DEFAULT_HEADER,
  setPageHeader: (header) => set(header),
  resetPageHeader: () => set(DEFAULT_HEADER),
}))
