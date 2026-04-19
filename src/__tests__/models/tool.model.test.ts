import { toolSchema } from '@/models/tool.model'

const validData = {
  name: 'Chave de Fenda',
  description: 'Chave de fenda Phillips',
  status: 'active' as const,
  quantity: 10,
}

describe('tool.model — schema', () => {
  it('aceita dados válidos', () => {
    const result = toolSchema.safeParse(validData)
    expect(result.success).toBe(true)
  })

  it('rejeita nome ausente', () => {
    const result = toolSchema.safeParse({ ...validData, name: '' })
    expect(result.success).toBe(false)
    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path[0])
      expect(paths).toContain('name')
    }
  })

  it('rejeita quantidade negativa', () => {
    const result = toolSchema.safeParse({ ...validData, quantity: -1 })
    expect(result.success).toBe(false)
    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path[0])
      expect(paths).toContain('quantity')
    }
  })

  it('rejeita status inválido', () => {
    const result = toolSchema.safeParse({ ...validData, status: 'unknown' })
    expect(result.success).toBe(false)
    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path[0])
      expect(paths).toContain('status')
    }
  })

  it('aceita status padrão active quando omitido', () => {
    const { status, ...withoutStatus } = validData
    const result = toolSchema.safeParse(withoutStatus)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.status).toBe('active')
    }
  })

  it('aceita description opcional quando omitida', () => {
    const { description, ...withoutDescription } = validData
    const result = toolSchema.safeParse(withoutDescription)
    expect(result.success).toBe(true)
  })

  it('converte quantity string para número', () => {
    const result = toolSchema.safeParse({ ...validData, quantity: '5' })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.quantity).toBe(5)
    }
  })

  it('aceita quantity zero', () => {
    const result = toolSchema.safeParse({ ...validData, quantity: 0 })
    expect(result.success).toBe(true)
  })
})
