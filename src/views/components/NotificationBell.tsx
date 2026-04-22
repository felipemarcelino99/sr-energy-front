interface Props {
  unreadCount: number
  onClick: () => void
}

export function NotificationBell({ unreadCount, onClick }: Props) {
  return (
    <div style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={onClick}
        aria-label="notificações"
        style={{
          background: 'var(--navbar-btn-bg)',
          border: 'none',
          borderRadius: 6,
          width: 34,
          height: 34,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--navbar-btn-color)',
          transition: 'background 150ms',
        }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
          <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
      </button>
      {unreadCount > 0 && (
        <span
          data-testid="unread-badge"
          style={{
            position: 'absolute',
            top: -3,
            right: -3,
            background: '#E53E3E',
            color: '#fff',
            borderRadius: 99,
            fontSize: 9,
            fontWeight: 700,
            padding: '1px 4px',
            minWidth: 14,
            textAlign: 'center',
            lineHeight: '14px',
          }}
        >
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </div>
  )
}
