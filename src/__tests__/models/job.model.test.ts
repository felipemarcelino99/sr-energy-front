import { jobStep1Schema, jobStep2Schema, jobStep3Schema, jobSchema } from '@/models/job.model'

describe('job.model — step 1 schema', () => {
  it('aceita dados válidos', () => {
    const result = jobStep1Schema.safeParse({
      employeeIds: ['emp-1'],
      scheduledDate: '2025-06-01',
    })
    expect(result.success).toBe(true)
  })

  it('rejeita employeeIds vazio', () => {
    const result = jobStep1Schema.safeParse({ employeeIds: [], scheduledDate: '2025-06-01' })
    expect(result.success).toBe(false)
  })

  it('rejeita data ausente', () => {
    const result = jobStep1Schema.safeParse({ employeeIds: ['emp-1'], scheduledDate: '' })
    expect(result.success).toBe(false)
  })
})

describe('job.model — step 2 schema', () => {
  const valid = {
    city: 'São Paulo',
    state: 'SP',
    accommodation: false,
    car: true,
    startTime: '08:00',
    endTime: '17:00',
  }

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
  const valid = { machineId: 'mach-1', jobType: 'commissioning' as const }

  it('aceita dados válidos, sem descrição', () => {
    expect(jobStep3Schema.safeParse(valid).success).toBe(true)
  })

  it('aceita todos os 10 tipos de OS', () => {
    const types = [
      'pre_commissioning',
      'commissioning',
      'pre_taf',
      'taf',
      'technical_visit',
      'field_survey',
      'studies',
      'bench_tests',
      'energization_support',
      'development',
    ] as const
    for (const jobType of types) {
      expect(jobStep3Schema.safeParse({ ...valid, jobType }).success).toBe(true)
    }
  })

  it('rejeita jobType inválido (tipo legado)', () => {
    const result = jobStep3Schema.safeParse({ ...valid, jobType: 'maintenance' })
    expect(result.success).toBe(false)
  })

  it('rejeita machineId ausente', () => {
    const result = jobStep3Schema.safeParse({ ...valid, machineId: '' })
    expect(result.success).toBe(false)
  })

  it('aceita contractId/proposalId/scopeDetail/bagId opcionais', () => {
    const result = jobStep3Schema.safeParse({
      ...valid,
      contractId: 'contract-1',
      proposalId: 'proposal-1',
      scopeDetail: 'Revisão geral',
      bagId: 'bag-1',
    })
    expect(result.success).toBe(true)
  })
})

describe('job.model — full schema', () => {
  it('aceita dados completos válidos, sem descrição e com employeeIds', () => {
    const result = jobSchema.safeParse({
      employeeIds: ['emp-1'],
      scheduledDate: '2025-06-01',
      city: 'São Paulo',
      state: 'SP',
      accommodation: false,
      car: true,
      startTime: '08:00',
      endTime: '17:00',
      machineId: 'mach-1',
      jobType: 'commissioning',
    })
    expect(result.success).toBe(true)
  })
})
