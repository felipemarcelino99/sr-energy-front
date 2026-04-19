import { supabase } from '@/services/supabase'
import api from '@/services/api'
import type { AuthUser, Role } from '@/models/auth.model'
import { EmployeeListResponseSchema } from '@/models/employee.model'

// HIGH-02: cache em memória — sem localStorage
const employeeIdCache = new Map<string, string>()

export function getEmployeeIdFromCache(userId: string): string | undefined {
  return employeeIdCache.get(userId)
}

async function resolveEmployeeId(userId: string): Promise<string | undefined> {
  const cached = employeeIdCache.get(userId)
  if (cached) return cached

  try {
    const { data } = await api.get<unknown>('/employees')
    // MED-02: valida shape da resposta antes de usar
    const parsed = EmployeeListResponseSchema.safeParse(data)
    if (!parsed.success) return undefined
    const id = parsed.data.find((e) => e.userId === userId)?.id
    if (id) employeeIdCache.set(userId, id)
    return id
  } catch {
    return undefined
  }
}

function clearEmployeeIdCache() {
  employeeIdCache.clear()
}

// MED-01: mensagens genéricas para não vazar info interna
const AUTH_ERROR_MAP: Record<string, string> = {
  'Invalid login credentials': 'Email ou senha incorretos.',
  'Email not confirmed': 'Confirme seu email antes de entrar.',
  'Too many requests': 'Muitas tentativas. Aguarde alguns minutos.',
  'User not found': 'Email ou senha incorretos.',
  'Invalid email or password': 'Email ou senha incorretos.',
  'signup_disabled': 'Cadastro de novos usuários está desativado.',
}

function mapAuthError(message: string): string {
  return AUTH_ERROR_MAP[message] ?? 'Erro ao fazer login. Tente novamente.'
}

export async function signIn(email: string, password: string): Promise<AuthUser> {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw new Error(mapAuthError(error.message))

  const user = data.user
  const role = (user.user_metadata?.role ?? 'employee') as Role
  const name = (user.user_metadata?.name ?? user.email ?? '') as string
  const employeeId = role === 'employee' ? await resolveEmployeeId(user.id) : undefined

  return { id: user.id, employeeId, email: user.email!, name, role }
}

export async function signOut(): Promise<void> {
  clearEmployeeIdCache()
  const { error } = await supabase.auth.signOut()
  if (error) throw new Error(mapAuthError(error.message))
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
