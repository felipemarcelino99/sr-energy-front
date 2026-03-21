import api from '@/services/api'
import type { Notification } from '@/models/notification.model'

export async function fetchNotifications(): Promise<Notification[]> {
  const { data } = await api.get<Notification[]>('/notifications')
  return data
}

export async function markAsRead(id: string): Promise<void> {
  await api.patch(`/notifications/${id}/read`)
}

export async function markAllAsRead(): Promise<void> {
  await api.patch('/notifications/read-all')
}
