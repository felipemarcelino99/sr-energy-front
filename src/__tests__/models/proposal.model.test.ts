import { proposalSchema } from '@/models/proposal.model'

const validData = {
  clientId: 'client-uuid-1',
  description: 'Comissionamento de inversores',
  contractType: 'service' as const,
  contractValue: 5000,
}

describe('proposal.model — schema', () => {
  it('aceita dados válidos sem startDate nem contractId (ambos opcionais)', () => {
    const result = proposalSchema.safeParse(validData)
    expect(result.success).toBe(true)
  })

  it('aceita startDate quando informado', () => {
    const result = proposalSchema.safeParse({ ...validData, startDate: '2026-01-15' })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.startDate).toBe('2026-01-15')
    }
  })

  it('não possui mais campo endDate no schema', () => {
    const result = proposalSchema.safeParse({ ...validData, startDate: '2026-01-15' })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).not.toHaveProperty('endDate')
    }
  })

  it('aceita contractId quando a PC está vinculada a um contrato existente', () => {
    const result = proposalSchema.safeParse({ ...validData, contractId: 'contract-uuid-1' })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.contractId).toBe('contract-uuid-1')
    }
  })

  it('rejeita clientId ausente', () => {
    const result = proposalSchema.safeParse({ ...validData, clientId: '' })
    expect(result.success).toBe(false)
    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path[0])
      expect(paths).toContain('clientId')
    }
  })

  it('rejeita descrição ausente', () => {
    const result = proposalSchema.safeParse({ ...validData, description: '' })
    expect(result.success).toBe(false)
  })

  it('aceita contractType "service"', () => {
    const result = proposalSchema.safeParse({ ...validData, contractType: 'service' })
    expect(result.success).toBe(true)
  })

  it('aceita contractType "rental"', () => {
    const result = proposalSchema.safeParse({ ...validData, contractType: 'rental' })
    expect(result.success).toBe(true)
  })

  it('rejeita contractType inválido', () => {
    const result = proposalSchema.safeParse({ ...validData, contractType: 'invalid' })
    expect(result.success).toBe(false)
  })

  it('rejeita contractValue negativo', () => {
    const result = proposalSchema.safeParse({ ...validData, contractValue: -1 })
    expect(result.success).toBe(false)
  })
})
