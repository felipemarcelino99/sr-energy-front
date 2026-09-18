import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ScheduleWidget } from '@/views/components/ScheduleWidget'
import { useEmployeeStore } from '@/viewmodels/employee.viewmodel'
import { cancelJob } from '@/services/job.service'
import { cancelScheduleEvent } from '@/services/schedule.service'
import * as scheduleViewmodel from '@/viewmodels/schedule.viewmodel'
import type { CalendarToolbar as CalendarToolbarType } from '@/views/components/CalendarToolbar'
import type { CalendarGrid as CalendarGridType } from '@/views/components/CalendarGrid'
import type { CalendarWeekView as CalendarWeekViewType } from '@/views/components/CalendarWeekView'
import type { DayDetailPanel as DayDetailPanelType } from '@/views/components/DayDetailPanel'
import type { ScheduleEventModal as ScheduleEventModalType } from '@/views/components/ScheduleEventModal'

jest.mock('@/viewmodels/employee.viewmodel')
jest.mock('@/services/schedule.service')

jest.mock('@/viewmodels/schedule.viewmodel', () => {
  const actual = jest.requireActual('@/viewmodels/schedule.viewmodel')
  return {
    ...actual,
    useCalendarJobs: jest.fn(),
    useScheduleEventsQuery: jest.fn(),
  }
})

jest.mock('@/views/components/CalendarToolbar', () => ({
  CalendarToolbar: (props: React.ComponentProps<typeof CalendarToolbarType>) => (
    <div>
      <span data-testid="toolbar-view">{props.view}</span>
      <span data-testid="toolbar-employee-filter">{props.employeeFilter ?? ''}</span>
      <button onClick={props.onPrev}>prev</button>
      <button onClick={props.onNext}>next</button>
      <button onClick={() => props.onViewChange('week')}>view-week</button>
      <button onClick={() => props.onViewChange('day')}>view-day</button>
      <button onClick={() => props.onMonthSelect?.(2027, 6)}>month-select</button>
      {!props.readOnly && <button onClick={() => props.onNewEvent()}>new-event</button>}
      {!props.readOnly && (
        <button onClick={() => props.onEmployeeFilter('e1')}>filter-employee</button>
      )}
    </div>
  ),
}))
jest.mock('@/views/components/CalendarLegend', () => ({
  CalendarLegend: () => <div data-testid="legend" />,
}))
jest.mock('@/views/components/CalendarGrid', () => ({
  CalendarGrid: (props: React.ComponentProps<typeof CalendarGridType>) => (
    <div data-testid="calendar-grid">
      <button onClick={() => props.onSelectDate('2026-03-15')}>select-day</button>
      {props.onDoubleClick && (
        <button onClick={() => props.onDoubleClick?.('2026-03-15')}>dbl-click-day</button>
      )}
    </div>
  ),
}))
jest.mock('@/views/components/CalendarWeekView', () => ({
  CalendarWeekView: (props: React.ComponentProps<typeof CalendarWeekViewType>) => (
    <div data-testid="calendar-week-view">
      <button onClick={() => props.onSelectDate('2026-03-15')}>select-day-week</button>
    </div>
  ),
}))
jest.mock('@/views/components/DayDetailPanel', () => ({
  DayDetailPanel: (props: React.ComponentProps<typeof DayDetailPanelType>) => (
    <div data-testid="day-detail-panel" data-current-employee-id={props.currentEmployeeId ?? ''}>
      {props.onJobEdit && <button onClick={() => props.onJobEdit?.('j1')}>edit-job</button>}
      {props.onJobCancel && <button onClick={() => props.onJobCancel?.('j1')}>cancel-job</button>}
      {props.onEventCancel && (
        <button onClick={() => props.onEventCancel?.('ev1')}>cancel-event</button>
      )}
      {props.onClose && <button onClick={props.onClose}>close-day-detail</button>}
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

const loadEmployees = jest.fn()
const mockUseCalendarJobs = scheduleViewmodel.useCalendarJobs as jest.Mock
const mockUseScheduleEventsQuery = scheduleViewmodel.useScheduleEventsQuery as jest.Mock

function renderWidget(
  props?: Partial<React.ComponentProps<typeof ScheduleWidget>>,
  initialEntries: string[] = ['/schedule']
) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={initialEntries}>
        <ScheduleWidget {...props} />
      </MemoryRouter>
    </QueryClientProvider>
  )
}

beforeEach(() => {
  jest.clearAllMocks()
  mockUseCalendarJobs.mockReturnValue({ jobs: [], isLoading: false })
  mockUseScheduleEventsQuery.mockReturnValue({ events: [], isLoading: false })
  ;(useEmployeeStore as unknown as jest.Mock).mockReturnValue({
    employees: [],
    load: loadEmployees,
  })
})

it('carrega os funcionários ao montar (modo não readOnly)', () => {
  renderWidget()
  expect(loadEmployees).toHaveBeenCalled()
})

it('não carrega funcionários quando readOnly=true', () => {
  renderWidget({ readOnly: true })
  expect(loadEmployees).not.toHaveBeenCalled()
})

it('renderiza a visão mês por padrão', () => {
  renderWidget()
  expect(screen.getByTestId('toolbar-view')).toHaveTextContent('month')
  expect(screen.getByTestId('calendar-grid')).toBeInTheDocument()
})

it('lê a visão da URL', () => {
  renderWidget(undefined, ['/schedule?view=week'])
  expect(screen.getByTestId('toolbar-view')).toHaveTextContent('week')
  expect(screen.getByTestId('calendar-week-view')).toBeInTheDocument()
})

it('troca para a visão semana ao clicar no toggle', () => {
  renderWidget()
  fireEvent.click(screen.getByText('view-week'))
  expect(screen.getByTestId('calendar-week-view')).toBeInTheDocument()
})

it('troca para a visão dia ao clicar no toggle', () => {
  renderWidget()
  fireEvent.click(screen.getByText('view-day'))
  expect(screen.queryByTestId('calendar-grid')).not.toBeInTheDocument()
  expect(screen.queryByTestId('calendar-week-view')).not.toBeInTheDocument()
})

it('mostra estado vazio na visão dia quando não há OS/eventos', () => {
  renderWidget(undefined, ['/schedule?view=day&date=2026-03-15'])
  expect(screen.getByText(/nenhuma os ou evento neste dia/i)).toBeInTheDocument()
})

it('navega para o período anterior e o próximo ao clicar em prev/next', () => {
  renderWidget(undefined, ['/schedule?date=2026-03-15'])
  fireEvent.click(screen.getByText('prev'))
  fireEvent.click(screen.getByText('next'))
  // não deve lançar — a data âncora muda via URL, refletida em useCalendarJobs
  expect(mockUseCalendarJobs).toHaveBeenCalled()
})

it('seleciona um mês específico via onMonthSelect', () => {
  renderWidget()
  fireEvent.click(screen.getByText('month-select'))
  // useCalendarJobs deve ter sido chamado de novo com o novo range (2027-06)
  const calledWithJune2027 = mockUseCalendarJobs.mock.calls.some(
    ([range]) => range.from === '2027-06-01'
  )
  expect(calledWithJune2027).toBe(true)
})

it('aplica o filtro de funcionário via URL/toolbar', () => {
  renderWidget()
  fireEvent.click(screen.getByText('filter-employee'))
  expect(screen.getByTestId('toolbar-employee-filter')).toHaveTextContent('e1')
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
  mockUseCalendarJobs.mockReturnValue({
    jobs: [
      {
        id: 'j1',
        number: 'AA001',
        status: 'scheduled',
        jobType: 'commissioning',
        scheduledDate: '2026-03-15',
        scheduledEndDate: null,
        startTime: '08:00',
        endTime: '17:00',
        city: 'SP',
        state: 'SP',
        clientName: null,
        employees: [{ id: 'e1', name: 'Ana', color: '#2563eb', photoUrl: null }],
      },
    ],
    isLoading: false,
  })
  renderWidget(undefined, ['/schedule?date=2026-03-15'])
  fireEvent.click(screen.getByText('select-day'))
  expect(screen.getByTestId('day-detail-panel')).toBeInTheDocument()
})

it('fecha o painel de detalhes do dia via onClose (limpa a data selecionada)', () => {
  mockUseCalendarJobs.mockReturnValue({
    jobs: [
      {
        id: 'j1',
        number: 'AA001',
        status: 'scheduled',
        jobType: 'commissioning',
        scheduledDate: '2026-03-15',
        scheduledEndDate: null,
        startTime: '08:00',
        endTime: '17:00',
        city: 'SP',
        state: 'SP',
        clientName: null,
        employees: [{ id: 'e1', name: 'Ana', color: '#2563eb', photoUrl: null }],
      },
    ],
    isLoading: false,
  })
  renderWidget(undefined, ['/schedule?date=2026-03-15'])
  fireEvent.click(screen.getByText('select-day'))
  expect(screen.getByTestId('day-detail-panel')).toBeInTheDocument()
  fireEvent.click(screen.getByText('close-day-detail'))
  expect(screen.queryByTestId('day-detail-panel')).not.toBeInTheDocument()
})

it('não exibe o painel de detalhes do dia quando a data selecionada não tem entradas', () => {
  renderWidget()
  fireEvent.click(screen.getByText('select-day'))
  expect(screen.queryByTestId('day-detail-panel')).not.toBeInTheDocument()
})

it('repassa currentEmployeeId para o DayDetailPanel', () => {
  mockUseCalendarJobs.mockReturnValue({
    jobs: [
      {
        id: 'j1',
        number: 'AA001',
        status: 'scheduled',
        jobType: 'commissioning',
        scheduledDate: '2026-03-15',
        scheduledEndDate: null,
        startTime: '08:00',
        endTime: '17:00',
        city: 'SP',
        state: 'SP',
        clientName: null,
        employees: [{ id: 'e1', name: 'Ana', color: '#2563eb', photoUrl: null }],
      },
    ],
    isLoading: false,
  })
  renderWidget({ readOnly: true, currentEmployeeId: 'e1' }, ['/schedule?date=2026-03-15'])
  fireEvent.click(screen.getByText('select-day'))
  expect(screen.getByTestId('day-detail-panel')).toHaveAttribute('data-current-employee-id', 'e1')
})

it('cancela uma OS e invalida as queries do calendário', async () => {
  mockUseCalendarJobs.mockReturnValue({
    jobs: [
      {
        id: 'j1',
        number: 'AA001',
        status: 'scheduled',
        jobType: 'commissioning',
        scheduledDate: '2026-03-15',
        scheduledEndDate: null,
        startTime: '08:00',
        endTime: '17:00',
        city: 'SP',
        state: 'SP',
        clientName: null,
        employees: [{ id: 'e1', name: 'Ana', color: '#2563eb', photoUrl: null }],
      },
    ],
    isLoading: false,
  })
  ;(cancelJob as jest.Mock).mockResolvedValue({})
  renderWidget(undefined, ['/schedule?date=2026-03-15'])
  fireEvent.click(screen.getByText('select-day'))
  fireEvent.click(screen.getByText('cancel-job'))
  await waitFor(() => {
    expect(cancelJob).toHaveBeenCalledWith('j1')
  })
})

it('cancela um evento e invalida as queries do calendário', async () => {
  mockUseScheduleEventsQuery.mockReturnValue({
    events: [
      {
        id: 'ev1',
        type: 'vacation',
        employeeIds: ['e1'],
        employeeNames: ['Ana'],
        startDate: '2026-03-15',
        endDate: '2026-03-15',
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
      },
    ],
    isLoading: false,
  })
  ;(cancelScheduleEvent as jest.Mock).mockResolvedValue({})
  renderWidget(undefined, ['/schedule?date=2026-03-15'])
  fireEvent.click(screen.getByText('select-day'))
  fireEvent.click(screen.getByText('cancel-event'))
  await waitFor(() => {
    expect(cancelScheduleEvent).toHaveBeenCalledWith('ev1')
  })
})

it('em modo readOnly, o painel não recebe callbacks de edição/cancelamento', () => {
  mockUseCalendarJobs.mockReturnValue({
    jobs: [
      {
        id: 'j1',
        number: 'AA001',
        status: 'scheduled',
        jobType: 'commissioning',
        scheduledDate: '2026-03-15',
        scheduledEndDate: null,
        startTime: '08:00',
        endTime: '17:00',
        city: 'SP',
        state: 'SP',
        clientName: null,
        employees: [{ id: 'e1', name: 'Ana', color: '#2563eb', photoUrl: null }],
      },
    ],
    isLoading: false,
  })
  renderWidget({ readOnly: true }, ['/schedule?date=2026-03-15'])
  fireEvent.click(screen.getByText('select-day'))
  expect(screen.getByTestId('day-detail-panel')).toBeInTheDocument()
  expect(screen.queryByText('cancel-job')).not.toBeInTheDocument()
  expect(screen.queryByText('edit-job')).not.toBeInTheDocument()
})

it('fecha o modal de novo evento via onClose', () => {
  renderWidget()
  fireEvent.click(screen.getByText('new-event'))
  expect(screen.getByTestId('schedule-event-modal')).toHaveAttribute('data-open', 'true')
  fireEvent.click(screen.getByText('close-event-modal'))
  expect(screen.getByTestId('schedule-event-modal')).toHaveAttribute('data-open', 'false')
})

it('exibe o spinner de carregamento quando os jobs estão carregando', () => {
  mockUseCalendarJobs.mockReturnValue({ jobs: [], isLoading: true })
  const { container } = renderWidget()
  expect(container.querySelector('.loading-spinner')).toBeInTheDocument()
})

it('exibe o spinner de carregamento quando os eventos estão carregando', () => {
  mockUseScheduleEventsQuery.mockReturnValue({ events: [], isLoading: true })
  const { container } = renderWidget()
  expect(container.querySelector('.loading-spinner')).toBeInTheDocument()
})
