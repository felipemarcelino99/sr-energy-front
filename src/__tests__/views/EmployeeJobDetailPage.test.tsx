import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useNavigate } from 'react-router-dom'
import { EmployeeJobDetailPage } from '@/views/pages/EmployeeJobDetailPage'
import { useJobReportStore } from '@/viewmodels/job-report.viewmodel'
import { fetchJob } from '@/services/job.service'
import { fetchMachineJobs } from '@/services/machine.service'
import { fetchReport } from '@/services/job-report.service'

jest.mock('@/viewmodels/job-report.viewmodel')
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: jest.fn(),
}))
jest.mock('@/views/components/RichTextEditor', () => ({
  RichTextEditor: ({ content, onChange }: { content: string; onChange: (v: string) => void }) => (
    <textarea data-testid="rte-stub" value={content} onChange={(e) => onChange(e.target.value)} />
  ),
}))

function mockReportStore(overrides: Partial<ReturnType<typeof useJobReportStore>> = {}) {
  ;(useJobReportStore as unknown as jest.Mock).mockReturnValue({
    update: jest.fn().mockResolvedValue(undefined),
    loading: false,
    error: null,
    ...overrides,
  })
}

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
}

function renderPage(id = 'job-1') {
  return render(
    <MemoryRouter initialEntries={[`/my-jobs/${id}`]}>
      <Routes>
        <Route path="/my-jobs/:id" element={<EmployeeJobDetailPage />} />
        <Route path="/my-jobs" element={<div>Lista de minhas OS</div>} />
      </Routes>
    </MemoryRouter>
  )
}

beforeEach(() => {
  jest.clearAllMocks()
  ;(fetchJob as jest.Mock).mockResolvedValue(baseJob)
  ;(fetchMachineJobs as jest.Mock).mockResolvedValue([])
  ;(fetchReport as jest.Mock).mockRejectedValue(new Error('sem relatório'))
})

it('mostra spinner enquanto carrega', () => {
  mockReportStore()
  const { container } = renderPage()
  expect(container.querySelector('.loading-spinner')).toBeInTheDocument()
})

it('mostra erro quando fetchJob falha', async () => {
  ;(fetchJob as jest.Mock).mockRejectedValue(new Error('OS indisponível'))
  mockReportStore()
  renderPage()
  expect(await screen.findByText('OS indisponível')).toBeInTheDocument()
})

it('mostra erro quando fetchJob resolve null (job inexistente)', async () => {
  ;(fetchJob as jest.Mock).mockResolvedValue(null)
  mockReportStore()
  const { container } = renderPage()
  await waitFor(() => {
    expect(container.querySelector('.alert-error')).toBeInTheDocument()
  })
})

it('renderiza as informações da OS e navega de volta ao clicar em onBack', async () => {
  const navigate = jest.fn()
  ;(useNavigate as unknown as jest.Mock).mockReturnValue(navigate)
  mockReportStore()
  renderPage()
  await waitFor(() => expect(screen.getByRole('tablist')).toBeInTheDocument())
  expect(screen.getByText('Informações')).toBeInTheDocument()
})

it('não mostra aba de histórico quando não há outras OS na mesma máquina', async () => {
  mockReportStore()
  renderPage()
  await waitFor(() => expect(screen.getByRole('tablist')).toBeInTheDocument())
  expect(screen.queryByText('Histórico')).not.toBeInTheDocument()
})

it('mostra aba de histórico com OS relacionadas da mesma máquina', async () => {
  ;(fetchMachineJobs as jest.Mock).mockResolvedValue([
    {
      id: 'job-2',
      scheduledDate: '2025-05-01',
      employeeName: 'Carlos',
      jobType: 'implementation',
      status: 'completed',
      city: 'Rio',
      state: 'RJ',
    },
  ])
  mockReportStore()
  renderPage()
  const historyTab = await screen.findByText('Histórico')
  fireEvent.click(historyTab)
  expect(screen.getByText('Carlos')).toBeInTheDocument()
  expect(screen.getByText('Implementação')).toBeInTheDocument()
})

it('mostra aba de relatório e salva alterações com sucesso', async () => {
  ;(fetchReport as jest.Mock).mockResolvedValue({
    id: 'report-1',
    content: '<p>Relatório inicial</p>',
    submittedAt: '2025-06-02',
  })
  const update = jest.fn().mockResolvedValue(undefined)
  mockReportStore({ update })
  renderPage()
  const reportTab = await screen.findByText('Relatório')
  fireEvent.click(reportTab)

  fireEvent.change(screen.getByTestId('rte-stub'), { target: { value: '<p>Atualizado</p>' } })
  fireEvent.click(screen.getByRole('button', { name: 'Salvar Alterações' }))

  await waitFor(() => {
    expect(update).toHaveBeenCalledWith('job-1', '<p>Atualizado</p>')
  })
  expect(await screen.findByText('Relatório atualizado com sucesso.')).toBeInTheDocument()
})

it('mostra erro de salvamento vindo do store', async () => {
  ;(fetchReport as jest.Mock).mockResolvedValue({
    id: 'report-1',
    content: '<p>Relatório</p>',
    submittedAt: '2025-06-02',
  })
  mockReportStore({ error: 'Falha ao salvar' })
  renderPage()
  const reportTab = await screen.findByText('Relatório')
  fireEvent.click(reportTab)
  expect(screen.getByText('Falha ao salvar')).toBeInTheDocument()
})
