import { useNotificationStore } from '@/viewmodels/notification.viewmodel'
import type { Notification } from '@/models/notification.model'

jest.mock('@/services/notification.service', () => ({
  fetchNotifications: jest.fn(),
  markAsRead: jest.fn(),
  markAllAsRead: jest.fn(),
}))

import * as notifService from '@/services/notification.service'

const makeN = (overrides: Partial<Notification> = {}): Notification => ({
  id: '1',
  title: 'Novo trabalho',
  message: 'Você foi atribuído.',
  read: false,
  createdAt: '2025-06-01',
  userId: 'u1',
  ...overrides,
})

beforeEach(() => {
  useNotificationStore.setState({ notifications: [], loading: false, error: null })
  jest.clearAllMocks()
})

describe('notification.viewmodel — markAsRead', () => {
  it('atualiza a notificação para lida no store', async () => {
    useNotificationStore.setState({ notifications: [makeN({ id: '1' })] })
    ;(notifService.markAsRead as jest.Mock).mockResolvedValue(undefined)
    await useNotificationStore.getState().markAsRead('1')
    expect(notifService.markAsRead).toHaveBeenCalledWith('1')
    expect(useNotificationStore.getState().notifications[0].read).toBe(true)
  })
})

describe('notification.viewmodel — markAllAsRead', () => {
  it('marca todas como lidas no store', async () => {
    useNotificationStore.setState({
      notifications: [makeN({ id: '1' }), makeN({ id: '2' })],
    })
    ;(notifService.markAllAsRead as jest.Mock).mockResolvedValue(undefined)
    await useNotificationStore.getState().markAllAsRead()
    expect(notifService.markAllAsRead).toHaveBeenCalled()
    const all = useNotificationStore.getState().notifications
    expect(all.every((n) => n.read)).toBe(true)
  })
})

describe('notification.viewmodel — addNotification (realtime)', () => {
  it('adiciona nova notificação ao store', () => {
    const n = makeN({ id: '99', title: 'Realtime' })
    useNotificationStore.getState().addNotification(n)
    expect(useNotificationStore.getState().notifications).toHaveLength(1)
    expect(useNotificationStore.getState().notifications[0].title).toBe('Realtime')
  })
})
