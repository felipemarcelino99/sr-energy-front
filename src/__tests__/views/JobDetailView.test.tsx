import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { JobDetailView } from '@/views/components/JobDetailView'
import { startJob } from '@/services/job.service'
import type { Job, JobDetail } from '@/models/job.model'

const baseJob: JobDetail = {
  id: '1',
  employeeId: 'emp-1',
  employeeName: 'João Silva',
  machineId: 'mach-1',
  machineName: 'Inversor Solar X1',
  jobType: 'commissioning',
  status: 'pending',
  scopeDetail: 'Revisão geral',
  scheduledDate: '2025-06-01',
  city: 'São Paulo',
  state: 'SP',
  accommodation: false,
  car: true,
  startTime: '08:00',
  endTime: '17:00',
  createdAt: '2025-01-01',
  updatedAt: '2025-01-01',
  machine: { name: 'Inversor Solar X1' },
  employeeIds: ['emp-1'],
}

function renderView(ui: React.ReactElement) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>{ui}</MemoryRouter>
    </QueryClientProvider>
  )
}

describe('JobDetailView', () => {
  it('exibe informações básicas do trabalho', () => {
    renderView(<JobDetailView job={baseJob} />)
    expect(screen.getByText(/revisão geral/i)).toBeInTheDocument()
    expect(screen.getAllByText(/são paulo/i).length).toBeGreaterThan(0)
  })

  it('exibe manual do equipamento quando manualUrl está disponível', () => {
    const job: JobDetail = {
      ...baseJob,
      machine: { name: 'Inversor Solar X1', manualUrl: 'https://example.com/manual.pdf' },
    }
    renderView(<JobDetailView job={job} />)
    expect(screen.getByTitle(/manual do equipamento/i)).toBeInTheDocument()
  })

  it('não exibe manual quando manualUrl está ausente', () => {
    renderView(<JobDetailView job={baseJob} />)
    expect(screen.queryByTitle(/manual do equipamento/i)).not.toBeInTheDocument()
  })

  it('exibe nome do cliente quando clientName está presente', () => {
    const job: JobDetail = { ...baseJob, clientName: 'Empresa ABC Ltda' }
    renderView(<JobDetailView job={job} />)
    expect(screen.getByText('Empresa ABC Ltda')).toBeInTheDocument()
  })

  it('não exibe campo cliente quando clientName está ausente', () => {
    renderView(<JobDetailView job={baseJob} />)
    expect(screen.queryByText(/cliente:/i)).not.toBeInTheDocument()
  })

  it('exibe seção histórico quando relatedJobs possui itens', () => {
    const related: Job[] = [
      {
        id: 'prev-1',
        number: 'OS-00001',
        employeeId: 'emp-2',
        employeeName: 'Maria Souza',
        machineId: 'mach-1',
        machineName: 'Inversor Solar X1',
        jobType: 'commissioning',
        status: 'completed',
        scopeDetail: 'Troca de peças',
        scheduledDate: '2024-12-01',
        city: 'Campinas',
        state: 'SP',
        accommodation: false,
        car: false,
        startTime: '08:00',
        endTime: '17:00',
        createdAt: '2024-12-01',
        updatedAt: '2024-12-01',
        employeeIds: ['emp-2'],
      },
    ]
    renderView(<JobDetailView job={baseJob} relatedJobs={related} />)
    expect(screen.getByText(/histórico/i)).toBeInTheDocument()
    expect(screen.getByText('Maria Souza')).toBeInTheDocument()
  })

  it('não exibe seção histórico quando relatedJobs está ausente', () => {
    renderView(<JobDetailView job={baseJob} />)
    expect(screen.queryByText(/histórico/i)).not.toBeInTheDocument()
  })

  it('exibe botão "Finalizar" que navega para a tela de finalização', () => {
    const job: JobDetail = { ...baseJob, status: 'in_progress' }
    renderView(<JobDetailView job={job} />)
    const btn = screen.getByRole('link', { name: /finalizar/i })
    expect(btn).toBeInTheDocument()
    expect(btn).toHaveAttribute('href', `/jobs/${job.id}/finalize`)
  })

  it('exibe botão "Iniciar OS" quando status é scheduled/pending, com confirmação inline', () => {
    renderView(<JobDetailView job={baseJob} />)
    expect(screen.getByRole('button', { name: /iniciar os/i })).toBeInTheDocument()
    expect(screen.getByText(/inicie a os para poder finalizá-la/i)).toBeInTheDocument()
  })

  it('não exibe "Iniciar OS" nem "Finalizar" quando status é completed/cancelled', () => {
    const job: JobDetail = { ...baseJob, status: 'completed' }
    renderView(<JobDetailView job={job} />)
    expect(screen.queryByRole('button', { name: /iniciar os/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /finalizar/i })).not.toBeInTheDocument()
  })

  it('fluxo Iniciar → Finalizar: confirma início, chama startJob e onStarted (sem window.confirm)', async () => {
    ;(startJob as jest.Mock).mockResolvedValue({ ...baseJob, status: 'in_progress' })
    const onStarted = jest.fn()
    renderView(<JobDetailView job={baseJob} onStarted={onStarted} />)

    fireEvent.click(screen.getByRole('button', { name: /iniciar os/i }))
    const confirmBtn = await screen.findByRole('button', { name: /confirmar início/i })
    fireEvent.click(confirmBtn)

    await waitFor(() => {
      expect(startJob).toHaveBeenCalledWith(baseJob.id)
      expect(onStarted).toHaveBeenCalled()
    })
  })
})
