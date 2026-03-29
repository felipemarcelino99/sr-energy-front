import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { DayDetailPanel } from '@/views/components/DayDetailPanel'
import type { CalendarEntry } from '@/models/schedule.model'

const jobEntry: CalendarEntry = {
  kind: 'job',
  data: {
    id: 'j1',
    description: 'Manutenção Turbina',
    jobType: 'maintenance',
    status: 'scheduled',
    scheduledDate: '2026-03-15',
    city: 'Curitiba',
    state: 'PR',
    startTime: '08:00',
    endTime: '12:00',
    employeeId: 'e1',
    employeeName: 'Ana Silva',
    accommodation: false,
    car: true,
    machineId: 'm1',
  } as any,
}

const eventEntry: CalendarEntry = {
  kind: 'event',
  data: {
    id: 'ev1',
    type: 'vacation',
    status: 'active',
    employeeIds: ['e1'],
    employeeNames: ['Ana Silva'],
    startDate: '2026-03-10',
    endDate: '2026-03-14',
    notes: '',
    createdAt: '2026-03-01T00:00:00Z',
    updatedAt: '2026-03-01T00:00:00Z',
  },
}

function renderPanel(entries: CalendarEntry[], readOnly = false) {
  return render(
    <MemoryRouter>
      <DayDetailPanel
        date="2026-03-15"
        entries={entries}
        readOnly={readOnly}
        onJobEdit={jest.fn()}
        onJobCancel={jest.fn()}
        onEventCancel={jest.fn()}
      />
    </MemoryRouter>
  )
}

describe('DayDetailPanel — readOnly=false (default)', () => {
  it('exibe botão Editar para job não cancelado', () => {
    renderPanel([jobEntry], false)
    expect(screen.getByRole('button', { name: /editar/i })).toBeInTheDocument()
  })

  it('exibe botão Cancelar para job não cancelado', () => {
    renderPanel([jobEntry], false)
    expect(screen.getByRole('button', { name: /cancelar/i })).toBeInTheDocument()
  })

  it('exibe botão Cancelar para evento', () => {
    renderPanel([eventEntry], false)
    expect(screen.getByRole('button', { name: /cancelar/i })).toBeInTheDocument()
  })
})

describe('DayDetailPanel — readOnly=true', () => {
  it('exibe link "Ver detalhes" para job', () => {
    renderPanel([jobEntry], true)
    const link = screen.getByRole('link', { name: /ver detalhes/i })
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute('href', '/my-jobs/j1')
  })

  it('não exibe botão Editar quando readOnly', () => {
    renderPanel([jobEntry], true)
    expect(screen.queryByRole('button', { name: /editar/i })).not.toBeInTheDocument()
  })

  it('não exibe botão Cancelar para job quando readOnly', () => {
    renderPanel([jobEntry], true)
    expect(screen.queryByRole('button', { name: /cancelar/i })).not.toBeInTheDocument()
  })

  it('não exibe botão Cancelar para evento quando readOnly', () => {
    renderPanel([eventEntry], true)
    expect(screen.queryByRole('button', { name: /cancelar/i })).not.toBeInTheDocument()
  })

  it('exibe detalhes do evento normalmente quando readOnly', () => {
    renderPanel([eventEntry], true)
    expect(screen.getByText('Ana Silva')).toBeInTheDocument()
  })
})

describe('DayDetailPanel — sem entradas', () => {
  it('não renderiza nada quando entries está vazio', () => {
    const { container } = renderPanel([], false)
    expect(container).toBeEmptyDOMElement()
  })
})
