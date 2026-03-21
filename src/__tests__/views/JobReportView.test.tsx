import { render, screen, fireEvent } from '@testing-library/react'
import { JobReportView } from '@/views/components/JobReportView'
import type { JobReport } from '@/models/job-report.model'

const mockReport: JobReport = {
  id: 'r1',
  jobId: 'job-1',
  content: '<p>Trabalho <strong>concluído</strong> com sucesso.</p>',
  evidences: [
    { id: 'e1', reportId: 'r1', url: 'http://s3/photo.jpg', mimeType: 'image/jpeg', fileName: 'photo.jpg', type: 'image' },
    { id: 'e2', reportId: 'r1', url: 'http://s3/doc.pdf', mimeType: 'application/pdf', fileName: 'doc.pdf', type: 'pdf' },
  ],
  submittedAt: '2025-06-01',
  employeeId: 'emp-1',
}

const jobMeta = {
  scheduledDate: '2025-06-01',
  employeeName: 'Ana Silva',
  machineName: 'Torno CNC',
  city: 'São Paulo',
  state: 'SP',
  jobType: 'maintenance',
}

describe('JobReportView', () => {
  it('renderiza o HTML do relatório', () => {
    render(<JobReportView report={mockReport} jobMeta={jobMeta} />)
    // The HTML content should be rendered — we look for the text inside
    expect(screen.getByTestId('report-content')).toBeInTheDocument()
  })

  it('exibe preview para imagens', () => {
    render(<JobReportView report={mockReport} jobMeta={jobMeta} />)
    const img = screen.getByRole('img', { name: /photo.jpg/i })
    expect(img).toBeInTheDocument()
  })

  it('exibe ícone para arquivos PDF', () => {
    render(<JobReportView report={mockReport} jobMeta={jobMeta} />)
    expect(screen.getByText('doc.pdf')).toBeInTheDocument()
  })

  it('chama buildPdfData ao clicar em Gerar PDF', () => {
    const onGeneratePdf = jest.fn()
    render(<JobReportView report={mockReport} jobMeta={jobMeta} onGeneratePdf={onGeneratePdf} />)
    fireEvent.click(screen.getByRole('button', { name: /gerar pdf/i }))
    expect(onGeneratePdf).toHaveBeenCalledWith(
      expect.objectContaining({ jobId: 'job-1', employeeName: 'Ana Silva' })
    )
  })
})
