import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { useAuth } from '@/viewmodels/auth.context'
import { Sidebar } from '@/views/components/Sidebar'
import { Navbar } from '@/views/components/Navbar'
import { ErrorBoundary } from '@/views/components/ErrorBoundary'
import { ToastContainer } from '@/views/components/ToastContainer'

export function AppLayout() {
  const { user, logout } = useAuth()
  const [drawerOpen, setDrawerOpen] = useState(false)

  if (!user) return null

  return (
    <div className="drawer lg:drawer-open min-h-screen">
      <input
        id="app-drawer"
        type="checkbox"
        className="drawer-toggle"
        checked={drawerOpen}
        onChange={(e) => setDrawerOpen(e.target.checked)}
        readOnly
      />

      {/* Page content */}
      <div className="drawer-content flex flex-col">
        <Navbar user={user} onLogout={logout} onMenuClick={() => setDrawerOpen(true)} />
        <main className="flex-1 p-4 sm:p-6 overflow-auto bg-base-100">
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </main>
      </div>

      {/* Sidebar drawer */}
      <div className="drawer-side z-40">
        <label
          htmlFor="app-drawer"
          className="drawer-overlay"
          onClick={() => setDrawerOpen(false)}
        />
        <Sidebar role={user.role} onClose={() => setDrawerOpen(false)} />
      </div>

      <ToastContainer />
    </div>
  )
}
