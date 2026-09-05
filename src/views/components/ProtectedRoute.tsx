import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '@/viewmodels/auth.context'

export function ProtectedRoute() {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) return <span data-testid="loading-spinner" className="loading loading-spinner" />
  if (!user) return <Navigate to="/login" replace />

  // Employee is on a temporary password (set at creation or after a reset) —
  // force the change before letting them use the rest of the app.
  if (user.mustChangePassword && location.pathname !== '/change-password') {
    return <Navigate to="/change-password" replace />
  }

  return <Outlet />
}
