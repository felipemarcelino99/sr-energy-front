import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { JobStepper } from '@/views/components/JobStepper'

const employees = [{ id: 'emp-1', name: 'Ana Silva' }]
const machines = [{ id: 'mach-1', name: 'Torno CNC' }]

describe('JobStepper', () => {
  it('não avança da etapa 1 se campos estão vazios', async () => {
    render(<JobStepper employees={employees} machines={machines} onSubmit={jest.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: /próximo/i }))
    await waitFor(() => {
      expect(screen.getByTestId('error-employeeId')).toBeInTheDocument()
    })
  })

  it('avança para etapa 2 com dados válidos na etapa 1', async () => {
    render(<JobStepper employees={employees} machines={machines} onSubmit={jest.fn()} />)

    fireEvent.change(screen.getByLabelText(/funcionário/i), { target: { value: 'emp-1' } })
    fireEvent.change(screen.getByLabelText(/data/i), { target: { value: '2025-06-01' } })
    fireEvent.click(screen.getByRole('button', { name: /próximo/i }))

    await waitFor(() => {
      expect(screen.getByLabelText(/cidade/i)).toBeInTheDocument()
    })
  })

  it('exibe revisão na etapa 4 com todos os dados preenchidos', async () => {
    render(<JobStepper employees={employees} machines={machines} onSubmit={jest.fn()} />)

    // Step 1
    fireEvent.change(screen.getByLabelText(/funcionário/i), { target: { value: 'emp-1' } })
    fireEvent.change(screen.getByLabelText(/data/i), { target: { value: '2025-06-01' } })
    fireEvent.click(screen.getByRole('button', { name: /próximo/i }))

    // Step 2
    await waitFor(() => screen.getByLabelText(/cidade/i))
    fireEvent.change(screen.getByLabelText(/cidade/i), { target: { value: 'São Paulo' } })
    fireEvent.change(screen.getByLabelText(/estado/i), { target: { value: 'SP' } })
    fireEvent.change(screen.getByLabelText(/início/i), { target: { value: '08:00' } })
    fireEvent.change(screen.getByLabelText(/término/i), { target: { value: '17:00' } })
    fireEvent.click(screen.getByRole('button', { name: /próximo/i }))

    // Step 3
    await waitFor(() => screen.getByLabelText(/máquina/i))
    fireEvent.change(screen.getByLabelText(/máquina/i), { target: { value: 'mach-1' } })
    fireEvent.change(screen.getByLabelText(/descrição/i), { target: { value: 'Revisão geral' } })
    fireEvent.click(screen.getByRole('button', { name: /próximo/i }))

    // Step 4 — review
    await waitFor(() => {
      expect(screen.getByTestId('review-step')).toBeInTheDocument()
      expect(screen.getByText('01/06/2025')).toBeInTheDocument()
      expect(screen.getByText('São Paulo')).toBeInTheDocument()
    })
  })
})
