import api from '@/services/api'
import {
  fetchCalendarJobs,
  fetchScheduleEvents,
  fetchScheduleEventById,
  createScheduleEvent,
  cancelScheduleEvent,
} from '../../services/schedule.service'

jest.mock('@/services/api')
const mockApi = api as jest.Mocked<typeof api>

describe('schedule.service — fetchCalendarJobs', () => {
  it('chama GET /jobs/calendar com from/to como params', async () => {
    mockApi.get.mockResolvedValue({ data: [] })
    await fetchCalendarJobs('2026-04-01', '2026-04-30')
    expect(mockApi.get).toHaveBeenCalledWith('/jobs/calendar', {
      params: { from: '2026-04-01', to: '2026-04-30' },
    })
  })

  it('retorna as OS do intervalo', async () => {
    const jobs = [{ id: 'j1', employees: [] }]
    mockApi.get.mockResolvedValue({ data: jobs })
    const result = await fetchCalendarJobs('2026-04-01', '2026-04-07')
    expect(result).toEqual(jobs)
  })
})

describe('schedule.service — fetchScheduleEvents', () => {
  it('chama GET /schedule-events sem params quando month omitido', async () => {
    mockApi.get.mockResolvedValue({ data: [] })
    await fetchScheduleEvents()
    expect(mockApi.get).toHaveBeenCalledWith('/schedule-events', { params: {} })
  })

  it('chama GET /schedule-events?month= quando informado', async () => {
    mockApi.get.mockResolvedValue({ data: [] })
    await fetchScheduleEvents('2027-01')
    expect(mockApi.get).toHaveBeenCalledWith('/schedule-events', { params: { month: '2027-01' } })
  })
})

describe('schedule.service — fetchScheduleEventById', () => {
  it('chama GET /schedule-events/:id', async () => {
    mockApi.get.mockResolvedValue({ data: { id: '1' } })
    await fetchScheduleEventById('1')
    expect(mockApi.get).toHaveBeenCalledWith('/schedule-events/1')
  })
})

describe('schedule.service — createScheduleEvent', () => {
  it('chama POST /schedule-events sem employeeNames no payload', async () => {
    mockApi.post.mockResolvedValue({ data: { id: '1' } })
    await createScheduleEvent({
      type: 'day_off',
      employeeIds: ['e1'],
      startDate: '2027-01-01',
      endDate: '2027-01-01',
      notes: '',
      employeeNames: ['Fulano'],
    })
    expect(mockApi.post).toHaveBeenCalledWith('/schedule-events', {
      type: 'day_off',
      employeeIds: ['e1'],
      startDate: '2027-01-01',
      endDate: '2027-01-01',
      notes: '',
    })
  })
})

describe('schedule.service — cancelScheduleEvent', () => {
  it('chama PATCH /schedule-events/:id/cancel', async () => {
    mockApi.patch.mockResolvedValue({ data: undefined })
    await cancelScheduleEvent('1')
    expect(mockApi.patch).toHaveBeenCalledWith('/schedule-events/1/cancel')
  })
})
