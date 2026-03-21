import { employeeSchema } from '@/models/employee.model'

const validData = {
  name: 'Ana Silva',
  email: 'ana@example.com',
  phone: '11999999999',
  role: 'employee' as const,
  salary: 5000,
  hiredAt: '2024-01-15',
}

describe('employeeSchema', () => {
  it('valida dados corretos', () => {
    const result = employeeSchema.safeParse(validData)
    expect(result.success).toBe(true)
  })

  it('rejeita salário negativo', () => {
    const result = employeeSchema.safeParse({ ...validData, salary: -1000 })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].path).toContain('salary')
      expect(result.error.issues[0].message).toContain('positivo')
    }
  })

  it('rejeita salário zero', () => {
    const result = employeeSchema.safeParse({ ...validData, salary: 0 })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].path).toContain('salary')
    }
  })

  it('rejeita CNPJ inválido', () => {
    const result = employeeSchema.safeParse({ ...validData, cnpj: '12.345.678/0001-99' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].path).toContain('cnpj')
      expect(result.error.issues[0].message).toBe('CNPJ inválido')
    }
  })

  it('aceita CNPJ válido', () => {
    // 11.222.333/0001-81 is a mathematically valid CNPJ
    const result = employeeSchema.safeParse({ ...validData, cnpj: '11.222.333/0001-81' })
    expect(result.success).toBe(true)
  })

  it('aceita sem CNPJ (campo opcional)', () => {
    const result = employeeSchema.safeParse({ ...validData, cnpj: undefined })
    expect(result.success).toBe(true)
  })

  it('rejeita nome muito curto', () => {
    const result = employeeSchema.safeParse({ ...validData, name: 'A' })
    expect(result.success).toBe(false)
  })

  it('rejeita e-mail inválido', () => {
    const result = employeeSchema.safeParse({ ...validData, email: 'not-an-email' })
    expect(result.success).toBe(false)
  })
})
