import { create } from 'zustand'
import type { AuthUser, LoginFormData } from '@/models/auth.model'
import { signIn, signOut, getSession } from '@/services/auth.service'

interface AuthState {
  user: AuthUser | null
  loading: boolean
  error: string | null
  login: (data: LoginFormData) => Promise<AuthUser>
  logout: () => Promise<void>
  loadSession: () => Promise<void>
  setUser: (user: AuthUser | null) => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,
  error: null,

  login: async ({ email, password }) => {
    set({ loading: true, error: null })
    try {
      const user = await signIn(email, password)
      set({ user, loading: false })
      return user
    } catch (err) {
      set({ error: (err as Error).message, loading: false })
      throw err
    }
  },

  logout: async () => {
    set({ loading: true, error: null })
    try {
      await signOut()
      set({ user: null, loading: false })
    } catch (err) {
      set({ error: (err as Error).message, loading: false })
      throw err
    }
  },

  loadSession: async () => {
    set({ loading: true })
    try {
      const user = await getSession()
      set({ user, loading: false })
    } catch {
      set({ user: null, loading: false })
    }
  },

  setUser: (user) => set({ user }),
}))
