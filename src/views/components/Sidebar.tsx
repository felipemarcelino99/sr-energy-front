import { NavLink } from 'react-router-dom'
import {
  Home,
  Briefcase,
  Cpu,
  FileText,
  Users,
  DollarSign,
  Clipboard,
  MessageCircle,
  Wrench,
  Lock,
  ChevronLeft,
  ChevronRight,
  Building2,
  Package,
  CalendarDays,
} from 'lucide-react'
import { filterNavByRole, groupNavItems, NAV_ITEMS } from '@/models/navigation.model'
import type { Role } from '@/models/auth.model'
import logoWhite from '@/assets/sr-energy-logo-white.png'

const ICON_MAP: Record<string, React.ComponentType<{ size?: number; color?: string }>> = {
  home: Home,
  briefcase: Briefcase,
  cpu: Cpu,
  'file-text': FileText,
  users: Users,
  'dollar-sign': DollarSign,
  clipboard: Clipboard,
  'message-circle': MessageCircle,
  wrench: Wrench,
  lock: Lock,
  'building-2': Building2,
  package: Package,
  'calendar-days': CalendarDays,
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
}

const ROLE_LABEL: Record<string, string> = {
  admin: 'Administrador',
  manager: 'Gerente',
  employee: 'Funcionário',
}

interface SidebarProps {
  role: Role
  userName: string
  collapsed: boolean
  onToggleCollapse: () => void
  onClose?: () => void
}

export function Sidebar({ role, userName, collapsed, onToggleCollapse, onClose }: SidebarProps) {
  const items = filterNavByRole(NAV_ITEMS, role)
  const groups = groupNavItems(items)

  return (
    <aside
      style={{
        width: collapsed ? 64 : 240,
        flexShrink: 0,
        background: 'var(--sidebar-bg)',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        borderRight: '1px solid rgba(255,255,255,.08)',
        transition: 'width 200ms ease',
        overflow: 'hidden',
      }}
    >
      {/* Brand */}
      <div
        style={{
          padding: collapsed ? '16px 0 14px' : '16px 18px 14px',
          borderBottom: '1px solid rgba(255,255,255,.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'flex-start',
          gap: 10,
          flexShrink: 0,
        }}
      >
        <img
          src={logoWhite}
          alt="SR Energy"
          style={{
            width: collapsed ? 50 : '100%',
            display: 'block',
          }}
        />
      </div>

      {/* Nav groups */}
      <div style={{ flex: 1, padding: '8px 0', overflowY: 'auto', overflowX: 'hidden' }}>
        {groups.map((group) => (
          <div key={group.label}>
            {!collapsed && (
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: '.08em',
                  textTransform: 'uppercase',
                  color: 'rgba(255,255,255,.3)',
                  padding: '10px 18px 4px',
                  whiteSpace: 'nowrap',
                }}
              >
                {group.label}
              </div>
            )}
            {collapsed && <div style={{ height: 8 }} />}

            {group.items.map((item) => {
              const Icon = ICON_MAP[item.icon]
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === '/' || item.path === '/dashboard'}
                  onClick={onClose}
                  title={collapsed ? item.label : undefined}
                  style={({ isActive }) => ({
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: collapsed ? 'center' : 'flex-start',
                    gap: 10,
                    padding: collapsed ? '10px 0' : '9px 18px',
                    fontSize: 13,
                    fontWeight: isActive ? 600 : 500,
                    color: isActive ? '#fff' : 'rgba(255,255,255,.6)',
                    cursor: 'pointer',
                    background: isActive ? 'var(--sidebar-active-bg)' : 'transparent',
                    transition: 'all 150ms',
                    position: 'relative',
                    textDecoration: 'none',
                  })}
                >
                  {({ isActive }) => (
                    <>
                      {isActive && (
                        <div
                          style={{
                            position: 'absolute',
                            left: 0,
                            top: 4,
                            bottom: 4,
                            width: 3,
                            background: 'linear-gradient(180deg, #1F93E7, #38B2F8)',
                            borderRadius: '0 3px 3px 0',
                            boxShadow: '0 0 6px rgba(31,147,231,.5)',
                          }}
                        />
                      )}
                      {Icon && (
                        <span style={{ display: 'flex', flexShrink: 0 }}>
                          <Icon size={16} />
                        </span>
                      )}
                      {!collapsed && (
                        <span style={{ flex: 1, whiteSpace: 'nowrap' }}>{item.label}</span>
                      )}
                    </>
                  )}
                </NavLink>
              )
            })}
          </div>
        ))}
      </div>

      {/* Footer — user info */}
      <div
        style={{
          padding: collapsed ? '12px 0' : '12px 18px',
          borderTop: '1px solid rgba(255,255,255,.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'flex-start',
          gap: 10,
          flexShrink: 0,
        }}
      >
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            background: '#1B6BB5',
            color: '#fff',
            fontSize: 12,
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '2px solid rgba(255,255,255,.2)',
            flexShrink: 0,
          }}
          title={collapsed ? userName : undefined}
        >
          {getInitials(userName)}
        </div>
        {!collapsed && (
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: '#fff',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {userName}
            </div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,.45)' }}>{ROLE_LABEL[role]}</div>
          </div>
        )}
      </div>

      {/* Collapse toggle (desktop only) */}
      <button
        onClick={onToggleCollapse}
        className="lg:flex! hidden"
        style={{
          background: 'rgba(255,255,255,.07)',
          border: 'none',
          borderTop: '1px solid rgba(255,255,255,.08)',
          color: 'rgba(255,255,255,.5)',
          cursor: 'pointer',
          padding: '8px 0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          transition: 'background 150ms',
        }}
        onMouseEnter={(e) => {
          ;(e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,.12)'
        }}
        onMouseLeave={(e) => {
          ;(e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,.07)'
        }}
        aria-label={collapsed ? 'Expandir menu' : 'Recolher menu'}
      >
        {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>
    </aside>
  )
}
