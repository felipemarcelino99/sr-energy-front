import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { JobStepper } from '@/views/components/JobStepper'

const employees = [{ id: 'emp-1', name: 'Ana Silva' }]
const machines = [{ id: 'mach-1', name: 'Torno CNC' }]

describe('JobStepper', () => {
  it('não avança da etapa 1 se campos estão vazios', async () => {
    render(<JobStepper employees={employees} machines={machines} onSubmit={jest.fn()} />)
    fireEvent.change(screen.getByLabelText('Data'), { target: { value: '' } })
    fireEvent.click(screen.getByRole('button', { name: /próximo/i }))
    await waitFor(() => {
      expect(screen.getByTestId('error-scheduledDate')).toBeInTheDocument()
    })
  })

  it('não avança da etapa 1 sem selecionar ao menos um colaborador', async () => {
    render(<JobStepper employees={employees} machines={machines} onSubmit={jest.fn()} />)
    fireEvent.change(screen.getByLabelText('Data'), { target: { value: '2025-06-01' } })
    fireEvent.click(screen.getByRole('button', { name: /próximo/i }))
    await waitFor(() => {
      expect(screen.getByTestId('error-employeeIds')).toBeInTheDocument()
    })
  })

  it('não mostra select duplicado de funcionário único (item 3 do sub-plano 04)', () => {
    render(<JobStepper employees={employees} machines={machines} onSubmit={jest.fn()} />)
    expect(screen.queryByLabelText(/^funcionário$/i)).not.toBeInTheDocument()
  })

  it('avança para etapa 2 com dados válidos na etapa 1', async () => {
    render(<JobStepper employees={employees} machines={machines} onSubmit={jest.fn()} />)

    fireEvent.click(screen.getByLabelText('Ana Silva'))
    fireEvent.change(screen.getByLabelText('Data'), { target: { value: '2025-06-01' } })
    fireEvent.click(screen.getByRole('button', { name: /próximo/i }))

    await waitFor(() => {
      expect(screen.getByLabelText(/cidade/i)).toBeInTheDocument()
    })
  })

  it('exibe revisão na etapa 4 com todos os dados preenchidos, sem descrição', async () => {
    render(<JobStepper employees={employees} machines={machines} onSubmit={jest.fn()} />)

    // Step 1 — Colaboradores
    fireEvent.click(screen.getByLabelText('Ana Silva'))
    fireEvent.change(screen.getByLabelText('Data'), { target: { value: '2025-06-01' } })
    fireEvent.click(screen.getByRole('button', { name: /próximo/i }))

    // Step 2 — Local
    await waitFor(() => screen.getByLabelText(/cidade/i))
    fireEvent.change(screen.getByLabelText(/cidade/i), { target: { value: 'São Paulo' } })
    fireEvent.change(screen.getByLabelText(/estado/i), { target: { value: 'SP' } })
    fireEvent.change(screen.getByLabelText(/início/i), { target: { value: '08:00' } })
    fireEvent.change(screen.getByLabelText(/término/i), { target: { value: '17:00' } })
    fireEvent.click(screen.getByRole('button', { name: /próximo/i }))

    // Step 3 — Equipamentos (renomeado, sem campo Descrição)
    await waitFor(() => screen.getByLabelText(/equipamento/i))
    expect(screen.queryByLabelText(/descrição/i)).not.toBeInTheDocument()
    fireEvent.change(screen.getByLabelText(/equipamento/i), { target: { value: 'mach-1' } })
    fireEvent.change(screen.getByLabelText(/tipo de os/i), { target: { value: 'commissioning' } })
    fireEvent.click(screen.getByRole('button', { name: /próximo/i }))

    // Step 4 — review
    await waitFor(() => {
      expect(screen.getByTestId('review-step')).toBeInTheDocument()
      expect(screen.getByText('01/06/2025')).toBeInTheDocument()
      expect(screen.getByText('São Paulo')).toBeInTheDocument()
      expect(screen.getByText('Comissionamento')).toBeInTheDocument()
    })
  })

  it('envia contractId no submit quando presente nos dados iniciais (item 3)', async () => {
    const onSubmit = jest.fn().mockResolvedValue(undefined)
    render(
      <JobStepper
        employees={employees}
        machines={machines}
        onSubmit={onSubmit}
        initialData={{ contractId: 'contract-1' }}
      />
    )

    fireEvent.click(screen.getByLabelText('Ana Silva'))
    fireEvent.change(screen.getByLabelText('Data'), { target: { value: '2025-06-01' } })
    fireEvent.click(screen.getByRole('button', { name: /próximo/i }))

    await waitFor(() => screen.getByLabelText(/cidade/i))
    fireEvent.change(screen.getByLabelText(/cidade/i), { target: { value: 'São Paulo' } })
    fireEvent.change(screen.getByLabelText(/estado/i), { target: { value: 'SP' } })
    fireEvent.change(screen.getByLabelText(/início/i), { target: { value: '08:00' } })
    fireEvent.change(screen.getByLabelText(/término/i), { target: { value: '17:00' } })
    fireEvent.click(screen.getByRole('button', { name: /próximo/i }))

    await waitFor(() => screen.getByLabelText(/equipamento/i))
    fireEvent.change(screen.getByLabelText(/equipamento/i), { target: { value: 'mach-1' } })
    fireEvent.change(screen.getByLabelText(/tipo de os/i), { target: { value: 'commissioning' } })
    fireEvent.click(screen.getByRole('button', { name: /próximo/i }))

    await waitFor(() => screen.getByTestId('review-step'))
    fireEvent.click(screen.getByText('Confirmar'))

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ contractId: 'contract-1' }))
    })
  })
})

const noop = jest.fn()

describe('JobStepper — navegação por click nos steps', () => {
  it('permite clicar em step anterior para voltar (após avançar)', async () => {
    render(<JobStepper employees={employees} machines={machines} onSubmit={noop} />)

    fireEvent.click(screen.getByLabelText('Ana Silva'))
    fireEvent.change(screen.getByLabelText('Data'), { target: { value: '2024-06-01' } })
    fireEvent.click(screen.getByRole('button', { name: /próximo/i }))

    await waitFor(() => screen.getByLabelText(/cidade/i))
    fireEvent.click(screen.getByTestId('step-indicator-1'))
    expect(screen.getByLabelText('Ana Silva')).toBeInTheDocument()
  })

  it('não permite clicar em step futuro sem completar o atual', () => {
    render(<JobStepper employees={employees} machines={machines} onSubmit={noop} />)
    fireEvent.click(screen.getByTestId('step-indicator-2'))
    expect(screen.getByLabelText('Ana Silva')).toBeInTheDocument()
  })
})

it('exibe todos os colaboradores selecionados (não IDs) no step de revisão', async () => {
  const twoEmployees = [
    { id: 'e1', name: 'Maria Souza' },
    { id: 'e2', name: 'João Pereira' },
  ]
  render(
    <JobStepper
      employees={twoEmployees}
      machines={[{ id: 'm1', name: 'Inversor A' }]}
      onSubmit={noop}
    />
  )

  // Step 1 — Colaboradores (multi)
  fireEvent.click(screen.getByLabelText('Maria Souza'))
  fireEvent.click(screen.getByLabelText('João Pereira'))
  fireEvent.change(screen.getByLabelText('Data'), { target: { value: '2024-06-01' } })
  fireEvent.click(screen.getByText('Próximo'))

  // Step 2
  await waitFor(() => screen.getByLabelText(/cidade/i))
  fireEvent.change(screen.getByLabelText(/cidade/i), { target: { value: 'SP' } })
  fireEvent.change(screen.getByLabelText(/estado/i), { target: { value: 'SP' } })
  fireEvent.change(screen.getByLabelText(/início/i), { target: { value: '08:00' } })
  fireEvent.change(screen.getByLabelText(/término/i), { target: { value: '17:00' } })
  fireEvent.click(screen.getByText('Próximo'))

  // Step 3
  await waitFor(() => screen.getByLabelText(/equipamento/i))
  fireEvent.change(screen.getByLabelText(/equipamento/i), { target: { value: 'm1' } })
  fireEvent.change(screen.getByLabelText(/tipo de os/i), { target: { value: 'development' } })
  fireEvent.click(screen.getByText('Próximo'))

  // Step de revisão
  await waitFor(() => screen.getByTestId('review-step'))
  expect(screen.getByTestId('review-step')).toHaveTextContent('Maria Souza')
  expect(screen.getByTestId('review-step')).toHaveTextContent('João Pereira')
  expect(screen.getByTestId('review-step')).toHaveTextContent('Inversor A')
  expect(screen.getByTestId('review-step')).not.toHaveTextContent('e1')
  expect(screen.getByTestId('review-step')).not.toHaveTextContent('m1')
})
