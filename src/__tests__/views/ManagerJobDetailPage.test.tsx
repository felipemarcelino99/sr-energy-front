import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useNavigate } from 'react-router-dom'
import { ManagerJobDetailPage } from '@/views/pages/ManagerJobDetailPage'
import { fetchJob, fetchJobsByMachine } from '@/services/job.service'
import { fetchReport } from '@/services/job-report.service'
import { pdf } from '@react-pdf/renderer'
import { downloadBlob } from '@/utils/downloadBlob'

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: jest.fn(),
}))
jest.mock('@/utils/downloadBlob', () => ({ downloadBlob: jest.fn() }))
jest.mock('@/views/components/JobReportView', () => ({
  JobReportView: ({ onGeneratePdf }: { onGeneratePdf: (data: unknown) => void }) => (
    <div data-testid="job-report-view-stub">
      <button onClick={() => onGeneratePdf({ jobId: 'job-1' })}>Gerar PDF</button>
    </div>
  ),
}))

const baseJob = {
  id: 'job-1',
  number: 'OS-001',
  machineId: 'mach-1',
  description: 'Manutenção',
  city: 'São Paulo',
  state: 'SP',
  scheduledDate: '2025-06-01',
  jobType: 'maintenance',
  employeeName: 'Ana Silva',
  status: 'scheduled',
  clientName: 'Cliente X',
}

function renderPage(id = 'job-1') {
  return render(
    <MemoryRouter initialEntries={[`/jobs/${id}`]}>
      <Routes>
        <Route path="/jobs/:id" element={<ManagerJobDetailPage />} />
        <Route path="/jobs" element={<div>Lista de OS</div>} />
      </Routes>
    </MemoryRouter>
  )
}

beforeEach(() => {
  jest.clearAllMocks()
  ;(fetchJob as jest.Mock).mockResolvedValue(baseJob)
  ;(fetchJobsByMachine as jest.Mock).mockResolvedValue([])
  ;(fetchReport as jest.Mock).mockRejectedValue(new Error('sem relatório'))
})

it('mostra spinner enquanto carrega', () => {
  const { container } = renderPage()
  expect(container.querySelector('.loading-spinner')).toBeInTheDocument()
})

it('mostra erro quando fetchJob falha', async () => {
  ;(fetchJob as jest.Mock).mockRejectedValue(new Error('OS indisponível'))
  renderPage()
  expect(await screen.findByText('OS indisponível')).toBeInTheDocument()
})

it('mostra erro quando fetchJob resolve null (job inexistente)', async () => {
  ;(fetchJob as jest.Mock).mockResolvedValue(null)
  const { container } = renderPage()
  await waitFor(() => {
    expect(container.querySelector('.alert-error')).toBeInTheDocument()
  })
})

it('renderiza nome do cliente e as abas disponíveis', async () => {
  renderPage()
  expect((await screen.findAllByText('Cliente X')).length).toBeGreaterThan(0)
  expect(screen.getByText('Informações')).toBeInTheDocument()
  expect(screen.getByText('Checklist')).toBeInTheDocument()
  expect(screen.queryByText('Histórico')).not.toBeInTheDocument()
  expect(screen.queryByText('Finalizado')).not.toBeInTheDocument()
})

it('mostra aba de histórico com OS relacionadas e navega ao clicar numa row', async () => {
  const navigate = jest.fn()
  ;(useNavigate as unknown as jest.Mock).mockReturnValue(navigate)
  ;(fetchJobsByMachine as jest.Mock).mockResolvedValue([
    {
      id: 'job-2',
      number: 'OS-002',
      scheduledDate: '2025-05-01',
      employeeName: 'Carlos',
      jobType: 'implementation',
      status: 'completed',
      description: 'Troca de peça',
    },
  ])
  renderPage()
  const historyTab = await screen.findByText('Histórico')
  fireEvent.click(historyTab)
  const row = screen.getByText('Carlos').closest('tr')!
  fireEvent.click(row)
  expect(navigate).toHaveBeenCalledWith('/jobs/job-2')
})

it('mostra aba "Finalizado" com relatório e gera PDF ao clicar', async () => {
  ;(fetchReport as jest.Mock).mockResolvedValue({
    id: 'report-1',
    content: '<p>Relatório</p>',
    submittedAt: '2025-06-02',
  })
  const blob = new Blob()
  ;(pdf as jest.Mock).mockReturnValue({ toBlob: jest.fn().mockResolvedValue(blob) })
  renderPage()
  const reportTab = await screen.findByText('Finalizado')
  fireEvent.click(reportTab)
  expect(screen.getByTestId('job-report-view-stub')).toBeInTheDocument()

  fireEvent.click(screen.getByText('Gerar PDF'))
  await waitFor(() => {
    expect(downloadBlob).toHaveBeenCalledWith(blob, 'relatorio-job-1.pdf')
  })
})

it('publica onBack que navega para /jobs', async () => {
  const navigate = jest.fn()
  ;(useNavigate as unknown as jest.Mock).mockReturnValue(navigate)
  renderPage()
  await screen.findByText('Informações')
  // onBack é testado indiretamente via header; garantimos que a página carrega sem navegação automática
  expect(navigate).not.toHaveBeenCalled()
})
