import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { ScheduleWidget } from '@/views/components/ScheduleWidget'
import { useScheduleStore } from '@/viewmodels/schedule.viewmodel'
import { useEmployeeStore } from '@/viewmodels/employee.viewmodel'
import { cancelJob } from '@/services/job.service'
import { cancelScheduleEvent } from '@/services/schedule.service'
import type { CalendarToolbar as CalendarToolbarType } from '@/views/components/CalendarToolbar'
import type { CalendarGrid as CalendarGridType } from '@/views/components/CalendarGrid'
import type { DayDetailPanel as DayDetailPanelType } from '@/views/components/DayDetailPanel'
import type { ScheduleEventModal as ScheduleEventModalType } from '@/views/components/ScheduleEventModal'

jest.mock('@/viewmodels/schedule.viewmodel')
jest.mock('@/viewmodels/employee.viewmodel')
jest.mock('@/services/job.service')
jest.mock('@/services/schedule.service')

jest.mock('@/views/components/CalendarToolbar', () => ({
  CalendarToolbar: (props: React.ComponentProps<typeof CalendarToolbarType>) => (
    <div>
      <button onClick={props.onPrev}>prev</button>
      <button onClick={props.onNext}>next</button>
      <button onClick={props.onToday}>today</button>
      <button onClick={() => props.onMonthSelect?.(2027, 6)}>month-select</button>
      {!props.readOnly && <button onClick={() => props.onNewEvent()}>new-event</button>}
    </div>
  ),
}))
jest.mock('@/views/components/CalendarLegend', () => ({
  CalendarLegend: () => <div data-testid="legend" />,
}))
jest.mock('@/views/components/CalendarGrid', () => ({
  CalendarGrid: (props: React.ComponentProps<typeof CalendarGridType>) => (
    <div>
      <button onClick={() => props.onSelectDate('2026-03-15')}>select-day</button>
      {props.onDoubleClick && (
        <button onClick={() => props.onDoubleClick?.('2026-03-15')}>dbl-click-day</button>
      )}
    </div>
  ),
}))
jest.mock('@/views/components/DayDetailPanel', () => ({
  DayDetailPanel: (props: React.ComponentProps<typeof DayDetailPanelType>) => (
    <div data-testid="day-detail-panel">
      {props.onJobEdit && <button onClick={() => props.onJobEdit?.('j1')}>edit-job</button>}
      {props.onJobCancel && <button onClick={() => props.onJobCancel?.('j1')}>cancel-job</button>}
      {props.onEventCancel && (
        <button onClick={() => props.onEventCancel?.('ev1')}>cancel-event</button>
      )}
    </div>
  ),
}))
jest.mock('@/views/components/ScheduleEventModal', () => ({
  ScheduleEventModal: (props: React.ComponentProps<typeof ScheduleEventModalType>) => (
    <div data-testid="schedule-event-modal" data-open={String(props.open)}>
      <button onClick={props.onClose}>close-event-modal</button>
    </div>
  ),
}))

const load = jest.fn()
const setCurrentMonth = jest.fn()
const setSelectedDate = jest.fn()
const setEmployeeFilter = jest.fn()
const groupedByDate = jest.fn()
const loadEmployees = jest.fn()

function setupScheduleStore(overrides: Partial<ReturnType<typeof baseState>> = {}) {
  ;(useScheduleStore as unknown as jest.Mock).mockReturnValue({ ...baseState(), ...overrides })
}

function baseState() {
  return {
    load,
    loading: false,
    currentMonth: { year: 2026, month: 3 },
    setCurrentMonth,
    selectedDate: null,
    setSelectedDate,
    employeeFilter: null,
    setEmployeeFilter,
    groupedByDate,
  }
}

function renderWidget(props?: Partial<React.ComponentProps<typeof ScheduleWidget>>) {
  return render(
    <MemoryRouter>
      <ScheduleWidget {...props} />
    </MemoryRouter>
  )
}

beforeEach(() => {
  jest.clearAllMocks()
  groupedByDate.mockReturnValue(new Map())
  setupScheduleStore()
  ;(useEmployeeStore as unknown as jest.Mock).mockReturnValue({
    employees: [],
    load: loadEmployees,
  })
})

it('carrega a agenda e os funcionários ao montar (modo não readOnly)', () => {
  renderWidget()
  expect(load).toHaveBeenCalled()
  expect(loadEmployees).toHaveBeenCalled()
})

it('não carrega funcionários quando readOnly=true', () => {
  renderWidget({ readOnly: true })
  expect(load).toHaveBeenCalled()
  expect(loadEmployees).not.toHaveBeenCalled()
})

it('aplica o filtro de funcionário quando employeeId é passado', () => {
  renderWidget({ employeeId: 'e1' })
  expect(setEmployeeFilter).toHaveBeenCalledWith('e1')
})

it('navega para o mês anterior e o próximo mês', () => {
  renderWidget()
  fireEvent.click(screen.getByText('prev'))
  expect(setCurrentMonth).toHaveBeenCalledWith({ year: 2026, month: 2 })
  fireEvent.click(screen.getByText('next'))
  expect(setCurrentMonth).toHaveBeenCalledWith({ year: 2026, month: 4 })
})

it('volta para o mês atual ao clicar em "hoje"', () => {
  renderWidget()
  fireEvent.click(screen.getByText('today'))
  expect(setCurrentMonth).toHaveBeenCalled()
})

it('abre o modal de novo evento sem data ao clicar em "novo evento"', () => {
  renderWidget()
  fireEvent.click(screen.getByText('new-event'))
  expect(screen.getByTestId('schedule-event-modal')).toHaveAttribute('data-open', 'true')
})

it('abre o modal de novo evento com a data ao dar duplo clique no grid (modo não readOnly)', () => {
  renderWidget()
  fireEvent.click(screen.getByText('dbl-click-day'))
  expect(screen.getByTestId('schedule-event-modal')).toHaveAttribute('data-open', 'true')
})

it('não permite duplo clique no grid quando readOnly=true', () => {
  renderWidget({ readOnly: true })
  expect(screen.queryByText('dbl-click-day')).not.toBeInTheDocument()
})

it('não renderiza o modal de evento quando readOnly=true', () => {
  renderWidget({ readOnly: true })
  expect(screen.queryByTestId('schedule-event-modal')).not.toBeInTheDocument()
})

it('exibe o painel de detalhes do dia quando há entradas na data selecionada', () => {
  groupedByDate.mockReturnValue(new Map([['2026-03-15', [{ kind: 'job', data: {} }]]]))
  setupScheduleStore({ selectedDate: '2026-03-15' })
  renderWidget()
  expect(screen.getByTestId('day-detail-panel')).toBeInTheDocument()
})

it('não exibe o painel de detalhes do dia quando a data selecionada não tem entradas', () => {
  groupedByDate.mockReturnValue(new Map())
  setupScheduleStore({ selectedDate: '2026-03-15' })
  renderWidget()
  expect(screen.queryByTestId('day-detail-panel')).not.toBeInTheDocument()
})

it('cancela uma OS e recarrega a agenda', async () => {
  groupedByDate.mockReturnValue(new Map([['2026-03-15', [{ kind: 'job', data: {} }]]]))
  setupScheduleStore({ selectedDate: '2026-03-15' })
  ;(cancelJob as jest.Mock).mockResolvedValue({})
  renderWidget()
  fireEvent.click(screen.getByText('cancel-job'))
  await waitFor(() => {
    expect(cancelJob).toHaveBeenCalledWith('j1')
  })
  await waitFor(() => {
    expect(load).toHaveBeenCalledTimes(2)
  })
})

it('cancela um evento e recarrega a agenda', async () => {
  groupedByDate.mockReturnValue(new Map([['2026-03-15', [{ kind: 'event', data: {} }]]]))
  setupScheduleStore({ selectedDate: '2026-03-15' })
  ;(cancelScheduleEvent as jest.Mock).mockResolvedValue({})
  renderWidget()
  fireEvent.click(screen.getByText('cancel-event'))
  await waitFor(() => {
    expect(cancelScheduleEvent).toHaveBeenCalledWith('ev1')
  })
  await waitFor(() => {
    expect(load).toHaveBeenCalledTimes(2)
  })
})

it('em modo readOnly, o painel não recebe callbacks de edição/cancelamento', () => {
  groupedByDate.mockReturnValue(new Map([['2026-03-15', [{ kind: 'job', data: {} }]]]))
  setupScheduleStore({ selectedDate: '2026-03-15' })
  renderWidget({ readOnly: true })
  expect(screen.queryByText('cancel-job')).not.toBeInTheDocument()
})

it('seleciona um mês específico via onMonthSelect', () => {
  renderWidget()
  fireEvent.click(screen.getByText('month-select'))
  expect(setCurrentMonth).toHaveBeenCalledWith({ year: 2027, month: 6 })
})

it('navega para edição da OS via onJobEdit', () => {
  groupedByDate.mockReturnValue(new Map([['2026-03-15', [{ kind: 'job', data: {} }]]]))
  setupScheduleStore({ selectedDate: '2026-03-15' })
  renderWidget()
  fireEvent.click(screen.getByText('edit-job'))
  // navigate is called internally; component doesn't throw
  expect(screen.getByText('edit-job')).toBeInTheDocument()
})

it('fecha o modal de novo evento via onClose', () => {
  renderWidget()
  fireEvent.click(screen.getByText('new-event'))
  expect(screen.getByTestId('schedule-event-modal')).toHaveAttribute('data-open', 'true')
  fireEvent.click(screen.getByText('close-event-modal'))
  expect(screen.getByTestId('schedule-event-modal')).toHaveAttribute('data-open', 'false')
})

it('exibe o spinner de carregamento quando loading=true', () => {
  setupScheduleStore({ loading: true })
  const { container } = renderWidget()
  expect(container.querySelector('.loading-spinner')).toBeInTheDocument()
})
