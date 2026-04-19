import { createContext, useContext, useEffect, type ReactNode } from 'react'
import { useAuthStore } from './auth.viewmodel'
import { supabase } from '@/services/supabase'
import { getEmployeeIdFromCache, resolveEmployeeId } from '@/services/auth.service'
import type { AuthUser, Role } from '@/models/auth.model'

interface AuthContextValue {
  user: AuthUser | null
  role: Role | null
  loading: boolean
  login: (data: { email: string; password: string }) => Promise<AuthUser>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const { user, loading, login, logout, loadSession, setUser } = useAuthStore()

  useEffect(() => {
    loadSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        setUser(null)
        return
      }
      const u = session.user
      const role = (u.user_metadata?.role ?? 'employee') as Role
      const name = (u.user_metadata?.name ?? u.email ?? '') as string
      const employeeId = role === 'employee' ? getEmployeeIdFromCache(u.id) : undefined
      setUser({ id: u.id, employeeId, email: u.email!, name, role })

      if (role === 'employee' && !employeeId) {
        resolveEmployeeId(u.id).then((resolved) => {
          if (resolved) {
            const current = useAuthStore.getState().user
            if (current) setUser({ ...current, employeeId: resolved } as AuthUser)
          }
        })
      }
    })

    return () => subscription.unsubscribe()
  }, [loadSession, setUser])

  return (
    <AuthContext.Provider value={{ user, role: user?.role ?? null, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
