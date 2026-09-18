import { render, screen } from '@testing-library/react'
import { CalendarLegend } from '@/views/components/CalendarLegend'
import { EventChip } from '@/views/components/EventChip'
import { getEmployeeColor } from '@/utils/employee-color'
import type { CalendarJobEmployee, CalendarEntry, CalendarJob } from '@/models/schedule.model'

const employees: CalendarJobEmployee[] = [
  { id: 'emp-1', name: 'Ana Silva', color: '#2563eb', photoUrl: null },
  { id: 'emp-2', name: 'Bruno Costa', color: null, photoUrl: null },
]

it('sempre mostra OS e os 4 tipos de evento', () => {
  render(<CalendarLegend employees={[]} />)
  expect(screen.getByText('OS')).toBeInTheDocument()
  expect(screen.getByText('Folga')).toBeInTheDocument()
  expect(screen.getByText('Férias')).toBeInTheDocument()
  expect(screen.getByText('Treinamento')).toBeInTheDocument()
  expect(screen.getByText('Afastamento médico')).toBeInTheDocument()
})

it('não mostra a seção de colaboradores quando a lista está vazia', () => {
  const { container } = render(<CalendarLegend employees={[]} />)
  expect(container.querySelectorAll('.rounded-full').length).toBe(0)
})

it('mostra um item por colaborador recebido, com a cor cadastrada', () => {
  render(<CalendarLegend employees={employees} />)
  expect(screen.getByText('Ana Silva')).toBeInTheDocument()
  expect(screen.getByText('Bruno Costa')).toBeInTheDocument()
})

it('usa employee.color quando presente, e o fallback por hash quando ausente', () => {
  const { container } = render(<CalendarLegend employees={employees} />)
  const swatches = container.querySelectorAll('.rounded-full')
  expect(swatches).toHaveLength(2)
  expect(swatches[0]).toHaveStyle({ backgroundColor: '#2563eb' })
  expect(swatches[1]).toHaveStyle({ backgroundColor: getEmployeeColor({ id: 'emp-2' }) })
})

describe('passo 6 — consistência de cor entre chip, legenda e cadastro', () => {
  it('a cor do chip de uma OS é exatamente a cor do mesmo colaborador na legenda', () => {
    const primary = employees[0] // { id: 'emp-1', color: '#2563eb', ... } — "cadastrada"
    const job: CalendarJob = {
      id: 'job-1',
      number: 'AA001',
      status: 'scheduled',
      jobType: 'commissioning',
      scheduledDate: '2026-04-01',
      scheduledEndDate: null,
      startTime: '08:00',
      endTime: '17:00',
      city: 'São Paulo',
      state: 'SP',
      clientName: null,
      employees: [primary],
    }
    const entry: CalendarEntry = { kind: 'job', data: job }

    render(
      <>
        <CalendarLegend employees={employees} />
        <EventChip entry={entry} employeeColors={new Map()} />
      </>
    )

    const legendSwatch = screen
      .getAllByText('Ana Silva')[0]
      .parentElement!.querySelector('.rounded-full')
    const chip = screen.getByTitle(/Comissionamento/)

    // Ambos vêm de `getEmployeeColor(primary)` — a cor cadastrada no
    // cadastro do colaborador (employee.color).
    expect(legendSwatch).toHaveStyle({ backgroundColor: getEmployeeColor(primary) })
    expect(chip).toHaveStyle({ backgroundColor: getEmployeeColor(primary) })
    expect(legendSwatch).toHaveStyle({ backgroundColor: '#2563eb' })
    expect(chip).toHaveStyle({ backgroundColor: '#2563eb' })
  })
})
