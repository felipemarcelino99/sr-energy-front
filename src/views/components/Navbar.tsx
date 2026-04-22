import { LogOut, Menu, Sun, Moon } from 'lucide-react'
import type { AuthUser } from '@/models/auth.model'
import { NotificationDropdown } from '@/views/components/NotificationDropdown'
import { useTheme } from '@/hooks/useTheme'
import logoColor from '@/assets/sr-energy-logo-color.png'
import logoWhite from '@/assets/sr-energy-logo-white.png'

interface NavbarProps {
  user: AuthUser
  onLogout: () => void
  onMenuClick: () => void
}

export function Navbar({ onLogout, onMenuClick }: NavbarProps) {
  const { theme, toggle: toggleTheme } = useTheme()
  const isLight = theme === 'light'

  const btnStyle: React.CSSProperties = {
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
    flexShrink: 0,
  }

  return (
    <header
      style={{
        background: 'var(--navbar-bg)',
        borderBottom: '1px solid var(--navbar-border)',
        boxShadow: 'var(--navbar-shadow)',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        zIndex: 10,
      }}
    >
      {/* Brand accent line */}
      <div style={{ height: 3, background: 'var(--navbar-accent)', flexShrink: 0 }} />

      {/* Inner content row */}
      <div style={{ height: 53, display: 'flex', alignItems: 'center', padding: '0 20px', gap: 8 }}>
        {/* Mobile drawer toggle */}
        <button
          style={btnStyle}
          className="lg:hidden!"
          onClick={onMenuClick}
          aria-label="Abrir menu"
        >
          <Menu size={18} />
        </button>

        {/* Logo (mobile only) */}
        <img
          src={isLight ? logoColor : logoWhite}
          alt="SR Energy"
          style={{ height: 24, objectFit: 'contain' }}
          className="lg:hidden!"
        />

        <div style={{ flex: 1 }} />

        {/* Theme toggle */}
        <button
          style={btnStyle}
          onClick={toggleTheme}
          aria-label="Alternar tema"
          title={isLight ? 'Modo escuro' : 'Modo claro'}
        >
          {isLight ? <Moon size={16} /> : <Sun size={16} />}
        </button>

        {/* Notifications */}
        <NotificationDropdown />

        {/* Logout */}
        <button style={btnStyle} onClick={onLogout} aria-label="Sair">
          <LogOut size={15} />
        </button>
      </div>
    </header>
  )
}
