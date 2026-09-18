import { render, screen, fireEvent } from '@testing-library/react'
import { CalendarToolbar } from '@/views/components/CalendarToolbar'
import { rangeLabel } from '@/viewmodels/schedule.viewmodel'
import type { Employee } from '@/models/employee.model'

const employees: Employee[] = [
  {
    id: 'e1',
    userId: null,
    name: 'Ana Silva',
    email: 'ana@x.com',
    phone: '11999999999',
    role: 'employee',
    color: '#2563eb',
    salary: 5000,
    hiredAt: '2024-01-01',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
]

function baseProps(overrides: Partial<React.ComponentProps<typeof CalendarToolbar>> = {}) {
  return {
    view: 'month' as const,
    anchor: new Date(2026, 3, 15), // 2026-04-15
    employees,
    employeeFilter: null,
    onViewChange: jest.fn(),
    onPrev: jest.fn(),
    onNext: jest.fn(),
    onMonthSelect: jest.fn(),
    onEmployeeFilter: jest.fn(),
    onNewEvent: jest.fn(),
    ...overrides,
  }
}

describe('rangeLabel', () => {
  it('mês: nome do mês + ano', () => {
    expect(rangeLabel('month', new Date(2026, 3, 15))).toBe('Abril 2026')
  })

  it('dia: dia + mês + ano por extenso', () => {
    expect(rangeLabel('day', new Date(2026, 3, 15))).toBe('15 de Abril de 2026')
  })

  it('semana: intervalo de domingo a sábado', () => {
    // 2026-04-15 é uma quarta; a semana vai de 12 (dom) a 18 (sáb) de abril
    expect(rangeLabel('week', new Date(2026, 3, 15))).toBe('12 – 18 abr 2026')
  })
})

describe('CalendarToolbar — visões', () => {
  it('mostra os 3 botões de visão e destaca a ativa', () => {
    render(<CalendarToolbar {...baseProps({ view: 'week' })} />)
    expect(screen.getByRole('button', { name: 'Semana' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'Dia' })).toHaveAttribute('aria-pressed', 'false')
    expect(screen.getByRole('button', { name: 'Mês' })).toHaveAttribute('aria-pressed', 'false')
  })

  it('chama onViewChange ao clicar em uma visão', () => {
    const onViewChange = jest.fn()
    render(<CalendarToolbar {...baseProps({ onViewChange })} />)
    fireEvent.click(screen.getByRole('button', { name: 'Dia' }))
    expect(onViewChange).toHaveBeenCalledWith('day')
  })
})

describe('CalendarToolbar — navegação', () => {
  it('chama onPrev/onNext', () => {
    const onPrev = jest.fn()
    const onNext = jest.fn()
    render(<CalendarToolbar {...baseProps({ onPrev, onNext })} />)
    fireEvent.click(screen.getByLabelText('Período anterior'))
    fireEvent.click(screen.getByLabelText('Próximo período'))
    expect(onPrev).toHaveBeenCalled()
    expect(onNext).toHaveBeenCalled()
  })

  it('não mostra mais o botão "Hoje" (removido — feedback do usuário: confundia)', () => {
    render(<CalendarToolbar {...baseProps()} />)
    expect(screen.queryByText('Hoje')).not.toBeInTheDocument()
  })

  it('abre o mini calendário de mês/ano ao clicar no rótulo central', () => {
    render(<CalendarToolbar {...baseProps()} />)
    expect(screen.queryByRole('button', { name: 'Jun' })).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Abril 2026' }))
    expect(screen.getByText('2026')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Jun' })).toBeInTheDocument()
    expect(screen.getByLabelText('Ano anterior')).toBeInTheDocument()
    expect(screen.getByLabelText('Próximo ano')).toBeInTheDocument()
  })

  it('chama onMonthSelect ao clicar num mês da grade, e fecha o picker', () => {
    const onMonthSelect = jest.fn()
    render(<CalendarToolbar {...baseProps({ onMonthSelect })} />)
    fireEvent.click(screen.getByRole('button', { name: 'Abril 2026' }))
    fireEvent.click(screen.getByRole('button', { name: 'Jun' }))
    expect(onMonthSelect).toHaveBeenCalledWith(2026, 6)
    expect(screen.queryByRole('button', { name: 'Jun' })).not.toBeInTheDocument()
  })

  it('navega de ano dentro do picker antes de escolher o mês', () => {
    const onMonthSelect = jest.fn()
    render(<CalendarToolbar {...baseProps({ onMonthSelect })} />)
    fireEvent.click(screen.getByRole('button', { name: 'Abril 2026' }))
    fireEvent.click(screen.getByLabelText('Próximo ano'))
    expect(screen.getByText('2027')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Abr' }))
    expect(onMonthSelect).toHaveBeenCalledWith(2027, 4)
  })

  it('sem onMonthSelect, mostra o rótulo central como texto estático (não clicável)', () => {
    render(<CalendarToolbar {...baseProps({ onMonthSelect: undefined })} />)
    expect(screen.queryByRole('button', { name: 'Abril 2026' })).not.toBeInTheDocument()
    expect(screen.getByText('Abril 2026')).toBeInTheDocument()
  })
})

describe('CalendarToolbar — readOnly', () => {
  it('esconde o filtro de funcionário e o botão de novo evento quando readOnly', () => {
    render(<CalendarToolbar {...baseProps({ readOnly: true })} />)
    expect(screen.queryByText('+ Novo Evento')).not.toBeInTheDocument()
    expect(screen.queryByText('Todos os funcionários')).not.toBeInTheDocument()
  })

  it('mostra o filtro de funcionário e o botão de novo evento quando não readOnly', () => {
    render(<CalendarToolbar {...baseProps({ readOnly: false })} />)
    expect(screen.getByText('+ Novo Evento')).toBeInTheDocument()
    expect(screen.getByText('Todos os funcionários')).toBeInTheDocument()
  })

  it('mantém o toggle de visão visível mesmo em readOnly', () => {
    render(<CalendarToolbar {...baseProps({ readOnly: true })} />)
    expect(screen.getByRole('button', { name: 'Mês' })).toBeInTheDocument()
  })
})

describe('CalendarToolbar — filtro de funcionário', () => {
  it('chama onEmployeeFilter ao selecionar um funcionário', () => {
    const onEmployeeFilter = jest.fn()
    render(<CalendarToolbar {...baseProps({ onEmployeeFilter })} />)
    fireEvent.change(screen.getByDisplayValue('Todos os funcionários'), {
      target: { value: 'e1' },
    })
    expect(onEmployeeFilter).toHaveBeenCalledWith('e1')
  })

  it('chama onNewEvent ao clicar em "+ Novo Evento"', () => {
    const onNewEvent = jest.fn()
    render(<CalendarToolbar {...baseProps({ onNewEvent })} />)
    fireEvent.click(screen.getByText('+ Novo Evento'))
    expect(onNewEvent).toHaveBeenCalled()
  })
})
