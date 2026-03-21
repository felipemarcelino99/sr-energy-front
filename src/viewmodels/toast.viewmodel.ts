import { create } from 'zustand'

export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface Toast {
  id: string
  message: string
  type: ToastType
}

interface ToastState {
  toasts: Toast[]
  add: (toast: Omit<Toast, 'id'>) => void
  remove: (id: string) => void
}

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  add: (toast) => {
    const id = crypto.randomUUID()
    set((s) => ({ toasts: [...s.toasts, { ...toast, id }] }))
  },
  remove: (id) => {
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }))
  },
}))

/** Convenience helper – use outside React (e.g., in services/viewmodels) */
export const toast = {
  success: (message: string) => useToastStore.getState().add({ message, type: 'success' }),
  error: (message: string) => useToastStore.getState().add({ message, type: 'error' }),
  warning: (message: string) => useToastStore.getState().add({ message, type: 'warning' }),
  info: (message: string) => useToastStore.getState().add({ message, type: 'info' }),
}
