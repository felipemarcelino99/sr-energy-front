import { useScheduleStore } from '@/viewmodels/schedule.viewmodel'
import * as scheduleService from '@/services/schedule.service'
import * as jobService from '@/services/job.service'
import type { ScheduleEvent } from '@/models/schedule.model'
import type { Job } from '@/models/job.model'

jest.mock('@/services/schedule.service', () => ({
  fetchScheduleEvents: jest.fn(),
  fetchScheduleEventById: jest.fn(),
  createScheduleEvent: jest.fn(),
}))

jest.mock('@/services/job.service', () => ({
  fetchJobs: jest.fn(),
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

const makeJob = (overrides: Partial<Job> = {}): Job => ({
  id: 'job-1',
  title: 'Manutenção',
  employeeId: 'emp-1',
  scheduledDate: '2026-04-05',
  status: 'scheduled',
  ...overrides,
} as Job)

beforeEach(() => {
  useScheduleStore.setState({
    events: [],
    jobs: [],
    loading: false,
    error: null,
    currentMonth: { year: 2026, month: 4 },
    selectedDate: null,
    employeeFilter: null,
  })
  jest.clearAllMocks()
})

describe('load', () => {
  it('loads events and jobs', async () => {
    const event = makeEvent()
    const job = makeJob()
    ;(scheduleService.fetchScheduleEvents as jest.Mock).mockResolvedValue([event])
    ;(jobService.fetchJobs as jest.Mock).mockResolvedValue([job])

    await useScheduleStore.getState().load()

    expect(useScheduleStore.getState().events).toHaveLength(1)
    expect(useScheduleStore.getState().jobs).toHaveLength(1)
  })

  it('sets error on failure', async () => {
    ;(scheduleService.fetchScheduleEvents as jest.Mock).mockRejectedValue(new Error('fail'))
    ;(jobService.fetchJobs as jest.Mock).mockResolvedValue([])

    await useScheduleStore.getState().load()

    expect(useScheduleStore.getState().error).toBe('fail')
  })
})

describe('groupedByDate', () => {
  it('groups a single-day event on its date', async () => {
    ;(scheduleService.fetchScheduleEvents as jest.Mock).mockResolvedValue([makeEvent({ startDate: '2026-04-06', endDate: '2026-04-06' })])
    ;(jobService.fetchJobs as jest.Mock).mockResolvedValue([])
    await useScheduleStore.getState().load()

    const map = useScheduleStore.getState().groupedByDate()
    expect(map.get('2026-04-06')).toHaveLength(1)
    expect(map.get('2026-04-06')![0].kind).toBe('event')
  })

  it('expands a multi-day event across all days in range within current month', async () => {
    ;(scheduleService.fetchScheduleEvents as jest.Mock).mockResolvedValue([
      makeEvent({ startDate: '2026-04-10', endDate: '2026-04-12' }),
    ])
    ;(jobService.fetchJobs as jest.Mock).mockResolvedValue([])
    await useScheduleStore.getState().load()

    const map = useScheduleStore.getState().groupedByDate()
    expect(map.get('2026-04-10')).toHaveLength(1)
    expect(map.get('2026-04-11')).toHaveLength(1)
    expect(map.get('2026-04-12')).toHaveLength(1)
    expect(map.get('2026-04-09')).toBeUndefined()
    expect(map.get('2026-04-13')).toBeUndefined()
  })

  it('clips multi-day event to current month boundaries', async () => {
    // Viewed in April 2026 — event spans March 28 to April 3
    ;(scheduleService.fetchScheduleEvents as jest.Mock).mockResolvedValue([
      makeEvent({ startDate: '2026-03-28', endDate: '2026-04-03' }),
    ])
    ;(jobService.fetchJobs as jest.Mock).mockResolvedValue([])
    await useScheduleStore.getState().load()

    const map = useScheduleStore.getState().groupedByDate()
    expect(map.get('2026-03-28')).toBeUndefined() // outside April
    expect(map.get('2026-04-01')).toHaveLength(1)
    expect(map.get('2026-04-03')).toHaveLength(1)
  })

  it('places a Job on its scheduledDate', async () => {
    ;(scheduleService.fetchScheduleEvents as jest.Mock).mockResolvedValue([])
    ;(jobService.fetchJobs as jest.Mock).mockResolvedValue([makeJob({ scheduledDate: '2026-04-08' })])
    await useScheduleStore.getState().load()

    const map = useScheduleStore.getState().groupedByDate()
    expect(map.get('2026-04-08')).toHaveLength(1)
    expect(map.get('2026-04-08')![0].kind).toBe('job')
  })
})

describe('employeeFilter', () => {
  it('filters jobs by employeeId', async () => {
    ;(scheduleService.fetchScheduleEvents as jest.Mock).mockResolvedValue([])
    ;(jobService.fetchJobs as jest.Mock).mockResolvedValue([
      makeJob({ id: 'j1', employeeId: 'emp-1', scheduledDate: '2026-04-05' }),
      makeJob({ id: 'j2', employeeId: 'emp-2', scheduledDate: '2026-04-05' }),
    ])
    await useScheduleStore.getState().load()
    useScheduleStore.setState({ employeeFilter: 'emp-1' })

    const map = useScheduleStore.getState().groupedByDate()
    expect(map.get('2026-04-05')).toHaveLength(1)
    expect((map.get('2026-04-05')![0].data as Job).employeeId).toBe('emp-1')
  })

  it('includes a ScheduleEvent when filtered employeeId is in its employeeIds', async () => {
    ;(scheduleService.fetchScheduleEvents as jest.Mock).mockResolvedValue([
      makeEvent({ employeeIds: ['emp-1', 'emp-2'], startDate: '2026-04-06', endDate: '2026-04-06' }),
    ])
    ;(jobService.fetchJobs as jest.Mock).mockResolvedValue([])
    await useScheduleStore.getState().load()
    useScheduleStore.setState({ employeeFilter: 'emp-2' })

    const map = useScheduleStore.getState().groupedByDate()
    expect(map.get('2026-04-06')).toHaveLength(1)
  })

  it('excludes a ScheduleEvent when filtered employeeId is not in its employeeIds', async () => {
    ;(scheduleService.fetchScheduleEvents as jest.Mock).mockResolvedValue([
      makeEvent({ employeeIds: ['emp-1'], startDate: '2026-04-06', endDate: '2026-04-06' }),
    ])
    ;(jobService.fetchJobs as jest.Mock).mockResolvedValue([])
    await useScheduleStore.getState().load()
    useScheduleStore.setState({ employeeFilter: 'emp-99' })

    const map = useScheduleStore.getState().groupedByDate()
    expect(map.get('2026-04-06')).toBeUndefined()
  })
})
