import { render, screen } from '@testing-library/react'
import { MachineJobHistory } from '@/views/components/MachineJobHistory'
import type { MachineJob } from '@/models/machine.model'

const mockJobs: MachineJob[] = [
  {
    id: 'j1',
    employeeName: 'Ana Lima',
    scheduledDate: '2024-03-10',
    city: 'São Paulo',
    state: 'SP',
    jobType: 'maintenance',
    status: 'completed',
  },
  {
    id: 'j2',
    employeeName: 'Carlos Melo',
    scheduledDate: '2024-01-05',
    city: 'Curitiba',
    state: 'PR',
    jobType: 'implementation',
    status: 'completed',
  },
]

describe('MachineJobHistory', () => {
  it('renderiza lista de trabalhos com funcionário, data e local', () => {
    render(<MachineJobHistory jobs={mockJobs} loading={false} />)
    expect(screen.getByText('Ana Lima')).toBeInTheDocument()
    expect(screen.getByText('Carlos Melo')).toBeInTheDocument()
    expect(screen.getByText(/São Paulo.*SP/i)).toBeInTheDocument()
    expect(screen.getByText(/Curitiba.*PR/i)).toBeInTheDocument()
  })

  it('exibe estado vazio quando não há trabalhos', () => {
    render(<MachineJobHistory jobs={[]} loading={false} />)
    expect(screen.getByText(/nenhum trabalho/i)).toBeInTheDocument()
  })

  it('exibe skeleton loader enquanto carrega', () => {
    render(<MachineJobHistory jobs={[]} loading={true} />)
    expect(document.querySelector('.animate-pulse')).toBeInTheDocument()
  })

  it('exibe badge do tipo de trabalho', () => {
    render(<MachineJobHistory jobs={mockJobs} loading={false} />)
    expect(screen.getByText(/manutenção/i)).toBeInTheDocument()
    expect(screen.getByText(/implementação/i)).toBeInTheDocument()
  })
})
