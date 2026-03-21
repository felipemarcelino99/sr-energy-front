import { create } from 'zustand'
import type { Notification } from '@/models/notification.model'
import {
  fetchNotifications,
  markAsRead as markAsReadService,
  markAllAsRead as markAllAsReadService,
} from '@/services/notification.service'

interface NotificationState {
  notifications: Notification[]
  loading: boolean
  error: string | null

  load: () => Promise<void>
  markAsRead: (id: string) => Promise<void>
  markAllAsRead: () => Promise<void>
  addNotification: (notification: Notification) => void
}

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [],
  loading: false,
  error: null,

  load: async () => {
    set({ loading: true, error: null })
    try {
      const notifications = await fetchNotifications()
      set({ notifications, loading: false })
    } catch (err) {
      set({ error: (err as Error).message, loading: false })
    }
  },

  markAsRead: async (id) => {
    await markAsReadService(id)
    set((s) => ({
      notifications: s.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
    }))
  },

  markAllAsRead: async () => {
    await markAllAsReadService()
    set((s) => ({
      notifications: s.notifications.map((n) => ({ ...n, read: true })),
    }))
  },

  addNotification: (notification) => {
    set((s) => ({ notifications: [notification, ...s.notifications] }))
  },
}))
