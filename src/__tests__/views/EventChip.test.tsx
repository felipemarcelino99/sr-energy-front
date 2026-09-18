import { render, screen } from '@testing-library/react'
import { EventChip } from '@/views/components/EventChip'
import { JOB_COLOR } from '@/models/schedule.model'
import { getEmployeeColor } from '@/utils/employee-color'
import type { CalendarJob, CalendarEntry } from '@/models/schedule.model'

const noColors = new Map<string, string>()

const baseJob: CalendarJob = {
  id: 'job-1',
  number: 'AA001',
  status: 'scheduled',
  jobType: 'commissioning',
  scheduledDate: '2025-06-01',
  scheduledEndDate: null,
  startTime: '08:00',
  endTime: '17:00',
  city: 'São Paulo',
  state: 'SP',
  clientName: 'Cliente X',
  employees: [{ id: 'emp-1', name: 'Ana Silva', color: '#2563eb', photoUrl: null }],
}

it('usa a cor cadastrada (employees[0].color) como cor do chip', () => {
  const entry: CalendarEntry = { kind: 'job', data: baseJob }
  render(<EventChip entry={entry} employeeColors={noColors} />)
  const chip = screen.getByTitle(/Comissionamento/)
  expect(chip).toHaveStyle({ backgroundColor: '#2563eb' })
})

it('o avatar (iniciais) exibido é sempre o de employees[0] — mesma pessoa da cor; o nome fica no title, não no texto visível (prioriza Empresa/Cidade)', () => {
  const entry: CalendarEntry = {
    kind: 'job',
    data: {
      ...baseJob,
      employees: [{ id: 'emp-9', name: 'Bruno Costa', color: '#d97706', photoUrl: null }],
    },
  }
  render(<EventChip entry={entry} employeeColors={noColors} />)
  expect(screen.getByText('BC')).toBeInTheDocument()
  expect(screen.queryByText(/Bruno Costa/)).not.toBeInTheDocument()
  expect(screen.getByTitle(/Bruno Costa/)).toHaveStyle({ backgroundColor: '#d97706' })
})

it('o texto visível prioriza Cliente · Cidade/UF, sem o nome do colaborador', () => {
  const entry: CalendarEntry = { kind: 'job', data: baseJob }
  render(<EventChip entry={entry} employeeColors={noColors} />)
  expect(screen.getByText('Cliente X · São Paulo/SP')).toBeInTheDocument()
})

it('cai no tipo de OS quando não há cliente vinculado', () => {
  const entry: CalendarEntry = { kind: 'job', data: { ...baseJob, clientName: null } }
  render(<EventChip entry={entry} employeeColors={noColors} />)
  expect(screen.getByText('Comissionamento · São Paulo/SP')).toBeInTheDocument()
})

it('cai no fallback por hash (JOB_COLOR diferente) quando o colaborador não tem cor cadastrada', () => {
  const entry: CalendarEntry = {
    kind: 'job',
    data: {
      ...baseJob,
      employees: [{ id: 'emp-1', name: 'Ana Silva', color: null, photoUrl: null }],
    },
  }
  render(<EventChip entry={entry} employeeColors={noColors} />)
  const chip = screen.getByTitle(/Comissionamento/)
  const expectedColor = getEmployeeColor({ id: 'emp-1' })
  expect(chip).toHaveStyle({ backgroundColor: expectedColor })
})

it('usa JOB_COLOR quando não há nenhum colaborador (não deveria ocorrer, mas não quebra)', () => {
  const entry: CalendarEntry = { kind: 'job', data: { ...baseJob, employees: [] } }
  render(<EventChip entry={entry} employeeColors={noColors} />)
  const chip = screen.getByTitle(/Comissionamento/)
  expect(chip).toHaveStyle({ backgroundColor: JOB_COLOR })
})

it('indica múltiplos colaboradores com o badge +N', () => {
  const entry: CalendarEntry = {
    kind: 'job',
    data: {
      ...baseJob,
      employees: [
        { id: 'emp-1', name: 'Ana Silva', color: '#2563eb', photoUrl: null },
        { id: 'emp-2', name: 'Bruno Costa', color: '#d97706', photoUrl: null },
        { id: 'emp-3', name: 'Carla Dias', color: '#059669', photoUrl: null },
      ],
    },
  }
  render(<EventChip entry={entry} employeeColors={noColors} />)
  expect(screen.getByText('+2')).toBeInTheDocument()
})

it('não mostra badge de múltiplos quando há só um colaborador', () => {
  const entry: CalendarEntry = { kind: 'job', data: baseJob }
  render(<EventChip entry={entry} employeeColors={noColors} />)
  expect(screen.queryByText(/^\+\d/)).not.toBeInTheDocument()
})

it('indica OS de múltiplos dias com o marcador "⋯" e o intervalo no title', () => {
  const entry: CalendarEntry = {
    kind: 'job',
    data: { ...baseJob, scheduledDate: '2025-06-01', scheduledEndDate: '2025-06-03' },
  }
  render(<EventChip entry={entry} employeeColors={noColors} />)
  expect(screen.getByTitle(/2025-06-01 a 2025-06-03/)).toBeInTheDocument()
})

function makeEventEntry(overrides: Partial<CalendarEntry['data']> = {}): CalendarEntry {
  return {
    kind: 'event',
    data: {
      id: 'ev1',
      type: 'vacation',
      employeeIds: ['emp-1'],
      employeeNames: ['Ana Silva'],
      startDate: '2026-01-01',
      endDate: '2026-01-05',
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
      ...overrides,
    },
  } as CalendarEntry
}

it('renderiza um evento de agenda (não-job) com o rótulo do tipo e o nome do funcionário', () => {
  render(<EventChip entry={makeEventEntry()} employeeColors={noColors} />)
  expect(screen.getByText('Férias — Ana Silva')).toBeInTheDocument()
})

it('usa a cor do funcionário (não uma cor fixa por tipo) no evento', () => {
  const employeeColors = new Map([['emp-1', '#d97706']])
  const { container } = render(
    <EventChip entry={makeEventEntry()} employeeColors={employeeColors} />
  )
  const chip = container.querySelector('[title]') as HTMLElement
  expect(chip).toHaveStyle({ backgroundColor: '#d97706' })
})

it('dois tipos diferentes do mesmo funcionário saem com a mesma cor', () => {
  const employeeColors = new Map([['emp-1', '#d97706']])
  const vacation = render(
    <EventChip entry={makeEventEntry({ type: 'vacation' })} employeeColors={employeeColors} />
  )
  const dayOff = render(
    <EventChip entry={makeEventEntry({ type: 'day_off' })} employeeColors={employeeColors} />
  )
  const vacationChip = vacation.container.querySelector('[title]') as HTMLElement
  const dayOffChip = dayOff.container.querySelector('[title]') as HTMLElement
  expect(vacationChip.style.backgroundColor).toBe(dayOffChip.style.backgroundColor)
})

it('cai no fallback por hash quando o funcionário do evento não está no índice de cores', () => {
  const { container } = render(<EventChip entry={makeEventEntry()} employeeColors={noColors} />)
  const chip = container.querySelector('[title]') as HTMLElement
  const expectedColor = getEmployeeColor({ id: 'emp-1' })
  expect(chip).toHaveStyle({ backgroundColor: expectedColor })
})
