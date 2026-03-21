import { LogOut } from 'lucide-react'
import type { AuthUser } from '@/models/auth.model'
import { NotificationDropdown } from '@/views/components/NotificationDropdown'

const ROLE_LABEL: Record<string, string> = {
  admin: 'Admin',
  manager: 'Manager',
  employee: 'Funcionário',
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

interface NavbarProps {
  user: AuthUser
  onLogout: () => void
}

export function Navbar({ user, onLogout }: NavbarProps) {
  return (
    <header className="h-14 border-b border-base-300 bg-base-200 flex items-center px-6 gap-4">
      <div className="flex-1" />

      <NotificationDropdown />

      <div className="w-px h-5 bg-base-300" />

      <div className="flex items-center gap-3">
        {/* Avatar */}
        <div className="w-8 h-8 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center shrink-0">
          <span className="text-xs font-bold text-primary">{getInitials(user.name)}</span>
        </div>

        <div className="text-right leading-tight">
          <p className="text-sm font-medium text-base-content">{user.name}</p>
          <p className="text-xs text-base-content/40">{ROLE_LABEL[user.role]}</p>
        </div>

        <button
          onClick={onLogout}
          aria-label="Sair"
          className="btn btn-ghost btn-sm btn-circle ml-1"
        >
          <LogOut size={15} className="text-base-content/40" />
        </button>
      </div>
    </header>
  )
}
