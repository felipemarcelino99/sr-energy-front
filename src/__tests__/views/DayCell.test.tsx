import { render, screen, fireEvent } from '@testing-library/react'
import { DayCell } from '@/views/components/DayCell'
import type { CalendarEntry, CalendarJob } from '@/models/schedule.model'

function makeJobEntry(id: string, employeeName = 'Ana Silva'): CalendarEntry {
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
    employees: [{ id: 'e1', name: employeeName, color: '#2563eb', photoUrl: null }],
  }
  return { kind: 'job', data: job }
}

function baseProps(overrides: Partial<React.ComponentProps<typeof DayCell>> = {}) {
  return {
    date: '2026-04-10',
    dayNumber: 10,
    isToday: false,
    isCurrentMonth: true,
    isSelected: false,
    entries: [],
    employeeColors: new Map<string, string>(),
    onClick: jest.fn(),
    ...overrides,
  }
}

it('mostra o número do dia', () => {
  render(<DayCell {...baseProps()} />)
  expect(screen.getByText('10')).toBeInTheDocument()
})

it('marca o dia de hoje com ●', () => {
  render(<DayCell {...baseProps({ isToday: true })} />)
  expect(screen.getByText(/10\s*●/)).toBeInTheDocument()
})

it('chama onClick com a data ao clicar', () => {
  const onClick = jest.fn()
  render(<DayCell {...baseProps({ onClick })} />)
  fireEvent.click(screen.getByRole('button', { name: /selecionar dia 10/i }))
  expect(onClick).toHaveBeenCalledWith('2026-04-10')
})

it('chama onDoubleClick com a data ao dar duplo clique', () => {
  const onDoubleClick = jest.fn()
  render(<DayCell {...baseProps({ onDoubleClick })} />)
  fireEvent.doubleClick(screen.getByRole('button', { name: /selecionar dia 10/i }))
  expect(onDoubleClick).toHaveBeenCalledWith('2026-04-10')
})

it('dias fora do mês corrente ficam sem interação (tabIndex -1, pointer-events-none)', () => {
  render(<DayCell {...baseProps({ isCurrentMonth: false })} />)
  const cell = screen.getByRole('button', { name: /selecionar dia 10/i })
  expect(cell).toHaveAttribute('tabIndex', '-1')
  expect(cell.className).toContain('pointer-events-none')
})

describe('passo 4 — sem scroll interno, renderiza todos os itens', () => {
  it('renderiza as 8 entradas do dia sem classe de overflow', () => {
    const entries = Array.from({ length: 8 }, (_, i) => makeJobEntry(String(i)))
    const { container } = render(<DayCell {...baseProps({ entries })} />)

    // todas as 8 OS aparecem (cada uma com o mesmo colaborador/título aqui)
    expect(container.querySelectorAll('[title]')).toHaveLength(8)

    // nenhum elemento da célula tem overflow-y-auto/overflow-hidden — quem
    // controla o crescimento é o grid pai (grid-auto-rows: minmax(..., auto))
    const overflowing = container.querySelectorAll('.overflow-y-auto, .overflow-hidden')
    expect(overflowing).toHaveLength(0)
  })
})
