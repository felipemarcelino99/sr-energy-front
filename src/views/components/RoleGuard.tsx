import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/viewmodels/auth.context'
import type { Role } from '@/models/auth.model'

interface RoleGuardProps {
  allowedRoles: Role[]
}

export function RoleGuard({ allowedRoles }: RoleGuardProps) {
  const { user, loading } = useAuth()

  if (loading) return <span data-testid="loading-spinner" className="loading loading-spinner" />
  if (!user || !allowedRoles.includes(user.role)) return <Navigate to="/unauthorized" replace />

  return <Outlet />
}
