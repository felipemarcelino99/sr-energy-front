import { z } from 'zod'
import { isValidCPF } from '@/utils/cpf'

export type EmployeeRole = 'employee' | 'manager'

const COLOR_REGEX = /^#[0-9a-fA-F]{6}$/

export interface Employee {
  id: string
  userId: string | null
  name: string
  email: string
  phone: string
  role: EmployeeRole
  cpf?: string
  // Sub-plano 05: identificação visual no calendário de OS — obrigatória a
  // partir daqui (ver utils/employee-color.ts). O backend ainda aceita a
  // coluna nula por compatibilidade, mas o cadastro sempre envia uma.
  color: string
  // Assinada na leitura pelo backend (TTL curto) — nunca persistida como veio.
  photoUrl?: string | null
  salary: number
  hiredAt: string
  createdAt: string
  updatedAt: string
}

// MED-02: schema de validação da resposta da API (snake_case → camelCase via api interceptor)
// `color`/`photoUrl` ficam tolerantes aqui (schema é só para resolveEmployeeId
// via GET /employees — ver auth.service.ts) mesmo com o tipo `Employee` acima
// tratando `color` como obrigatório para o resto da UI.
export const EmployeeResponseSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid().nullable(),
  name: z.string(),
  email: z.string().email(),
  phone: z.string(),
  role: z.enum(['employee', 'manager']),
  cpf: z.string().optional(),
  color: z.string().optional(),
  photoUrl: z.string().nullable().optional(),
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
  cpf: z
    .string()
    .optional()
    .refine((val) => !val || isValidCPF(val), { message: 'CPF inválido' }),
  color: z.string().regex(COLOR_REGEX, 'Selecione uma cor'),
  salary: z.coerce.number().positive('Salário deve ser positivo'),
  hiredAt: z.string().min(1, 'Data de contratação obrigatória'),
})

export type EmployeeFormData = z.infer<typeof employeeSchema>

// Password is only collected on creation (admin generates and copies it to
// hand to the employee, who is forced to change it on first login).
export const employeeCreateSchema = employeeSchema.extend({
  password: z.string().min(12, 'Senha deve ter ao menos 12 caracteres'),
})

export type EmployeeCreateFormData = z.infer<typeof employeeCreateSchema>
