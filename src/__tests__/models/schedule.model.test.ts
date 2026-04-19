import { scheduleEventSchema } from '@/models/schedule.model'

describe('scheduleEventSchema', () => {
  const validPayload = {
    type: 'training',
    employeeIds: ['emp-1'],
    startDate: '2026-04-02',
    endDate: '2026-04-03',
  }

  it('accepts a valid payload', () => {
    expect(() => scheduleEventSchema.parse(validPayload)).not.toThrow()
  })

  it('requires at least one employeeId', () => {
    const result = scheduleEventSchema.safeParse({ ...validPayload, employeeIds: [] })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0].message).toMatch(/funcionário/i)
  })

  it('rejects unknown event type', () => {
    const result = scheduleEventSchema.safeParse({ ...validPayload, type: 'unknown' })
    expect(result.success).toBe(false)
  })

  it('rejects when endDate is before startDate', () => {
    const result = scheduleEventSchema.safeParse({ ...validPayload, startDate: '2026-04-10', endDate: '2026-04-05' })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0].path).toContain('endDate')
  })

  it('accepts endDate equal to startDate (single-day event)', () => {
    expect(() => scheduleEventSchema.parse({ ...validPayload, startDate: '2026-04-06', endDate: '2026-04-06' })).not.toThrow()
  })

  it('allows notes to be optional', () => {
    expect(() => scheduleEventSchema.parse(validPayload)).not.toThrow()
    expect(() => scheduleEventSchema.parse({ ...validPayload, notes: 'some note' })).not.toThrow()
  })
})
