import { contractSchema, getContractStatus } from '@/models/contract.model'

const validCNPJ = '11.222.333/0001-81'

const validData = {
  clientName: 'Empresa Teste',
  clientCnpj: validCNPJ,
  description: 'Contrato de manutenção',
  startDate: '2024-01-01',
  endDate: '2025-01-01',
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

  it('rejeita CNPJ inválido', () => {
    const result = contractSchema.safeParse({ ...validData, clientCnpj: '00.000.000/0000-00' })
    expect(result.success).toBe(false)
    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path[0])
      expect(paths).toContain('clientCnpj')
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

  it('rejeita clientName ausente', () => {
    const result = contractSchema.safeParse({ ...validData, clientName: '' })
    expect(result.success).toBe(false)
  })

  it('rejeita descrição ausente', () => {
    const result = contractSchema.safeParse({ ...validData, description: '' })
    expect(result.success).toBe(false)
  })
})
