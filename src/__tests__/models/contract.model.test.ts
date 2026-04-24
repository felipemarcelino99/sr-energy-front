import { contractSchema, getContractStatus } from '@/models/contract.model'

const validData = {
  clientId: 'client-uuid-1',
  description: 'Contrato de manutenção',
  startDate: '2024-01-01',
  endDate: '2025-01-01',
  contractType: 'service' as const,
  contractValue: 5000,
}

describe('contract.model — getContractStatus', () => {
  it('retorna "expired" quando endDate já passou', () => {
    const status = getContractStatus('2020-01-01', new Date('2024-01-01'))
    expect(status).toBe('expired')
  })

  it('retorna "expiring" quando faltam 30 dias ou menos', () => {
    const today = new Date('2024-12-01')
    const status = getContractStatus('2024-12-20', today)
    expect(status).toBe('expiring')
  })

  it('retorna "expiring" exatamente em 30 dias', () => {
    const today = new Date('2024-12-01')
    const status = getContractStatus('2024-12-31', today)
    expect(status).toBe('expiring')
  })

  it('retorna "active" quando faltam mais de 30 dias', () => {
    const today = new Date('2024-01-01')
    const status = getContractStatus('2025-06-01', today)
    expect(status).toBe('active')
  })
})

describe('contract.model — schema', () => {
  it('aceita dados válidos', () => {
    const result = contractSchema.safeParse(validData)
    expect(result.success).toBe(true)
  })

  it('rejeita clientId ausente', () => {
    const result = contractSchema.safeParse({ ...validData, clientId: '' })
    expect(result.success).toBe(false)
    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path[0])
      expect(paths).toContain('clientId')
    }
  })

  it('rejeita datas inconsistentes (endDate antes de startDate)', () => {
    const result = contractSchema.safeParse({
      ...validData,
      startDate: '2025-01-01',
      endDate: '2024-01-01',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path[0])
      expect(paths).toContain('endDate')
    }
  })

  it('rejeita descrição ausente', () => {
    const result = contractSchema.safeParse({ ...validData, description: '' })
    expect(result.success).toBe(false)
  })

  it('aceita contractType "service"', () => {
    const result = contractSchema.safeParse({ ...validData, contractType: 'service' })
    expect(result.success).toBe(true)
  })

  it('aceita contractType "rental"', () => {
    const result = contractSchema.safeParse({ ...validData, contractType: 'rental' })
    expect(result.success).toBe(true)
  })

  it('rejeita contractType inválido', () => {
    const result = contractSchema.safeParse({ ...validData, contractType: 'invalid' })
    expect(result.success).toBe(false)
  })

  it('rejeita contractType ausente', () => {
    const { contractType: _, ...withoutType } = validData
    const result = contractSchema.safeParse(withoutType)
    expect(result.success).toBe(false)
  })

  it('rejeita contractValue negativo', () => {
    const result = contractSchema.safeParse({ ...validData, contractValue: -1 })
    expect(result.success).toBe(false)
  })

  it('rejeita contractValue ausente', () => {
    const { contractValue: _, ...withoutValue } = validData
    const result = contractSchema.safeParse(withoutValue)
    expect(result.success).toBe(false)
  })
})
