import { employeeSchema } from '@/models/employee.model'

const validData = {
  name: 'Ana Silva',
  email: 'ana@example.com',
  phone: '11999999999',
  role: 'employee' as const,
  color: '#2563eb',
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

  it('rejeita CPF inválido', () => {
    const result = employeeSchema.safeParse({ ...validData, cpf: '111.444.777-30' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].path).toContain('cpf')
      expect(result.error.issues[0].message).toBe('CPF inválido')
    }
  })

  it('rejeita CPF com todos os dígitos iguais', () => {
    const result = employeeSchema.safeParse({ ...validData, cpf: '111.111.111-11' })
    expect(result.success).toBe(false)
  })

  it('aceita CPF válido', () => {
    // 111.444.777-35 is a mathematically valid CPF
    const result = employeeSchema.safeParse({ ...validData, cpf: '111.444.777-35' })
    expect(result.success).toBe(true)
  })

  it('aceita CPF válido sem máscara', () => {
    const result = employeeSchema.safeParse({ ...validData, cpf: '11144477735' })
    expect(result.success).toBe(true)
  })

  it('aceita sem CPF (campo opcional)', () => {
    const result = employeeSchema.safeParse({ ...validData, cpf: undefined })
    expect(result.success).toBe(true)
  })

  it('rejeita sem cor', () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- descartado de propósito, testa a ausência do campo
    const { color, ...withoutColor } = validData
    const result = employeeSchema.safeParse(withoutColor)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].path).toContain('color')
    }
  })

  it('rejeita cor em formato inválido', () => {
    const result = employeeSchema.safeParse({ ...validData, color: 'blue' })
    expect(result.success).toBe(false)
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
