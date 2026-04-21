import { bagSchema, isCertificateExpiringSoon, isCertificateExpired } from '@/models/bag.model'

describe('bagSchema', () => {
  const validData = { name: 'Mala A', model: 'Modelo X', quantity: 3 }

  it('valida dados corretos', () => {
    expect(bagSchema.safeParse(validData).success).toBe(true)
  })

  it('rejeita nome muito curto', () => {
    expect(bagSchema.safeParse({ ...validData, name: 'A' }).success).toBe(false)
  })

  it('rejeita modelo vazio', () => {
    expect(bagSchema.safeParse({ ...validData, model: '' }).success).toBe(false)
  })

  it('rejeita quantidade zero', () => {
    expect(bagSchema.safeParse({ ...validData, quantity: 0 }).success).toBe(false)
  })

  it('rejeita quantidade negativa', () => {
    expect(bagSchema.safeParse({ ...validData, quantity: -1 }).success).toBe(false)
  })

  it('coerce string para número na quantidade', () => {
    const result = bagSchema.safeParse({ ...validData, quantity: '5' })
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.quantity).toBe(5)
  })
})

describe('isCertificateExpiringSoon', () => {
  it('retorna true quando vencimento está em 15 dias', () => {
    const today = new Date('2025-01-01')
    const expiry = '2025-01-16'
    expect(isCertificateExpiringSoon(expiry, today)).toBe(true)
  })

  it('retorna true quando vencimento está em exatamente 30 dias', () => {
    const today = new Date('2025-01-01')
    const expiry = '2025-01-31'
    expect(isCertificateExpiringSoon(expiry, today)).toBe(true)
  })

  it('retorna false quando vencimento está em 60 dias', () => {
    const today = new Date('2025-01-01')
    const expiry = '2025-03-02'
    expect(isCertificateExpiringSoon(expiry, today)).toBe(false)
  })

  it('retorna false quando já expirou', () => {
    const today = new Date('2025-01-10')
    const expiry = '2025-01-01'
    expect(isCertificateExpiringSoon(expiry, today)).toBe(false)
  })
})

describe('isCertificateExpired', () => {
  it('retorna true quando a data de vencimento passou', () => {
    const today = new Date('2025-06-01')
    expect(isCertificateExpired('2025-05-01', today)).toBe(true)
  })

  it('retorna false quando a data de vencimento é futura', () => {
    const today = new Date('2025-06-01')
    expect(isCertificateExpired('2025-07-01', today)).toBe(false)
  })
})
