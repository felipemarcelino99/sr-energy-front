import { jobReportSchema, getEvidenceType, ALLOWED_MIME_TYPES } from '@/models/job-report.model'

describe('job-report.model — schema', () => {
  it('aceita relatório com conteúdo', () => {
    const result = jobReportSchema.safeParse({ content: '<p>Trabalho realizado.</p>' })
    expect(result.success).toBe(true)
  })

  it('rejeita relatório vazio', () => {
    const result = jobReportSchema.safeParse({ content: '' })
    expect(result.success).toBe(false)
  })
})

describe('job-report.model — getEvidenceType', () => {
  it('retorna "image" para image/jpeg', () => {
    expect(getEvidenceType('image/jpeg')).toBe('image')
  })

  it('retorna "image" para image/png', () => {
    expect(getEvidenceType('image/png')).toBe('image')
  })

  it('retorna "pdf" para application/pdf', () => {
    expect(getEvidenceType('application/pdf')).toBe('pdf')
  })

  it('retorna "video" para video/mp4', () => {
    expect(getEvidenceType('video/mp4')).toBe('video')
  })

  it('retorna "audio" para audio/mpeg', () => {
    expect(getEvidenceType('audio/mpeg')).toBe('audio')
  })

  it('retorna null para tipo inválido', () => {
    expect(getEvidenceType('application/exe')).toBeNull()
  })
})

describe('job-report.model — buildPdfData', () => {
  it('retorna estrutura correta com todos os campos', () => {
    const report = {
      id: 'r1',
      jobId: 'job-1',
      content: '<p>Trabalho concluído</p>',
      evidences: [{ id: 'e1', reportId: 'r1', url: 'http://s3/photo.jpg', mimeType: 'image/jpeg', fileName: 'photo.jpg', type: 'image' as const }],
      submittedAt: '2025-06-01',
      employeeId: 'emp-1',
    }
    const { buildPdfData } = require('@/models/job-report.model')
    const pdf = buildPdfData({
      report,
      scheduledDate: '2025-06-01',
      employeeName: 'Ana Silva',
      machineName: 'Torno CNC',
      city: 'São Paulo',
      state: 'SP',
      jobType: 'maintenance',
    })
    expect(pdf.jobId).toBe('job-1')
    expect(pdf.employeeName).toBe('Ana Silva')
    expect(pdf.machineName).toBe('Torno CNC')
    expect(pdf.reportContent).toBe('<p>Trabalho concluído</p>')
    expect(pdf.evidences).toHaveLength(1)
    expect(pdf.evidences[0].fileName).toBe('photo.jpg')
  })
})

describe('job-report.model — ALLOWED_MIME_TYPES', () => {
  it('contém jpg, png, pdf, mp4, mp3', () => {
    expect(ALLOWED_MIME_TYPES).toContain('image/jpeg')
    expect(ALLOWED_MIME_TYPES).toContain('image/png')
    expect(ALLOWED_MIME_TYPES).toContain('application/pdf')
    expect(ALLOWED_MIME_TYPES).toContain('video/mp4')
    expect(ALLOWED_MIME_TYPES).toContain('audio/mpeg')
  })
})
