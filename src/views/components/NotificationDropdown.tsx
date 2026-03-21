import { useEffect, useRef } from 'react'
import { useNotificationStore } from '@/viewmodels/notification.viewmodel'
import { countUnread } from '@/models/notification.model'
import { NotificationBell } from '@/views/components/NotificationBell'

export function NotificationDropdown() {
  const { notifications, load, markAsRead, markAllAsRead } = useNotificationStore()
  const detailsRef = useRef<HTMLDetailsElement>(null)

  useEffect(() => { load() }, [load])

  const unread = countUnread(notifications)

  function handleBellClick() {
    detailsRef.current?.toggleAttribute('open')
  }

  async function handleMarkOne(id: string) {
    await markAsRead(id)
  }

  return (
    <details ref={detailsRef} className="dropdown dropdown-end">
      <summary className="list-none">
        <NotificationBell unreadCount={unread} onClick={handleBellClick} />
      </summary>

      <div className="dropdown-content z-50 bg-base-100 shadow-xl rounded-box w-80 mt-2 border border-base-300">
        <div className="flex items-center justify-between p-3 border-b border-base-300">
          <span className="font-semibold text-sm">Notificações</span>
          {unread > 0 && (
            <button
              className="btn btn-ghost btn-xs text-primary"
              onClick={markAllAsRead}
            >
              Marcar todas como lidas
            </button>
          )}
        </div>

        <ul className="max-h-80 overflow-y-auto">
          {notifications.length === 0 && (
            <li className="text-center text-base-content/40 text-sm py-8">
              Nenhuma notificação.
            </li>
          )}
          {notifications.map((n) => (
            <li
              key={n.id}
              className={`flex items-start gap-3 p-3 border-b border-base-300 last:border-0 transition-colors ${
                n.read ? 'opacity-50' : 'bg-primary/5 cursor-pointer hover:bg-primary/10'
              }`}
              onClick={() => !n.read && handleMarkOne(n.id)}
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{n.title}</p>
                <p className="text-xs text-base-content/60 mt-0.5">{n.message}</p>
                <p className="text-xs text-base-content/40 mt-1">{n.createdAt}</p>
              </div>
              {!n.read && (
                <span className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" />
              )}
            </li>
          ))}
        </ul>
      </div>
    </details>
  )
}
