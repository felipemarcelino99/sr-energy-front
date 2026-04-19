import { NavLink } from 'react-router-dom'
import {
  Home, Briefcase, Cpu, FileText, Users, DollarSign, Clipboard, MessageCircle, Zap, Wrench, Lock,
} from 'lucide-react'
import { filterNavByRole, NAV_ITEMS } from '@/models/navigation.model'
import type { Role } from '@/models/auth.model'

const ICON_MAP: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  home: Home,
  briefcase: Briefcase,
  cpu: Cpu,
  'file-text': FileText,
  users: Users,
  'dollar-sign': DollarSign,
  clipboard: Clipboard,
  'message-circle': MessageCircle,
  'wrench': Wrench,
  'lock': Lock,
}

interface SidebarProps {
  role: Role
  onClose?: () => void
}

export function Sidebar({ role, onClose }: SidebarProps) {
  const items = filterNavByRole(NAV_ITEMS, role)

  return (
    <aside className="w-64 min-h-screen bg-base-200 border-r border-base-300 flex flex-col">
      {/* Brand */}
      <div className="px-5 py-4 border-b border-base-300 flex items-center gap-2.5">
        <div className="w-7 h-7 rounded bg-primary flex items-center justify-center shrink-0">
          <Zap size={14} className="text-primary-content" />
        </div>
        <span className="text-base font-bold tracking-tight">SR Energy</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 flex flex-col gap-0.5">
        {items.map((item) => {
          const Icon = ICON_MAP[item.icon]
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors relative border ${
                  isActive
                    ? 'bg-primary/10 text-primary border-primary/20'
                    : 'text-base-content/50 border-transparent hover:bg-base-300 hover:text-base-content'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <span className="absolute left-0 inset-y-2 w-0.5 bg-primary rounded-full" />
                  )}
                  {Icon && <Icon size={15} />}
                  {item.label}
                </>
              )}
            </NavLink>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-base-300">
        <p className="text-xs text-base-content/25 tracking-wider uppercase">v1.0.0</p>
      </div>
    </aside>
  )
}
