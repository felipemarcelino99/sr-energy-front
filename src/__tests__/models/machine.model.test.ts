import { machineSchema } from '@/models/machine.model'

const validData = {
  name: 'Torno CNC',
  brand: 'Romi',
  model: 'D800',
  serialNumber: 'SN-001',
  year: 2020,
}

describe('machine.model — schema', () => {
  it('aceita dados válidos', () => {
    const result = machineSchema.safeParse(validData)
    expect(result.success).toBe(true)
  })

  it('rejeita ano inválido (muito antigo)', () => {
    const result = machineSchema.safeParse({ ...validData, year: 1800 })
    expect(result.success).toBe(false)
    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path[0])
      expect(paths).toContain('year')
    }
  })

  it('rejeita ano futuro além do permitido', () => {
    const result = machineSchema.safeParse({ ...validData, year: 9999 })
    expect(result.success).toBe(false)
    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path[0])
      expect(paths).toContain('year')
    }
  })

  it('rejeita nome ausente', () => {
    const result = machineSchema.safeParse({ ...validData, name: '' })
    expect(result.success).toBe(false)
  })

  it('rejeita marca ausente', () => {
    const result = machineSchema.safeParse({ ...validData, brand: '' })
    expect(result.success).toBe(false)
  })

  it('rejeita modelo ausente', () => {
    const result = machineSchema.safeParse({ ...validData, model: '' })
    expect(result.success).toBe(false)
  })

  it('rejeita número de série ausente', () => {
    const result = machineSchema.safeParse({ ...validData, serialNumber: '' })
    expect(result.success).toBe(false)
  })

  it('aceita manualUrl opcional', () => {
    const result = machineSchema.safeParse({ ...validData, manualUrl: 'https://example.com/manual.pdf' })
    expect(result.success).toBe(true)
  })
})
