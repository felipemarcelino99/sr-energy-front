import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/viewmodels/auth.context'

export function ProtectedRoute() {
  const { user, loading } = useAuth()

  if (loading) return <span data-testid="loading-spinner" className="loading loading-spinner" />
  if (!user) return <Navigate to="/login" replace />

  return <Outlet />
}
