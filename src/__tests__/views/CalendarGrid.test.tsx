import { render, screen, fireEvent } from '@testing-library/react'
import { CalendarGrid } from '@/views/components/CalendarGrid'
import type { CalendarEntry, CalendarJob } from '@/models/schedule.model'

function makeJobEntry(id: string): CalendarEntry {
  const job: CalendarJob = {
    id,
    number: `AA${id}`,
    status: 'scheduled',
    jobType: 'commissioning',
    scheduledDate: '2026-04-10',
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

function baseProps(overrides: Partial<React.ComponentProps<typeof CalendarGrid>> = {}) {
  return {
    year: 2026,
    month: 4, // abril/2026 — começa numa quarta-feira, 30 dias
    groupedEntries: new Map<string, CalendarEntry[]>(),
    employeeColors: new Map<string, string>(),
    selectedDate: null,
    onSelectDate: jest.fn(),
    ...overrides,
  }
}

it('mostra os 7 cabeçalhos de dia da semana', () => {
  render(<CalendarGrid {...baseProps()} />)
  ;['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].forEach((w) => {
    expect(screen.getByText(w)).toBeInTheDocument()
  })
})

it('renderiza uma célula para cada dia do mês (mais o preenchimento de dias adjacentes)', () => {
  render(<CalendarGrid {...baseProps()} />)
  // abril/2026 tem 30 dias, começando numa quarta (3 dias de preenchimento
  // de março antes — 29 a 31 —, 2 de maio depois — 1 e 2). O teste evita
  // essas bordas, que colidem no aria-label (não inclui o mês).
  for (let d = 3; d <= 28; d++) {
    expect(screen.getByRole('button', { name: `Selecionar dia ${d}` })).toBeInTheDocument()
  }
})

it('usa grid-auto-rows com minmax(..., auto) — sem altura fixa por linha', () => {
  const { container } = render(<CalendarGrid {...baseProps()} />)
  const grid = container.querySelectorAll('.grid')[1] as HTMLElement // [0] é o cabeçalho, [1] é o grid de dias
  expect(grid.style.gridAutoRows).toMatch(/minmax\(.+, auto\)/)
})

it('repassa as entradas agrupadas para o dia correto', () => {
  const groupedEntries = new Map<string, CalendarEntry[]>([
    ['2026-04-10', [makeJobEntry('1'), makeJobEntry('2')]],
  ])
  const { container } = render(<CalendarGrid {...baseProps({ groupedEntries })} />)
  expect(container.querySelectorAll('[title]')).toHaveLength(2)
})

it('chama onSelectDate ao clicar em um dia', () => {
  const onSelectDate = jest.fn()
  render(<CalendarGrid {...baseProps({ onSelectDate })} />)
  fireEvent.click(screen.getByRole('button', { name: 'Selecionar dia 15' }))
  expect(onSelectDate).toHaveBeenCalledWith('2026-04-15')
})
