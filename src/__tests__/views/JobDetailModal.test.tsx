import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { JobDetailModal } from '@/views/components/JobDetailModal'
import { fetchJob, fetchJobsByMachine } from '@/services/job.service'
import { fetchReport } from '@/services/job-report.service'
import { fetchDocuments, generateReport, uploadDocument } from '@/services/document.service'

jest.mock('@/services/document.service')
jest.mock('@/views/components/JobReportView', () => ({
  JobReportView: () => <div data-testid="job-report-view" />,
}))
jest.mock('@/views/components/EntityTimeline', () => ({
  EntityTimeline: () => <div data-testid="entity-timeline" />,
}))
jest.mock('@/views/components/JobReadOnlyView', () => ({
  JobReadOnlyView: () => <div data-testid="job-readonly-view" />,
}))
jest.mock('@/views/components/JobChecklistTab', () => ({
  JobChecklistTab: () => <div data-testid="job-checklist-tab" />,
}))

const baseJob = {
  id: 'j1',
  number: 'AA001',
  employeeId: 'e1',
  employeeName: 'Ana Silva',
  machineId: 'm1',
  machineName: 'Máquina 1',
  jobType: 'maintenance',
  status: 'scheduled',
  description: 'Manutenção',
  scheduledDate: '2026-03-15',
  city: 'Curitiba',
  state: 'PR',
  accommodation: false,
  car: false,
  startTime: '08:00',
  endTime: '12:00',
  createdAt: '2026-01-01',
  updatedAt: '2026-01-01',
  employeeIds: ['e1'],
  clientName: 'Cliente Teste',
  machine: { name: 'Máquina 1' },
  reportId: undefined,
}

function renderModal(props?: Partial<React.ComponentProps<typeof JobDetailModal>>) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const onClose = jest.fn()
  const utils = render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <JobDetailModal jobId="j1" onClose={onClose} {...props} />
      </MemoryRouter>
    </QueryClientProvider>
  )
  return { ...utils, onClose }
}

beforeEach(() => {
  jest.clearAllMocks()
  ;(fetchJob as jest.Mock).mockResolvedValue(baseJob)
  ;(fetchJobsByMachine as jest.Mock).mockResolvedValue([])
  ;(fetchReport as jest.Mock).mockResolvedValue(null)
  ;(fetchDocuments as jest.Mock).mockResolvedValue([])
})

it('exibe spinner de carregamento enquanto a OS não chegou', () => {
  ;(fetchJob as jest.Mock).mockReturnValue(new Promise(() => {}))
  const { container } = renderModal()
  expect(container.querySelector('.loading-spinner')).toBeInTheDocument()
})

it('exibe os detalhes da OS após o carregamento', async () => {
  renderModal()
  expect(await screen.findByText('Cliente Teste')).toBeInTheDocument()
  expect(screen.getByText('AA001')).toBeInTheDocument()
  expect(screen.getByTestId('job-readonly-view')).toBeInTheDocument()
})

it('exibe mensagem de erro quando a busca falha', async () => {
  ;(fetchJob as jest.Mock).mockRejectedValue(new Error('Falha ao buscar OS'))
  renderModal()
  expect(await screen.findByText('Falha ao buscar OS')).toBeInTheDocument()
})

it('exibe o botão Editar para OS não cancelada/concluída e navega ao clicar', async () => {
  renderModal()
  const editButton = await screen.findByRole('button', { name: /editar/i })
  expect(editButton).toBeInTheDocument()
})

it('não exibe o botão Editar para OS cancelada', async () => {
  ;(fetchJob as jest.Mock).mockResolvedValue({ ...baseJob, status: 'cancelled' })
  renderModal()
  await screen.findByTestId('job-readonly-view')
  expect(screen.queryByRole('button', { name: /editar/i })).not.toBeInTheDocument()
})

it('chama onClose ao clicar no botão de fechar', async () => {
  const { onClose } = renderModal()
  await screen.findByTestId('job-readonly-view')
  fireEvent.click(screen.getByLabelText('Fechar'))
  expect(onClose).toHaveBeenCalled()
})

it('troca para a aba Checklist ao clicar', async () => {
  renderModal()
  await screen.findByTestId('job-readonly-view')
  fireEvent.click(screen.getByRole('tab', { name: /checklist/i }))
  expect(screen.getByTestId('job-checklist-tab')).toBeInTheDocument()
})

it('exibe a aba Histórico apenas quando há OS relacionadas pela mesma máquina', async () => {
  ;(fetchJobsByMachine as jest.Mock).mockResolvedValue([{ ...baseJob, id: 'j2', number: 'AA002' }])
  renderModal()
  const historyTab = await screen.findByRole('tab', { name: /histórico/i })
  fireEvent.click(historyTab)
  expect(screen.getByText('AA002')).toBeInTheDocument()
})

it('troca para a aba Linha do tempo ao clicar', async () => {
  renderModal()
  await screen.findByTestId('job-readonly-view')
  fireEvent.click(screen.getByRole('tab', { name: /linha do tempo/i }))
  expect(screen.getByTestId('entity-timeline')).toBeInTheDocument()
})

it('troca para a aba Documentos, mostra estado vazio e permite enviar documento', async () => {
  renderModal()
  await screen.findByTestId('job-readonly-view')
  fireEvent.click(screen.getByRole('tab', { name: /documentos/i }))
  await waitFor(() => {
    expect(screen.getByText(/nenhum documento anexado/i)).toBeInTheDocument()
  })

  const file = new File(['conteudo'], 'relatorio.pdf', { type: 'application/pdf' })
  const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
  fireEvent.change(fileInput, { target: { files: [file] } })

  await waitFor(() => {
    expect(uploadDocument).toHaveBeenCalledWith('job', 'j1', file, undefined, 'RD')
  })
})

it('lista documentos existentes na aba Documentos', async () => {
  ;(fetchDocuments as jest.Mock).mockResolvedValue([
    {
      id: 'd1',
      documentType: 'RD',
      fileName: 'relatorio.pdf',
      createdAt: '2026-01-01T00:00:00Z',
    },
  ])
  renderModal()
  await screen.findByTestId('job-readonly-view')
  fireEvent.click(screen.getByRole('tab', { name: /documentos/i }))
  expect(await screen.findByText('RD-AA001')).toBeInTheDocument()
})

it('botão Gerar PDF fica desabilitado quando a OS não tem reportId', async () => {
  renderModal()
  await screen.findByTestId('job-readonly-view')
  fireEvent.click(screen.getByRole('tab', { name: /documentos/i }))
  await waitFor(() => {
    expect(screen.getByRole('button', { name: /gerar pdf/i })).toBeDisabled()
  })
})

it('gera o PDF do relatório com sucesso quando a OS tem reportId', async () => {
  ;(fetchJob as jest.Mock).mockResolvedValue({ ...baseJob, reportId: 'r1' })
  ;(generateReport as jest.Mock).mockResolvedValue({ documentId: 'd1' })
  renderModal()
  await screen.findByTestId('job-readonly-view')
  fireEvent.click(screen.getByRole('tab', { name: /documentos/i }))
  const genButton = await screen.findByRole('button', { name: /gerar pdf/i })
  expect(genButton).not.toBeDisabled()
  fireEvent.click(genButton)
  await waitFor(() => {
    expect(generateReport).toHaveBeenCalledWith('j1')
  })
})

it('navega para edição ao clicar em Editar e fecha o modal', async () => {
  const { onClose } = renderModal()
  const editButton = await screen.findByRole('button', { name: /editar/i })
  fireEvent.click(editButton)
  expect(onClose).toHaveBeenCalled()
})

it('permite alterar o tipo de documento no seletor antes de enviar', async () => {
  renderModal()
  await screen.findByTestId('job-readonly-view')
  fireEvent.click(screen.getByRole('tab', { name: /documentos/i }))
  const select = await screen.findByLabelText(/tipo de documento/i)
  fireEvent.change(select, { target: { value: 'RDO' } })
  expect(select).toHaveValue('RDO')
})

it('exibe erro genérico quando o upload de documento falha', async () => {
  ;(uploadDocument as jest.Mock).mockRejectedValue(new Error('boom'))
  renderModal()
  await screen.findByTestId('job-readonly-view')
  fireEvent.click(screen.getByRole('tab', { name: /documentos/i }))
  await waitFor(() => screen.getByText(/nenhum documento anexado/i))

  const file = new File(['x'], 'doc.pdf', { type: 'application/pdf' })
  const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
  fireEvent.change(fileInput, { target: { files: [file] } })

  await waitFor(() => {
    expect(uploadDocument).toHaveBeenCalled()
  })
})

it('exibe erro genérico quando geração de PDF falha com status diferente de 404', async () => {
  ;(fetchJob as jest.Mock).mockResolvedValue({ ...baseJob, reportId: 'r1' })
  ;(generateReport as jest.Mock).mockRejectedValue({ response: { status: 500 } })
  renderModal()
  await screen.findByTestId('job-readonly-view')
  fireEvent.click(screen.getByRole('tab', { name: /documentos/i }))
  const genButton = await screen.findByRole('button', { name: /gerar pdf/i })
  fireEvent.click(genButton)
  await waitFor(() => {
    expect(generateReport).toHaveBeenCalled()
  })
})

it('exibe erro específico quando geração de PDF falha com 404 (relatório não enviado)', async () => {
  ;(fetchJob as jest.Mock).mockResolvedValue({ ...baseJob, reportId: 'r1' })
  ;(generateReport as jest.Mock).mockRejectedValue({ response: { status: 404 } })
  renderModal()
  await screen.findByTestId('job-readonly-view')
  fireEvent.click(screen.getByRole('tab', { name: /documentos/i }))
  const genButton = await screen.findByRole('button', { name: /gerar pdf/i })
  fireEvent.click(genButton)
  await waitFor(() => {
    expect(generateReport).toHaveBeenCalled()
  })
})
