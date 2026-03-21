import type { Role } from './auth.model'

export interface NavItem {
  label: string
  path: string
  icon: string
  allowedRoles: Role[]
}

export const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', path: '/', icon: 'home', allowedRoles: ['admin', 'manager'] },
  { label: 'Dashboard', path: '/dashboard', icon: 'home', allowedRoles: ['employee'] },
  { label: 'Trabalhos', path: '/jobs', icon: 'briefcase', allowedRoles: ['admin', 'manager'] },
  { label: 'Máquinas', path: '/machines', icon: 'cpu', allowedRoles: ['admin', 'manager'] },
  { label: 'Contratos', path: '/contracts', icon: 'file-text', allowedRoles: ['admin', 'manager'] },
  { label: 'Funcionários', path: '/employees', icon: 'users', allowedRoles: ['admin', 'manager'] },
  { label: 'Financeiro', path: '/financial', icon: 'dollar-sign', allowedRoles: ['admin', 'manager'] },
  { label: 'Meus Trabalhos', path: '/my-jobs', icon: 'clipboard', allowedRoles: ['employee'] },
  { label: 'Chat IA', path: '/chat', icon: 'message-circle', allowedRoles: ['employee'] },
]

export function filterNavByRole(items: NavItem[], role: Role): NavItem[] {
  return items.filter((item) => item.allowedRoles.includes(role))
}
