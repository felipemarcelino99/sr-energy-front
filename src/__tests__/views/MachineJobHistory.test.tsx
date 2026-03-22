import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter, useNavigate } from 'react-router-dom'
import { MachineJobHistory } from '@/views/components/MachineJobHistory'
import type { MachineJob } from '@/models/machine.model'

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: jest.fn(),
}))

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

beforeEach(() => {
  ;(useNavigate as jest.Mock).mockReturnValue(jest.fn())
})

describe('MachineJobHistory', () => {
  it('renderiza lista de trabalhos com funcionário, data e local', () => {
    render(<MemoryRouter><MachineJobHistory jobs={mockJobs} loading={false} /></MemoryRouter>)
    expect(screen.getByText('Ana Lima')).toBeInTheDocument()
    expect(screen.getByText('Carlos Melo')).toBeInTheDocument()
    expect(screen.getByText(/São Paulo.*SP/i)).toBeInTheDocument()
    expect(screen.getByText(/Curitiba.*PR/i)).toBeInTheDocument()
  })

  it('exibe estado vazio quando não há trabalhos', () => {
    render(<MemoryRouter><MachineJobHistory jobs={[]} loading={false} /></MemoryRouter>)
    expect(screen.getByText(/nenhum trabalho/i)).toBeInTheDocument()
  })

  it('exibe skeleton loader enquanto carrega', () => {
    render(<MemoryRouter><MachineJobHistory jobs={[]} loading={true} /></MemoryRouter>)
    expect(document.querySelector('.animate-pulse')).toBeInTheDocument()
  })

  it('exibe badge do tipo de trabalho', () => {
    render(<MemoryRouter><MachineJobHistory jobs={mockJobs} loading={false} /></MemoryRouter>)
    expect(screen.getByText(/manutenção/i)).toBeInTheDocument()
    expect(screen.getByText(/implementação/i)).toBeInTheDocument()
  })

  it('navega para /jobs/:id ao clicar na row', () => {
    const navigate = jest.fn()
    ;(useNavigate as jest.Mock).mockReturnValue(navigate)

    const jobs = [{
      id: 'job-42',
      employeeName: 'Pedro Costa',
      scheduledDate: '2024-02-10',
      city: 'Bauru',
      state: 'SP',
      jobType: 'maintenance' as const,
      status: 'completed',
    }]

    render(<MemoryRouter><MachineJobHistory jobs={jobs} loading={false} /></MemoryRouter>)
    fireEvent.click(screen.getByText('Pedro Costa'))
    expect(navigate).toHaveBeenCalledWith('/jobs/job-42')
  })
})
