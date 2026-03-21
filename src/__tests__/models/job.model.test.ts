import { jobStep1Schema, jobStep2Schema, jobStep3Schema, jobSchema } from '@/models/job.model'

describe('job.model — step 1 schema', () => {
  it('aceita dados válidos', () => {
    const result = jobStep1Schema.safeParse({ employeeId: 'emp-1', scheduledDate: '2025-06-01' })
    expect(result.success).toBe(true)
  })

  it('rejeita employeeId ausente', () => {
    const result = jobStep1Schema.safeParse({ employeeId: '', scheduledDate: '2025-06-01' })
    expect(result.success).toBe(false)
  })

  it('rejeita data ausente', () => {
    const result = jobStep1Schema.safeParse({ employeeId: 'emp-1', scheduledDate: '' })
    expect(result.success).toBe(false)
  })
})

describe('job.model — step 2 schema', () => {
  const valid = { city: 'São Paulo', state: 'SP', accommodation: false, car: true, startTime: '08:00', endTime: '17:00' }

  it('aceita dados válidos', () => {
    expect(jobStep2Schema.safeParse(valid).success).toBe(true)
  })

  it('rejeita estado com mais de 2 chars', () => {
    const result = jobStep2Schema.safeParse({ ...valid, state: 'SPA' })
    expect(result.success).toBe(false)
  })

  it('rejeita cidade ausente', () => {
    const result = jobStep2Schema.safeParse({ ...valid, city: '' })
    expect(result.success).toBe(false)
  })

  it('rejeita horário de início ausente', () => {
    const result = jobStep2Schema.safeParse({ ...valid, startTime: '' })
    expect(result.success).toBe(false)
  })
})

describe('job.model — step 3 schema', () => {
  const valid = { machineId: 'mach-1', jobType: 'maintenance' as const, description: 'Revisão geral' }

  it('aceita dados válidos', () => {
    expect(jobStep3Schema.safeParse(valid).success).toBe(true)
  })

  it('rejeita jobType inválido', () => {
    const result = jobStep3Schema.safeParse({ ...valid, jobType: 'invalid' })
    expect(result.success).toBe(false)
  })

  it('rejeita machineId ausente', () => {
    const result = jobStep3Schema.safeParse({ ...valid, machineId: '' })
    expect(result.success).toBe(false)
  })

  it('rejeita descrição ausente', () => {
    const result = jobStep3Schema.safeParse({ ...valid, description: '' })
    expect(result.success).toBe(false)
  })
})

describe('job.model — full schema', () => {
  it('aceita dados completos válidos', () => {
    const result = jobSchema.safeParse({
      employeeId: 'emp-1',
      scheduledDate: '2025-06-01',
      city: 'São Paulo',
      state: 'SP',
      accommodation: false,
      car: true,
      startTime: '08:00',
      endTime: '17:00',
      machineId: 'mach-1',
      jobType: 'maintenance',
      description: 'Revisão geral',
    })
    expect(result.success).toBe(true)
  })
})
