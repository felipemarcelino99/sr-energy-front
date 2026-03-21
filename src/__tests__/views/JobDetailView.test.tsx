import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { JobDetailView } from '@/views/components/JobDetailView'
import type { JobDetail } from '@/models/job.model'

const baseJob: JobDetail = {
  id: '1',
  employeeId: 'emp-1',
  employeeName: 'João Silva',
  machineId: 'mach-1',
  machineName: 'Inversor Solar X1',
  jobType: 'maintenance',
  status: 'pending',
  description: 'Revisão geral',
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
}

describe('JobDetailView', () => {
  it('exibe informações básicas do trabalho', () => {
    render(<MemoryRouter><JobDetailView job={baseJob} /></MemoryRouter>)
    expect(screen.getByText(/revisão geral/i)).toBeInTheDocument()
    expect(screen.getAllByText(/são paulo/i).length).toBeGreaterThan(0)
  })

  it('exibe manual da máquina quando manualUrl está disponível', () => {
    const job: JobDetail = {
      ...baseJob,
      machine: { name: 'Inversor Solar X1', manualUrl: 'https://example.com/manual.pdf' },
    }
    render(<MemoryRouter><JobDetailView job={job} /></MemoryRouter>)
    expect(screen.getByTitle(/manual da máquina/i)).toBeInTheDocument()
  })

  it('não exibe manual quando manualUrl está ausente', () => {
    render(<MemoryRouter><JobDetailView job={baseJob} /></MemoryRouter>)
    expect(screen.queryByTitle(/manual da máquina/i)).not.toBeInTheDocument()
  })

  it('exibe botão "Finalizar" que navega para a tela de finalização', () => {
    const job: JobDetail = { ...baseJob, status: 'in_progress' }
    render(<MemoryRouter><JobDetailView job={job} /></MemoryRouter>)
    const btn = screen.getByRole('link', { name: /finalizar/i })
    expect(btn).toBeInTheDocument()
    expect(btn).toHaveAttribute('href', `/jobs/${job.id}/finalize`)
  })
})
