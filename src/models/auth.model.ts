import { z } from 'zod'

export type Role = 'admin' | 'manager' | 'employee'

export interface AuthUser {
  id: string          // Supabase auth UID
  employeeId?: string // Internal DB employee ID (for role === 'employee')
  email: string
  name: string
  role: Role
}

export const loginSchema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(6, 'Senha deve ter ao menos 6 caracteres'),
})

export type LoginFormData = z.infer<typeof loginSchema>
