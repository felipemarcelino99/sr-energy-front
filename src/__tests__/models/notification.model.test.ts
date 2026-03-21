import { countUnread } from '@/models/notification.model'
import type { Notification } from '@/models/notification.model'

const makeN = (overrides: Partial<Notification> = {}): Notification => ({
  id: '1',
  title: 'Novo trabalho',
  message: 'Você foi atribuído a um trabalho.',
  read: false,
  createdAt: '2025-06-01',
  userId: 'u1',
  ...overrides,
})

describe('notification.model — countUnread', () => {
  it('retorna contagem correta de não-lidas', () => {
    const notifications = [
      makeN({ id: '1', read: false }),
      makeN({ id: '2', read: true }),
      makeN({ id: '3', read: false }),
    ]
    expect(countUnread(notifications)).toBe(2)
  })

  it('retorna 0 quando todas estão lidas', () => {
    const notifications = [
      makeN({ id: '1', read: true }),
      makeN({ id: '2', read: true }),
    ]
    expect(countUnread(notifications)).toBe(0)
  })

  it('retorna 0 para lista vazia', () => {
    expect(countUnread([])).toBe(0)
  })
})
