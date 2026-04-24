import type { Role } from './auth.model'

export interface NavItem {
  label: string
  path: string
  icon: string
  allowedRoles: Role[]
  group: string
}

export const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard',     path: '/',               icon: 'home',           allowedRoles: ['admin', 'manager'],              group: 'Principal' },
  { label: 'Dashboard',     path: '/dashboard',      icon: 'home',           allowedRoles: ['employee'],                       group: 'Principal' },
  { label: 'OS',            path: '/jobs',           icon: 'briefcase',      allowedRoles: ['admin', 'manager'],              group: 'Principal' },
  { label: 'Máquinas',      path: '/machines',       icon: 'cpu',            allowedRoles: ['admin', 'manager'],              group: 'Principal' },
  { label: 'Ferramentas',   path: '/tools',          icon: 'wrench',         allowedRoles: ['admin', 'manager'],              group: 'Principal' },
  { label: 'Malas',         path: '/bags',           icon: 'briefcase',      allowedRoles: ['admin', 'manager'],              group: 'Operações' },
  { label: 'Clientes',      path: '/clients',        icon: 'building-2',     allowedRoles: ['admin', 'manager'],              group: 'Operações' },
  { label: 'Contratos',     path: '/contracts',      icon: 'file-text',      allowedRoles: ['admin', 'manager'],              group: 'Operações' },
  { label: 'Funcionários',  path: '/employees',      icon: 'users',          allowedRoles: ['admin', 'manager'],              group: 'Operações' },
  { label: 'Financeiro',    path: '/financial',      icon: 'dollar-sign',    allowedRoles: ['admin', 'manager'],              group: 'Operações' },
  { label: 'Minhas OS',     path: '/my-jobs',        icon: 'clipboard',      allowedRoles: ['employee'],                       group: 'Principal' },
  { label: 'Chat IA',       path: '/chat',           icon: 'message-circle', allowedRoles: ['employee'],                       group: 'Principal' },
  { label: 'Alterar Senha', path: '/change-password', icon: 'lock',          allowedRoles: ['admin', 'manager', 'employee'],  group: 'Conta' },
]

export function filterNavByRole(items: NavItem[], role: Role): NavItem[] {
  return items.filter((item) => item.allowedRoles.includes(role))
}

export function groupNavItems(items: NavItem[]): { label: string; items: NavItem[] }[] {
  const order = ['Principal', 'Operações', 'Conta']
  const map = new Map<string, NavItem[]>()
  for (const item of items) {
    if (!map.has(item.group)) map.set(item.group, [])
    map.get(item.group)!.push(item)
  }
  return order.filter((g) => map.has(g)).map((g) => ({ label: g, items: map.get(g)! }))
}
