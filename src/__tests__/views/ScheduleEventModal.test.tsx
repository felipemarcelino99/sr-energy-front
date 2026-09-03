import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ScheduleEventModal } from '@/views/components/ScheduleEventModal'
import { useScheduleStore } from '@/viewmodels/schedule.viewmodel'
import type { Employee } from '@/models/employee.model'

jest.mock('@/viewmodels/schedule.viewmodel')

const employees: Employee[] = [
  { id: 'e1', name: 'Ana Silva' } as Employee,
  { id: 'e2', name: 'Bruno Costa' } as Employee,
]

const create = jest.fn()

beforeEach(() => {
  jest.clearAllMocks()
  ;(useScheduleStore as unknown as jest.Mock).mockReturnValue({ create })
})

it('não renderiza nada quando open=false', () => {
  const { container } = render(
    <ScheduleEventModal open={false} initialDate={null} employees={employees} onClose={jest.fn()} />
  )
  expect(container).toBeEmptyDOMElement()
})

it('renderiza o formulário com a data inicial pré-preenchida quando open=true', () => {
  render(
    <ScheduleEventModal open initialDate="2026-03-15" employees={employees} onClose={jest.fn()} />
  )
  expect(screen.getByText('Novo Evento')).toBeInTheDocument()
  const dateInputs = document.querySelectorAll('input[type="date"]')
  expect(dateInputs).toHaveLength(2)
  expect(dateInputs[0]).toHaveValue('2026-03-15')
  expect(dateInputs[1]).toHaveValue('2026-03-15')
})

it('exibe mensagem quando não há funcionários disponíveis', () => {
  render(<ScheduleEventModal open initialDate={null} employees={[]} onClose={jest.fn()} />)
  expect(screen.getByText(/nenhum funcionário disponível/i)).toBeInTheDocument()
})

it('exibe erro de validação ao submeter sem selecionar funcionário', async () => {
  render(
    <ScheduleEventModal open initialDate="2026-03-15" employees={employees} onClose={jest.fn()} />
  )
  fireEvent.click(screen.getByRole('button', { name: /salvar/i }))
  await waitFor(() => {
    expect(screen.getByText(/selecione ao menos um funcionário/i)).toBeInTheDocument()
  })
  expect(create).not.toHaveBeenCalled()
})

it('submete com sucesso ao preencher funcionário e datas válidas, chamando create e onClose', async () => {
  create.mockResolvedValue(undefined)
  const onClose = jest.fn()
  render(
    <ScheduleEventModal open initialDate="2026-03-15" employees={employees} onClose={onClose} />
  )

  fireEvent.click(screen.getByText('Ana Silva'))
  fireEvent.click(screen.getByRole('button', { name: /salvar/i }))

  await waitFor(() => {
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'day_off',
        employeeIds: ['e1'],
        startDate: '2026-03-15',
        endDate: '2026-03-15',
        employeeNames: ['Ana Silva'],
      })
    )
  })
  expect(onClose).toHaveBeenCalled()
})

it('permite desmarcar um funcionário já selecionado', () => {
  render(
    <ScheduleEventModal open initialDate="2026-03-15" employees={employees} onClose={jest.fn()} />
  )
  const checkbox = screen.getByLabelText('Ana Silva') as HTMLInputElement
  fireEvent.click(checkbox)
  expect(checkbox.checked).toBe(true)
  fireEvent.click(checkbox)
  expect(checkbox.checked).toBe(false)
})

it('permite editar datas de início/término e observações', () => {
  render(
    <ScheduleEventModal open initialDate="2026-03-15" employees={employees} onClose={jest.fn()} />
  )
  const dateInputs = document.querySelectorAll('input[type="date"]')
  fireEvent.change(dateInputs[0], { target: { value: '2026-04-01' } })
  fireEvent.change(dateInputs[1], { target: { value: '2026-04-05' } })
  const notes = document.querySelector('textarea') as HTMLTextAreaElement
  fireEvent.change(notes, { target: { value: 'Observação de teste' } })
  expect(dateInputs[0]).toHaveValue('2026-04-01')
  expect(dateInputs[1]).toHaveValue('2026-04-05')
  expect(notes).toHaveValue('Observação de teste')
})

it('permite alternar o tipo de evento via select', () => {
  render(
    <ScheduleEventModal open initialDate="2026-03-15" employees={employees} onClose={jest.fn()} />
  )
  const select = screen.getByDisplayValue('Folga')
  fireEvent.change(select, { target: { value: 'vacation' } })
  expect(screen.getByDisplayValue('Férias')).toBeInTheDocument()
})

it('fecha ao clicar no botão de fechar (X) e reseta o form', () => {
  const onClose = jest.fn()
  render(
    <ScheduleEventModal open initialDate="2026-03-15" employees={employees} onClose={onClose} />
  )
  fireEvent.click(screen.getByLabelText('Fechar'))
  expect(onClose).toHaveBeenCalled()
})

it('fecha ao clicar em Cancelar', () => {
  const onClose = jest.fn()
  render(
    <ScheduleEventModal open initialDate="2026-03-15" employees={employees} onClose={onClose} />
  )
  fireEvent.click(screen.getByRole('button', { name: /cancelar/i }))
  expect(onClose).toHaveBeenCalled()
})
