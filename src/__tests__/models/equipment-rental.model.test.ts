import { equipmentRentalSchema } from '@/models/equipment-rental.model'

const valid = {
  contractId: 'c1',
  bagId: 'b1',
  startDate: '2025-01-01',
  endDate: '2025-06-01',
  value: 1500,
}

describe('equipmentRentalSchema', () => {
  it('valida dados corretos', () => {
    expect(equipmentRentalSchema.safeParse(valid).success).toBe(true)
  })

  it('rejeita contractId vazio', () => {
    expect(equipmentRentalSchema.safeParse({ ...valid, contractId: '' }).success).toBe(false)
  })

  it('rejeita bagId vazio', () => {
    expect(equipmentRentalSchema.safeParse({ ...valid, bagId: '' }).success).toBe(false)
  })

  it('rejeita valor negativo', () => {
    expect(equipmentRentalSchema.safeParse({ ...valid, value: -1 }).success).toBe(false)
  })

  it('rejeita endDate anterior a startDate', () => {
    const result = equipmentRentalSchema.safeParse({ ...valid, endDate: '2024-12-01' })
    expect(result.success).toBe(false)
  })

  it('aceita valor zero', () => {
    expect(equipmentRentalSchema.safeParse({ ...valid, value: 0 }).success).toBe(true)
  })

  it('coerce string para número em value', () => {
    const result = equipmentRentalSchema.safeParse({ ...valid, value: '2000' })
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.value).toBe(2000)
  })
})
