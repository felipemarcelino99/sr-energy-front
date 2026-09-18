import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { DayDetailPanel } from '@/views/components/DayDetailPanel'
import type { CalendarEntry, CalendarJob } from '@/models/schedule.model'

const baseJob: CalendarJob = {
  id: 'j1',
  number: 'AA001',
  status: 'scheduled',
  jobType: 'commissioning',
  scheduledDate: '2026-03-15',
  scheduledEndDate: null,
  city: 'Curitiba',
  state: 'PR',
  startTime: '08:00',
  endTime: '12:00',
  clientName: 'Cliente X',
  employees: [{ id: 'e1', name: 'Ana Silva', color: '#2563eb', photoUrl: null }],
}

const jobEntry: CalendarEntry = { kind: 'job', data: baseJob }

const eventEntry: CalendarEntry = {
  kind: 'event',
  data: {
    id: 'ev1',
    type: 'vacation',
    employeeIds: ['e1'],
    employeeNames: ['Ana Silva'],
    startDate: '2026-03-10',
    endDate: '2026-03-14',
    notes: '',
    createdAt: '2026-03-01T00:00:00Z',
    updatedAt: '2026-03-01T00:00:00Z',
  },
}

function renderPanel(
  entries: CalendarEntry[],
  readOnly = false,
  extra: { currentEmployeeId?: string } = {}
) {
  return render(
    <MemoryRouter>
      <DayDetailPanel
        date="2026-03-15"
        entries={entries}
        employeeColors={new Map()}
        readOnly={readOnly}
        currentEmployeeId={extra.currentEmployeeId}
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

  it('mostra o cliente, colaboradores e horário no corpo expandido', () => {
    renderPanel([jobEntry], false)
    expect(screen.getByText(/cliente x/i)).toBeInTheDocument()
    expect(screen.getByText(/colaboradores:/i)).toBeInTheDocument()
    expect(screen.getAllByText(/ana silva/i).length).toBeGreaterThan(0)
    expect(screen.getByText(/08:00.*12:00/)).toBeInTheDocument()
  })
})

describe('DayDetailPanel — readOnly=true, sem currentEmployeeId (comportamento antigo)', () => {
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

describe('DayDetailPanel — readOnly=true com currentEmployeeId (agenda da equipe — passo 5)', () => {
  it('mostra "Ver detalhes" quando a OS é do funcionário logado', () => {
    renderPanel([jobEntry], true, { currentEmployeeId: 'e1' })
    expect(screen.getByRole('link', { name: /ver detalhes/i })).toBeInTheDocument()
  })

  it('não mostra nenhuma ação quando a OS é de outro colaborador', () => {
    renderPanel([jobEntry], true, { currentEmployeeId: 'outro-funcionario' })
    expect(screen.queryByRole('link', { name: /ver detalhes/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('considera dono quando o funcionário logado é um dos múltiplos colaboradores', () => {
    const multiJob: CalendarEntry = {
      kind: 'job',
      data: {
        ...baseJob,
        employees: [
          { id: 'e1', name: 'Ana Silva', color: '#2563eb', photoUrl: null },
          { id: 'e2', name: 'Bruno Costa', color: '#d97706', photoUrl: null },
        ],
      },
    }
    renderPanel([multiJob], true, { currentEmployeeId: 'e2' })
    expect(screen.getByRole('link', { name: /ver detalhes/i })).toBeInTheDocument()
  })
})

describe('DayDetailPanel — sem entradas', () => {
  it('não renderiza nada quando entries está vazio', () => {
    const { container } = renderPanel([], false)
    expect(container).toBeEmptyDOMElement()
  })
})

describe('DayDetailPanel — botão de fechar', () => {
  it('não mostra botão de fechar quando onClose não é fornecido', () => {
    renderPanel([jobEntry], false)
    expect(screen.queryByLabelText(/fechar detalhes/i)).not.toBeInTheDocument()
  })

  it('mostra botão de fechar e chama onClose ao clicar, quando fornecido', () => {
    const onClose = jest.fn()
    render(
      <MemoryRouter>
        <DayDetailPanel
          date="2026-03-15"
          entries={[jobEntry]}
          employeeColors={new Map()}
          onJobEdit={jest.fn()}
          onJobCancel={jest.fn()}
          onEventCancel={jest.fn()}
          onClose={onClose}
        />
      </MemoryRouter>
    )
    fireEvent.click(screen.getByLabelText(/fechar detalhes/i))
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})

describe('DayDetailPanel — expandir/recolher', () => {
  it('recolhe e reexpande os detalhes do job ao clicar no cabeçalho', () => {
    renderPanel([jobEntry], false)
    expect(screen.getByText(/cliente:/i)).toBeInTheDocument()
    const header = screen.getAllByText(/os aa001/i)[0]
    fireEvent.click(header)
    expect(screen.queryByText(/cliente:/i)).not.toBeInTheDocument()
    fireEvent.click(screen.getAllByText(/os aa001/i)[0])
    expect(screen.getByText(/cliente:/i)).toBeInTheDocument()
  })

  it('recolhe e reexpande os detalhes do evento ao clicar no cabeçalho', () => {
    renderPanel([eventEntry], false)
    expect(screen.getByText('Ana Silva')).toBeInTheDocument()
    fireEvent.click(screen.getByText('Férias'))
    expect(screen.queryByText(/período:/i)).not.toBeInTheDocument()
  })
})

describe('DayDetailPanel — fluxo de confirmação de cancelamento (job)', () => {
  it('abre o diálogo de confirmação ao clicar em Cancelar', () => {
    renderPanel([jobEntry], false)
    fireEvent.click(screen.getByRole('button', { name: /^cancelar$/i }))
    expect(screen.getByText('Cancelar OS')).toBeInTheDocument()
  })

  it('fecha o diálogo sem cancelar ao clicar em Voltar', () => {
    renderPanel([jobEntry], false)
    fireEvent.click(screen.getByRole('button', { name: /^cancelar$/i }))
    fireEvent.click(screen.getByRole('button', { name: /voltar/i }))
    expect(screen.queryByText('Cancelar OS')).not.toBeInTheDocument()
  })

  it('chama onJobCancel ao confirmar o cancelamento', async () => {
    const onJobCancel = jest.fn().mockResolvedValue(undefined)
    render(
      <MemoryRouter>
        <DayDetailPanel
          date="2026-03-15"
          entries={[jobEntry]}
          employeeColors={new Map()}
          readOnly={false}
          onJobEdit={jest.fn()}
          onJobCancel={onJobCancel}
          onEventCancel={jest.fn()}
        />
      </MemoryRouter>
    )
    fireEvent.click(screen.getByRole('button', { name: /^cancelar$/i }))
    fireEvent.click(screen.getByRole('button', { name: /confirmar cancelamento/i }))
    await waitFor(() => {
      expect(onJobCancel).toHaveBeenCalledWith('j1')
    })
    await waitFor(() => {
      expect(screen.queryByText('Cancelar OS')).not.toBeInTheDocument()
    })
  })

  it('chama onEdit ao clicar em Editar', () => {
    const onJobEdit = jest.fn()
    render(
      <MemoryRouter>
        <DayDetailPanel
          date="2026-03-15"
          entries={[jobEntry]}
          employeeColors={new Map()}
          readOnly={false}
          onJobEdit={onJobEdit}
          onJobCancel={jest.fn()}
          onEventCancel={jest.fn()}
        />
      </MemoryRouter>
    )
    fireEvent.click(screen.getByRole('button', { name: /editar/i }))
    expect(onJobEdit).toHaveBeenCalledWith('j1')
  })

  it('não exibe botões de ação para job cancelado', () => {
    const cancelledJob: CalendarEntry = {
      kind: 'job',
      data: { ...baseJob, status: 'cancelled' },
    }
    renderPanel([cancelledJob], false)
    expect(screen.queryByRole('button', { name: /editar/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^cancelar$/i })).not.toBeInTheDocument()
  })
})

describe('DayDetailPanel — fluxo de confirmação de cancelamento (evento)', () => {
  it('abre o diálogo de confirmação ao clicar em Cancelar', () => {
    renderPanel([eventEntry], false)
    fireEvent.click(screen.getByRole('button', { name: /^cancelar$/i }))
    expect(screen.getByText('Cancelar evento')).toBeInTheDocument()
  })

  it('fecha o diálogo sem cancelar ao clicar em Voltar', () => {
    renderPanel([eventEntry], false)
    fireEvent.click(screen.getByRole('button', { name: /^cancelar$/i }))
    fireEvent.click(screen.getByRole('button', { name: /voltar/i }))
    expect(screen.queryByText('Cancelar evento')).not.toBeInTheDocument()
  })

  it('chama onEventCancel ao confirmar o cancelamento', async () => {
    const onEventCancel = jest.fn().mockResolvedValue(undefined)
    render(
      <MemoryRouter>
        <DayDetailPanel
          date="2026-03-15"
          entries={[eventEntry]}
          employeeColors={new Map()}
          readOnly={false}
          onJobEdit={jest.fn()}
          onJobCancel={jest.fn()}
          onEventCancel={onEventCancel}
        />
      </MemoryRouter>
    )
    fireEvent.click(screen.getByRole('button', { name: /^cancelar$/i }))
    fireEvent.click(screen.getByRole('button', { name: /confirmar cancelamento/i }))
    await waitFor(() => {
      expect(onEventCancel).toHaveBeenCalledWith('ev1')
    })
  })
})
