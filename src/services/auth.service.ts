import { supabase } from '@/services/supabase'
import api from '@/services/api'
import type { AuthUser, Role } from '@/models/auth.model'
import type { Employee } from '@/models/employee.model'

const EMPLOYEE_ID_KEY = 'sr:employeeId'

async function resolveEmployeeId(userId: string): Promise<string | undefined> {
  const cached = localStorage.getItem(`${EMPLOYEE_ID_KEY}:${userId}`)
  if (cached) return cached

  try {
    const { data } = await api.get<Employee[]>('/employees')
    const id = data.find((e) => e.userId === userId)?.id
    if (id) localStorage.setItem(`${EMPLOYEE_ID_KEY}:${userId}`, id)
    return id
  } catch {
    return undefined
  }
}

function clearEmployeeIdCache() {
  Object.keys(localStorage)
    .filter((k) => k.startsWith(EMPLOYEE_ID_KEY))
    .forEach((k) => localStorage.removeItem(k))
}

export async function signIn(email: string, password: string): Promise<AuthUser> {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw new Error(error.message)

  const user = data.user
  const role = (user.user_metadata?.role ?? 'employee') as Role
  const name = (user.user_metadata?.name ?? user.email ?? '') as string
  const employeeId = role === 'employee' ? await resolveEmployeeId(user.id) : undefined

  return { id: user.id, employeeId, email: user.email!, name, role }
}

export async function signOut(): Promise<void> {
  clearEmployeeIdCache()
  const { error } = await supabase.auth.signOut()
  if (error) throw new Error(error.message)
}

export async function getSession(): Promise<AuthUser | null> {
  const { data } = await supabase.auth.getSession()
  const session = data.session
  if (!session) return null

  const user = session.user
  const role = (user.user_metadata?.role ?? 'employee') as Role
  const name = (user.user_metadata?.name ?? user.email ?? '') as string
  const employeeId = role === 'employee' ? await resolveEmployeeId(user.id) : undefined

  return { id: user.id, employeeId, email: user.email!, name, role }
}
