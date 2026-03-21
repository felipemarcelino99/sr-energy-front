export interface Notification {
  id: string
  userId: string
  title: string
  message: string
  read: boolean
  createdAt: string
}

export function countUnread(notifications: Notification[]): number {
  return notifications.filter((n) => !n.read).length
}
