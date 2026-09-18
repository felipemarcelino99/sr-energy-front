import { render, screen, fireEvent } from '@testing-library/react'
import { CalendarWeekView } from '@/views/components/CalendarWeekView'
import type { CalendarEntry, CalendarJob } from '@/models/schedule.model'

function makeJobEntry(id: string): CalendarEntry {
  const job: CalendarJob = {
    id,
    number: `AA${id}`,
    status: 'scheduled',
    jobType: 'commissioning',
    scheduledDate: '2026-04-15',
    scheduledEndDate: null,
    startTime: '08:00',
    endTime: '17:00',
    city: 'São Paulo',
    state: 'SP',
    clientName: 'Cliente X',
    employees: [{ id: 'e1', name: 'Ana Silva', color: '#2563eb', photoUrl: null }],
  }
  return { kind: 'job', data: job }
}

function baseProps(overrides: Partial<React.ComponentProps<typeof CalendarWeekView>> = {}) {
  return {
    anchor: new Date(2026, 3, 15), // quarta-feira — semana de 12 a 18/04/2026
    groupedEntries: new Map<string, CalendarEntry[]>(),
    employeeColors: new Map<string, string>(),
    selectedDate: null,
    onSelectDate: jest.fn(),
    ...overrides,
  }
}

it('renderiza exatamente 7 colunas, uma por dia da semana (dom a sáb)', () => {
  render(<CalendarWeekView {...baseProps()} />)
  ;[12, 13, 14, 15, 16, 17, 18].forEach((d) => {
    expect(screen.getByRole('button', { name: `Selecionar dia ${d}` })).toBeInTheDocument()
  })
})

it('mostra os cabeçalhos de dia da semana', () => {
  render(<CalendarWeekView {...baseProps()} />)
  ;['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].forEach((w) => {
    expect(screen.getByText(w)).toBeInTheDocument()
  })
})

it('repassa os chips do dia correto dentro da semana', () => {
  const groupedEntries = new Map<string, CalendarEntry[]>([
    ['2026-04-15', [makeJobEntry('1'), makeJobEntry('2')]],
  ])
  const { container } = render(<CalendarWeekView {...baseProps({ groupedEntries })} />)
  expect(container.querySelectorAll('[title]')).toHaveLength(2)
})

it('chama onSelectDate ao clicar em um dia da semana', () => {
  const onSelectDate = jest.fn()
  render(<CalendarWeekView {...baseProps({ onSelectDate })} />)
  fireEvent.click(screen.getByRole('button', { name: 'Selecionar dia 16' }))
  expect(onSelectDate).toHaveBeenCalledWith('2026-04-16')
})

it('nenhum dia fica esmaecido (todos pertencem à semana ativa)', () => {
  const { container } = render(<CalendarWeekView {...baseProps()} />)
  expect(container.querySelectorAll('.opacity-30')).toHaveLength(0)
})
