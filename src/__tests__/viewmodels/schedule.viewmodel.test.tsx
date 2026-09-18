import { renderHook, waitFor, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import {
  computeRange,
  navigateAnchor,
  eventsMonthParam,
  rangeLabel,
  useCalendarJobs,
  useScheduleEventsQuery,
  useScheduleStore,
  groupEntriesByDate,
} from '@/viewmodels/schedule.viewmodel'
import * as scheduleService from '@/services/schedule.service'
import type { ScheduleEvent, CalendarJob } from '@/models/schedule.model'

jest.mock('@/services/schedule.service', () => ({
  fetchCalendarJobs: jest.fn(),
  fetchScheduleEvents: jest.fn(),
  createScheduleEvent: jest.fn(),
}))

const makeEvent = (overrides: Partial<ScheduleEvent> = {}): ScheduleEvent => ({
  id: 'evt-1',
  type: 'training',
  employeeIds: ['emp-1'],
  employeeNames: ['João'],
  startDate: '2026-04-02',
  endDate: '2026-04-02',
  createdAt: '2026-03-01T00:00:00.000Z',
  updatedAt: '2026-03-01T00:00:00.000Z',
  ...overrides,
})

const makeJob = (overrides: Partial<CalendarJob> = {}): CalendarJob => ({
  id: 'job-1',
  number: 'AA001',
  status: 'scheduled',
  jobType: 'commissioning',
  scheduledDate: '2026-04-05',
  scheduledEndDate: null,
  startTime: '08:00',
  endTime: '17:00',
  city: 'São Paulo',
  state: 'SP',
  clientName: 'Cliente X',
  employees: [{ id: 'emp-1', name: 'Ana', color: '#2563eb', photoUrl: null }],
  ...overrides,
})

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  }
}

beforeEach(() => {
  jest.clearAllMocks()
})

describe('computeRange', () => {
  it('dia: from e to são o mesmo dia', () => {
    expect(computeRange('day', new Date(2026, 3, 15))).toEqual({
      from: '2026-04-15',
      to: '2026-04-15',
    })
  })

  it('semana: de domingo a sábado, cruzando o mês se preciso', () => {
    // 2026-04-01 é uma quarta-feira
    expect(computeRange('week', new Date(2026, 3, 1))).toEqual({
      from: '2026-03-29',
      to: '2026-04-04',
    })
  })

  it('mês: do primeiro ao último dia do mês', () => {
    expect(computeRange('month', new Date(2026, 3, 15))).toEqual({
      from: '2026-04-01',
      to: '2026-04-30',
    })
  })
})

describe('navigateAnchor', () => {
  it('dia: avança/volta 1 dia', () => {
    const d = new Date(2026, 3, 15)
    expect(navigateAnchor('day', d, 1).getDate()).toBe(16)
    expect(navigateAnchor('day', d, -1).getDate()).toBe(14)
  })

  it('semana: avança/volta 7 dias', () => {
    const d = new Date(2026, 3, 15)
    const next = navigateAnchor('week', d, 1)
    expect(toISODate(next)).toBe('2026-04-22')
  })

  it('mês: avança/volta 1 mês', () => {
    const d = new Date(2026, 3, 15)
    expect(navigateAnchor('month', d, 1).getMonth()).toBe(4)
    expect(navigateAnchor('month', d, -1).getMonth()).toBe(2)
  })
})

function toISODate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
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

describe('eventsMonthParam', () => {
  it('usa o mês do início do range', () => {
    expect(eventsMonthParam({ from: '2026-04-01', to: '2026-04-30' })).toBe('2026-04')
    expect(eventsMonthParam({ from: '2026-03-29', to: '2026-04-04' })).toBe('2026-03')
  })
})

describe('useCalendarJobs', () => {
  it('busca as OS do intervalo via fetchCalendarJobs', async () => {
    ;(scheduleService.fetchCalendarJobs as jest.Mock).mockResolvedValue([makeJob()])
    const { result } = renderHook(() => useCalendarJobs({ from: '2026-04-01', to: '2026-04-30' }), {
      wrapper: createWrapper(),
    })
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(scheduleService.fetchCalendarJobs).toHaveBeenCalledWith('2026-04-01', '2026-04-30')
    expect(result.current.jobs).toHaveLength(1)
  })

  it('retorna array vazio estável enquanto carrega', () => {
    ;(scheduleService.fetchCalendarJobs as jest.Mock).mockResolvedValue([])
    const { result } = renderHook(() => useCalendarJobs({ from: '2026-04-01', to: '2026-04-30' }), {
      wrapper: createWrapper(),
    })
    expect(result.current.jobs).toEqual([])
  })
})

describe('useScheduleEventsQuery', () => {
  it('busca os eventos do mês via fetchScheduleEvents', async () => {
    ;(scheduleService.fetchScheduleEvents as jest.Mock).mockResolvedValue([makeEvent()])
    const { result } = renderHook(() => useScheduleEventsQuery('2026-04'), {
      wrapper: createWrapper(),
    })
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(scheduleService.fetchScheduleEvents).toHaveBeenCalledWith('2026-04')
    expect(result.current.events).toHaveLength(1)
  })
})

describe('useScheduleStore — create', () => {
  it('chama createScheduleEvent e invalida a query de eventos', async () => {
    ;(scheduleService.createScheduleEvent as jest.Mock).mockResolvedValue(makeEvent())
    const { result } = renderHook(() => useScheduleStore(), { wrapper: createWrapper() })

    await act(async () => {
      await result.current.create({
        type: 'day_off',
        employeeIds: ['emp-1'],
        employeeNames: ['Ana'],
        startDate: '2026-04-02',
        endDate: '2026-04-02',
      })
    })

    expect(scheduleService.createScheduleEvent).toHaveBeenCalled()
  })
})

describe('groupEntriesByDate', () => {
  const range = { from: '2026-04-01', to: '2026-04-30' }

  it('groups a single-day event on its date', () => {
    const map = groupEntriesByDate(
      [],
      [makeEvent({ startDate: '2026-04-06', endDate: '2026-04-06' })],
      range,
      null
    )
    expect(map.get('2026-04-06')).toHaveLength(1)
    expect(map.get('2026-04-06')![0].kind).toBe('event')
  })

  it('expands a multi-day event across all days in range', () => {
    const map = groupEntriesByDate(
      [],
      [makeEvent({ startDate: '2026-04-10', endDate: '2026-04-12' })],
      range,
      null
    )
    expect(map.get('2026-04-10')).toHaveLength(1)
    expect(map.get('2026-04-11')).toHaveLength(1)
    expect(map.get('2026-04-12')).toHaveLength(1)
    expect(map.get('2026-04-09')).toBeUndefined()
    expect(map.get('2026-04-13')).toBeUndefined()
  })

  it('clips a multi-day event to the visible range boundaries', () => {
    const map = groupEntriesByDate(
      [],
      [makeEvent({ startDate: '2026-03-28', endDate: '2026-04-03' })],
      range,
      null
    )
    expect(map.get('2026-03-28')).toBeUndefined()
    expect(map.get('2026-04-01')).toHaveLength(1)
    expect(map.get('2026-04-03')).toHaveLength(1)
  })

  it('excludes an event entirely outside the visible range', () => {
    const map = groupEntriesByDate(
      [],
      [makeEvent({ startDate: '2026-05-01', endDate: '2026-05-10' })],
      range,
      null
    )
    expect(map.size).toBe(0)
  })

  it('places a job on its scheduledDate', () => {
    const map = groupEntriesByDate([makeJob({ scheduledDate: '2026-04-08' })], [], range, null)
    expect(map.get('2026-04-08')).toHaveLength(1)
    expect(map.get('2026-04-08')![0].kind).toBe('job')
  })

  it('expands a multi-day job across scheduledDate..scheduledEndDate', () => {
    const map = groupEntriesByDate(
      [makeJob({ scheduledDate: '2026-04-08', scheduledEndDate: '2026-04-10' })],
      [],
      range,
      null
    )
    expect(map.get('2026-04-08')).toHaveLength(1)
    expect(map.get('2026-04-09')).toHaveLength(1)
    expect(map.get('2026-04-10')).toHaveLength(1)
    expect(map.get('2026-04-07')).toBeUndefined()
    expect(map.get('2026-04-11')).toBeUndefined()
  })

  it('does not expand a job when scheduledEndDate is null', () => {
    const map = groupEntriesByDate(
      [makeJob({ scheduledDate: '2026-04-08', scheduledEndDate: null })],
      [],
      range,
      null
    )
    expect(map.get('2026-04-08')).toHaveLength(1)
    expect(map.get('2026-04-09')).toBeUndefined()
  })

  it('filters jobs by employeeFilter against employees[]', () => {
    const map = groupEntriesByDate(
      [
        makeJob({
          id: 'j1',
          scheduledDate: '2026-04-05',
          employees: [{ id: 'emp-1', name: 'Ana', color: null, photoUrl: null }],
        }),
        makeJob({
          id: 'j2',
          scheduledDate: '2026-04-05',
          employees: [{ id: 'emp-2', name: 'Bruno', color: null, photoUrl: null }],
        }),
      ],
      [],
      range,
      'emp-1'
    )
    expect(map.get('2026-04-05')).toHaveLength(1)
    expect((map.get('2026-04-05')![0].data as CalendarJob).id).toBe('j1')
  })

  it('includes a job filtered by a collaborator who is not employees[0]', () => {
    const map = groupEntriesByDate(
      [
        makeJob({
          scheduledDate: '2026-04-05',
          employees: [
            { id: 'emp-1', name: 'Ana', color: null, photoUrl: null },
            { id: 'emp-2', name: 'Bruno', color: null, photoUrl: null },
          ],
        }),
      ],
      [],
      range,
      'emp-2'
    )
    expect(map.get('2026-04-05')).toHaveLength(1)
  })

  it('includes a ScheduleEvent when the filtered employeeId is in its employeeIds', () => {
    const map = groupEntriesByDate(
      [],
      [
        makeEvent({
          employeeIds: ['emp-1', 'emp-2'],
          startDate: '2026-04-06',
          endDate: '2026-04-06',
        }),
      ],
      range,
      'emp-2'
    )
    expect(map.get('2026-04-06')).toHaveLength(1)
  })

  it('excludes a ScheduleEvent when the filtered employeeId is not in its employeeIds', () => {
    const map = groupEntriesByDate(
      [],
      [makeEvent({ employeeIds: ['emp-1'], startDate: '2026-04-06', endDate: '2026-04-06' })],
      range,
      'emp-99'
    )
    expect(map.get('2026-04-06')).toBeUndefined()
  })
})
