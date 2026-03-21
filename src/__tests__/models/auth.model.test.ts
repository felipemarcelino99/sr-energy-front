import { loginSchema } from '@/models/auth.model'

describe('loginSchema', () => {
  it('valida dados corretos', () => {
    const result = loginSchema.safeParse({ email: 'user@example.com', password: '123456' })
    expect(result.success).toBe(true)
  })

  it('rejeita e-mail inválido', () => {
    const result = loginSchema.safeParse({ email: 'not-an-email', password: '123456' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].path).toContain('email')
    }
  })

  it('rejeita senha com menos de 6 caracteres', () => {
    const result = loginSchema.safeParse({ email: 'user@example.com', password: '123' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].path).toContain('password')
    }
  })

  it('rejeita campos ausentes', () => {
    const result = loginSchema.safeParse({})
    expect(result.success).toBe(false)
  })
})
