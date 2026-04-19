import { z } from 'zod'

export type EmployeeRole = 'employee' | 'manager'

export interface Employee {
  id: string
  userId: string | null
  name: string
  email: string
  phone: string
  role: EmployeeRole
  cnpj?: string
  salary: number
  hiredAt: string
  createdAt: string
  updatedAt: string
}

function isValidCNPJ(cnpj: string): boolean {
  const s = cnpj.replace(/[^\d]/g, '')
  if (s.length !== 14 || /^(\d)\1+$/.test(s)) return false
  const calc = (n: number) => {
    let sum = 0
    let pos = n - 7
    for (let i = n; i >= 1; i--) {
      sum += parseInt(s[n - i]) * pos--
      if (pos < 2) pos = 9
    }
    const rem = sum % 11
    return rem < 2 ? 0 : 11 - rem
  }
  return calc(12) === parseInt(s[12]) && calc(13) === parseInt(s[13])
}

// MED-02: schema de validação da resposta da API (snake_case → camelCase via api interceptor)
export const EmployeeResponseSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid().nullable(),
  name: z.string(),
  email: z.string().email(),
  phone: z.string(),
  role: z.enum(['employee', 'manager']),
  cnpj: z.string().optional(),
  salary: z.number(),
  hiredAt: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export const EmployeeListResponseSchema = z.array(EmployeeResponseSchema)

export const employeeSchema = z.object({
  name: z.string().min(2, 'Nome deve ter ao menos 2 caracteres'),
  email: z.string().email('E-mail inválido'),
  phone: z.string().min(8, 'Telefone inválido'),
  role: z.enum(['employee', 'manager']),
  cnpj: z
    .string()
    .optional()
    .refine((val) => !val || isValidCNPJ(val), { message: 'CNPJ inválido' }),
  salary: z.coerce.number().positive('Salário deve ser positivo'),
  hiredAt: z.string().min(1, 'Data de contratação obrigatória'),
})

export type EmployeeFormData = z.infer<typeof employeeSchema>
