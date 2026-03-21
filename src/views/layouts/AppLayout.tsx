import { Outlet } from 'react-router-dom'
import { useAuth } from '@/viewmodels/auth.context'
import { Sidebar } from '@/views/components/Sidebar'
import { Navbar } from '@/views/components/Navbar'
import { ErrorBoundary } from '@/views/components/ErrorBoundary'
import { ToastContainer } from '@/views/components/ToastContainer'

export function AppLayout() {
  const { user, logout } = useAuth()

  if (!user) return null

  return (
    <div className="flex min-h-screen bg-base-100">
      <Sidebar role={user.role} />
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar user={user} onLogout={logout} />
        <main className="flex-1 p-6 overflow-auto">
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </main>
      </div>
      <ToastContainer />
    </div>
  )
}
