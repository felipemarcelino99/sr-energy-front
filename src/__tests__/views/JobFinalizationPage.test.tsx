import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useNavigate } from 'react-router-dom'
import { JobFinalizationPage } from '@/views/pages/JobFinalizationPage'
import { useJobReportStore } from '@/viewmodels/job-report.viewmodel'
import { fetchJob } from '@/services/job.service'

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
    submit: jest.fn(),
    loading: false,
    error: null,
    submitted: false,
    ...overrides,
  })
}

function renderPage(id = 'job-1') {
  return render(
    <MemoryRouter initialEntries={[`/my-jobs/${id}/finalize`]}>
      <Routes>
        <Route path="/my-jobs/:id/finalize" element={<JobFinalizationPage />} />
      </Routes>
    </MemoryRouter>
  )
}

beforeEach(() => {
  jest.clearAllMocks()
  ;(fetchJob as jest.Mock).mockResolvedValue({
    id: 'job-1',
    machineName: 'Torno CNC',
    description: 'Manutenção preventiva',
    city: 'São Paulo',
    state: 'SP',
    scheduledDate: '2025-06-01',
    jobType: 'maintenance',
    employeeName: 'Ana Silva',
  })
})

it('carrega e mostra os dados da OS no cabeçalho sticky', async () => {
  mockReportStore()
  renderPage()
  expect(await screen.findByText('Torno CNC')).toBeInTheDocument()
  expect(screen.getByText('Manutenção preventiva')).toBeInTheDocument()
})

it('mostra erro de validação quando o relatório está vazio', async () => {
  mockReportStore()
  const submit = jest.fn()
  mockReportStore({ submit })
  renderPage()
  await screen.findByText('Torno CNC')
  fireEvent.click(screen.getByRole('button', { name: 'Enviar Relatório' }))
  expect(await screen.findByText('O relatório não pode estar vazio.')).toBeInTheDocument()
  expect(submit).not.toHaveBeenCalled()
})

it('submete o relatório preenchido com sucesso', async () => {
  const submit = jest.fn().mockResolvedValue(undefined)
  mockReportStore({ submit })
  renderPage()
  await screen.findByText('Torno CNC')
  fireEvent.change(screen.getByTestId('rte-stub'), { target: { value: '<p>Tudo certo</p>' } })
  fireEvent.click(screen.getByRole('button', { name: 'Enviar Relatório' }))
  await waitFor(() => {
    expect(submit).toHaveBeenCalledWith('job-1', '<p>Tudo certo</p>', [])
  })
})

it('mostra tela de sucesso e navega de volta para minhas OS', async () => {
  const navigate = jest.fn()
  ;(useNavigate as unknown as jest.Mock).mockReturnValue(navigate)
  mockReportStore({ submitted: true })
  renderPage()
  expect(screen.getByText('OS finalizada!')).toBeInTheDocument()
  fireEvent.click(screen.getByText('Voltar para minhas OS'))
  expect(navigate).toHaveBeenCalledWith('/my-jobs')
})

it('mostra erro vindo do store', async () => {
  mockReportStore({ error: 'Falha ao enviar relatório' })
  renderPage()
  await screen.findByText('Torno CNC')
  expect(screen.getByText('Falha ao enviar relatório')).toBeInTheDocument()
})
