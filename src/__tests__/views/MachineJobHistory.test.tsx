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
    expect(screen.getByText(/nenhuma os/i)).toBeInTheDocument()
  })

  it('exibe skeleton loader enquanto carrega', () => {
    render(<MemoryRouter><MachineJobHistory jobs={[]} loading={true} /></MemoryRouter>)
    expect(document.querySelector('.animate-pulse')).toBeInTheDocument()
  })

  it('exibe badge do tipo de trabalho', () => {
    render(<MemoryRouter><MachineJobHistory jobs={mockJobs} loading={false} /></MemoryRouter>)
    expect(screen.getAllByText(/manutenção/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/implementação/i).length).toBeGreaterThan(0)
  })

  it('filtra por funcionário ao digitar no campo de busca', () => {
    render(<MemoryRouter><MachineJobHistory jobs={mockJobs} loading={false} /></MemoryRouter>)
    fireEvent.change(screen.getByPlaceholderText(/funcionário/i), { target: { value: 'Carlos' } })
    expect(screen.queryByText('Ana Lima')).not.toBeInTheDocument()
    expect(screen.getByText('Carlos Melo')).toBeInTheDocument()
  })

  it('filtra por tipo ao selecionar no dropdown', () => {
    render(<MemoryRouter><MachineJobHistory jobs={mockJobs} loading={false} /></MemoryRouter>)
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'implementation' } })
    expect(screen.queryByText('Ana Lima')).not.toBeInTheDocument()
    expect(screen.getByText('Carlos Melo')).toBeInTheDocument()
  })

  it('filtra por cidade ao digitar', () => {
    const jobsWithCities = [
      { ...mockJobs[0], city: 'Curitiba' },
      { ...mockJobs[1], city: 'Florianópolis' },
    ]
    render(<MemoryRouter><MachineJobHistory jobs={jobsWithCities} loading={false} /></MemoryRouter>)
    fireEvent.change(screen.getByPlaceholderText(/cidade/i), { target: { value: 'Curitiba' } })
    expect(screen.getByText('Ana Lima')).toBeInTheDocument()
    expect(screen.queryByText('Carlos Melo')).not.toBeInTheDocument()
  })

  it('agrupa por cliente quando clientName está presente', () => {
    const jobs = [
      { ...mockJobs[0], clientName: 'Empresa Alpha' },
      { ...mockJobs[1], clientName: 'Empresa Beta' },
    ]
    render(<MemoryRouter><MachineJobHistory jobs={jobs} loading={false} /></MemoryRouter>)
    expect(screen.getByText('Empresa Alpha')).toBeInTheDocument()
    expect(screen.getByText('Empresa Beta')).toBeInTheDocument()
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
