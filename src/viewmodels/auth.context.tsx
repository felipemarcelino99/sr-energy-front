import { createContext, useContext, useEffect, useRef, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
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
  const navigate = useNavigate()
  // BrowserRouter (non-data-router) devolve um `navigate` com identidade
  // instável — ele muda a cada troca de rota (ver useNavigateUnstable no
  // react-router). Se `navigate` entrasse nas deps abaixo, esse efeito
  // re-rodaria a cada navegação do app inteiro: cancelaria e refaria a
  // inscrição em onAuthStateChange e chamaria loadSession() de novo,
  // gerando loading:true (spinner) por cima da página recém-navegada.
  // O ref mantém sempre a versão mais recente sem forçar o efeito a
  // re-executar.
  const navigateRef = useRef(navigate)
  useEffect(() => {
    navigateRef.current = navigate
  })

  useEffect(() => {
    loadSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        setUser(null)
        return
      }
      const u = session.user
      const role = (u.user_metadata?.role ?? 'employee') as Role
      const name = (u.user_metadata?.name ?? u.email ?? '') as string
      const employeeId = role === 'employee' ? getEmployeeIdFromCache(u.id) : undefined
      const mustChangePassword = Boolean(u.user_metadata?.must_change_password)
      setUser({ id: u.id, employeeId, email: u.email!, name, role, mustChangePassword })

      if (role === 'employee' && !employeeId) {
        resolveEmployeeId(u.id).then((resolved) => {
          if (resolved) {
            const current = useAuthStore.getState().user
            if (current) setUser({ ...current, employeeId: resolved } as AuthUser)
          }
        })
      }

      // A person following a Supabase password-recovery link lands here already
      // authenticated (Supabase signs them in to let them set a new password) —
      // without this, they'd fall straight into the dashboard instead of being
      // asked to set one.
      if (event === 'PASSWORD_RECOVERY') {
        navigateRef.current('/change-password', { replace: true })
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

// eslint-disable-next-line react-refresh/only-export-components -- pre-existing pattern, out of this change's scope
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
