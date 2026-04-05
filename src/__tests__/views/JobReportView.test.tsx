import { render, screen, fireEvent, act } from '@testing-library/react'
import { JobReportView } from '@/views/components/JobReportView'
import type { JobReport } from '@/models/job-report.model'
import { useChecklistStore } from '@/viewmodels/checklist.viewmodel'

jest.mock('@/viewmodels/checklist.viewmodel', () => ({
  useChecklistStore: jest.fn(),
}))

const mockStore = {
  items: [],
  loading: false,
  checkedCount: 0,
  allChecked: false,
  duplicateForReport: jest.fn().mockResolvedValue(undefined),
  fetchChecklist: jest.fn().mockResolvedValue(undefined),
  toggleItem: jest.fn().mockResolvedValue(undefined),
}

beforeEach(() => {
  jest.clearAllMocks()
  ;(useChecklistStore as unknown as jest.Mock).mockReturnValue(mockStore)
})

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
    render(<JobReportView jobId="job-1" report={mockReport} jobMeta={jobMeta} />)
    expect(screen.getByTestId('report-content')).toBeInTheDocument()
  })

  it('exibe preview para imagens', () => {
    render(<JobReportView jobId="job-1" report={mockReport} jobMeta={jobMeta} />)
    expect(screen.getByRole('img', { name: /photo.jpg/i })).toBeInTheDocument()
  })

  it('exibe ícone para arquivos PDF', () => {
    render(<JobReportView jobId="job-1" report={mockReport} jobMeta={jobMeta} />)
    expect(screen.getByText('doc.pdf')).toBeInTheDocument()
  })

  it('clicar em Gerar PDF mostra o step de checklist', async () => {
    render(<JobReportView jobId="job-1" report={mockReport} jobMeta={jobMeta} />)
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /gerar pdf/i }))
    })
    expect(screen.getByTestId('checklist-step')).toBeInTheDocument()
    expect(mockStore.duplicateForReport).toHaveBeenCalledWith('job-1')
    expect(mockStore.fetchChecklist).toHaveBeenCalledWith('job-1', 'pre_report')
  })

  it('Cancelar no step de checklist volta para a view do relatório', async () => {
    render(<JobReportView jobId="job-1" report={mockReport} jobMeta={jobMeta} />)
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /gerar pdf/i }))
    })
    fireEvent.click(screen.getByRole('button', { name: /cancelar/i }))
    expect(screen.queryByTestId('checklist-step')).not.toBeInTheDocument()
    expect(screen.getByTestId('report-content')).toBeInTheDocument()
  })

  it('mostra itens do checklist no step', async () => {
    const items = [
      { id: 'c1', jobId: 'job-1', employeeId: 'e1', toolId: 't1', checked: true, phase: 'pre_report' as const, createdAt: '', tool: { id: 't1', name: 'Chave de fenda', status: 'active' as const, quantity: 2, createdAt: '', updatedAt: '' } },
      { id: 'c2', jobId: 'job-1', employeeId: 'e1', toolId: 't2', checked: false, phase: 'pre_report' as const, createdAt: '', tool: { id: 't2', name: 'Alicate', status: 'active' as const, quantity: 1, createdAt: '', updatedAt: '' } },
    ]
    ;(useChecklistStore as unknown as jest.Mock).mockReturnValue({ ...mockStore, items, checkedCount: 1, allChecked: false })
    render(<JobReportView jobId="job-1" report={mockReport} jobMeta={jobMeta} />)
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /gerar pdf/i }))
    })
    expect(screen.getByText('Chave de fenda')).toBeInTheDocument()
    expect(screen.getByText('Alicate')).toBeInTheDocument()
    expect(screen.getByText('1/2 itens verificados')).toBeInTheDocument()
  })

  it('mostra aviso quando há itens não marcados', async () => {
    const items = [
      { id: 'c1', jobId: 'job-1', employeeId: 'e1', toolId: 't1', checked: false, phase: 'pre_report' as const, createdAt: '', tool: { id: 't1', name: 'Chave', status: 'active' as const, quantity: 1, createdAt: '', updatedAt: '' } },
    ]
    ;(useChecklistStore as unknown as jest.Mock).mockReturnValue({ ...mockStore, items, checkedCount: 0, allChecked: false })
    render(<JobReportView jobId="job-1" report={mockReport} jobMeta={jobMeta} />)
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /gerar pdf/i }))
    })
    expect(screen.getByTestId('checklist-warning')).toBeInTheDocument()
  })

  it('Confirmar e Gerar PDF chama onGeneratePdf com checklist', async () => {
    const onGeneratePdf = jest.fn()
    const items = [
      { id: 'c1', jobId: 'job-1', employeeId: 'e1', toolId: 't1', checked: true, phase: 'pre_report' as const, createdAt: '', tool: { id: 't1', name: 'Chave', status: 'active' as const, quantity: 1, createdAt: '', updatedAt: '' } },
    ]
    ;(useChecklistStore as unknown as jest.Mock).mockReturnValue({ ...mockStore, items, checkedCount: 1, allChecked: true })
    render(<JobReportView jobId="job-1" report={mockReport} jobMeta={jobMeta} onGeneratePdf={onGeneratePdf} />)
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /gerar pdf/i }))
    })
    fireEvent.click(screen.getByRole('button', { name: /confirmar e gerar pdf/i }))
    expect(onGeneratePdf).toHaveBeenCalledWith(
      expect.objectContaining({
        jobId: 'job-1',
        checklist: [{ toolName: 'Chave', checked: true }],
      })
    )
  })
})
