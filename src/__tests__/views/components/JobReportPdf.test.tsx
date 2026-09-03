import { render } from '@testing-library/react'
import { JobReportPdf } from '@/views/components/JobReportPdf'
import type { PdfData } from '@/models/job-report.model'

const baseData: PdfData = {
  jobId: 'job-12345678',
  scheduledDate: '2026-01-15',
  employeeName: 'João Silva',
  machineName: 'Retroescavadeira',
  city: 'Curitiba',
  state: 'PR',
  jobType: 'maintenance',
  reportContent: '<p>Texto simples</p>',
  evidences: [],
  submittedAt: '2026-01-16T10:00:00.000Z',
}

function renderText(data: PdfData): string {
  return render(<JobReportPdf data={data} />).container.textContent ?? ''
}

it('renders header metadata (local, tipo, funcionário)', () => {
  const text = renderText(baseData)
  expect(text).toContain('Curitiba / PR')
  expect(text).toContain('Manutenção')
  expect(text).toContain('João Silva')
})

it('renders jobType "implementation" as Implementação', () => {
  const text = renderText({ ...baseData, jobType: 'implementation' })
  expect(text).toContain('Implementação')
})

it('renders bold/italic/underline runs preserving formatting flags via text content', () => {
  const text = renderText({
    ...baseData,
    reportContent: '<p>Início <strong>negrito</strong> <em>itálico</em> <u>sublinhado</u> fim</p>',
  })
  expect(text).toContain('negrito')
  expect(text).toContain('itálico')
  expect(text).toContain('sublinhado')
})

it('renders headings and list items', () => {
  const text = renderText({
    ...baseData,
    reportContent: '<h2>Seção</h2><ul><li>Item um</li><li>Item dois</li></ul>',
  })
  expect(text).toContain('Seção')
  expect(text).toContain('Item um')
  expect(text).toContain('Item dois')
})

it('renders evidences list when present', () => {
  const text = renderText({
    ...baseData,
    evidences: [{ fileName: 'foto.jpg', url: 'https://x.test/foto.jpg', type: 'image' }],
  })
  expect(text).toContain('foto.jpg')
  expect(text).toContain('Evidências')
})

it('does not render evidences section when list is empty', () => {
  const text = renderText(baseData)
  expect(text).not.toContain('Evidências')
})

it('renders checklist items with checked/unchecked marker', () => {
  const text = renderText({
    ...baseData,
    checklist: [
      { toolName: 'Chave de fenda', checked: true },
      { toolName: 'Martelo', checked: false },
    ],
  })
  expect(text).toContain('✓ Chave de fenda')
  expect(text).toContain('✗ Martelo')
})

it('does not render checklist section when absent', () => {
  const text = renderText(baseData)
  expect(text).not.toContain('Checklist de Ferramentas')
})
