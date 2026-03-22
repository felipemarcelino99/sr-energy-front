import { render, screen } from '@testing-library/react'
import { JobReadOnlyView } from '@/views/components/JobReadOnlyView'
import type { JobDetail } from '@/models/job.model'

const job: JobDetail = {
  id: 'j1',
  employeeId: 'e1',
  employeeName: 'Carlos Silva',
  machineId: 'm1',
  machineName: 'Inversor Solar X',
  jobType: 'maintenance',
  status: 'completed',
  description: 'Revisão geral do sistema',
  scheduledDate: '2024-03-10',
  city: 'Campinas',
  state: 'SP',
  accommodation: true,
  car: false,
  startTime: '08:00',
  endTime: '17:00',
  notes: 'Levar ferramenta específica',
  createdAt: '2024-03-01',
  updatedAt: '2024-03-10',
  machine: { name: 'Inversor Solar X' },
}

it('exibe nome do funcionário', () => {
  render(<JobReadOnlyView job={job} />)
  expect(screen.getByText('Carlos Silva')).toBeInTheDocument()
})

it('exibe nome da máquina', () => {
  render(<JobReadOnlyView job={job} />)
  expect(screen.getByText('Inversor Solar X')).toBeInTheDocument()
})

it('exibe todos os campos do formulário', () => {
  render(<JobReadOnlyView job={job} />)
  expect(screen.getByText(/revisão geral do sistema/i)).toBeInTheDocument()
  expect(screen.getByText(/campinas/i)).toBeInTheDocument()
  expect(screen.getByText(/levar ferramenta/i)).toBeInTheDocument()
})

it('exibe status formatado em português', () => {
  render(<JobReadOnlyView job={job} />)
  expect(screen.getByText('Concluído')).toBeInTheDocument()
})
