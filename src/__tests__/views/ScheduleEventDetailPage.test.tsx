import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { ScheduleEventDetailPage } from '@/views/pages/ScheduleEventDetailPage'
import * as scheduleService from '@/services/schedule.service'

jest.mock('@/services/schedule.service', () => ({
  fetchScheduleEventById: jest.fn(),
}))

const MOCK_EVENT = {
  id: 'evt-1',
  type: 'training' as const,
  employeeIds: ['emp-1'],
  employeeNames: ['João Silva'],
  startDate: '2026-04-02',
  endDate: '2026-04-03',
  createdAt: '2026-03-01T00:00:00.000Z',
  updatedAt: '2026-03-01T00:00:00.000Z',
}

function renderWithRoute(id: string) {
  return render(
    <MemoryRouter initialEntries={[`/schedule/${id}`]}>
      <Routes>
        <Route path="/schedule/:id" element={<ScheduleEventDetailPage />} />
      </Routes>
    </MemoryRouter>
  )
}

it('renders event details', async () => {
  ;(scheduleService.fetchScheduleEventById as jest.Mock).mockResolvedValue(MOCK_EVENT)
  renderWithRoute('evt-1')

  expect(await screen.findByText('Treinamento')).toBeInTheDocument()
  expect(screen.getByText('João Silva')).toBeInTheDocument()
  expect(screen.getByText('02/04/2026')).toBeInTheDocument()
})

it('renders error state when event not found', async () => {
  ;(scheduleService.fetchScheduleEventById as jest.Mock).mockRejectedValue(new Error('ScheduleEvent evt-99 not found'))
  renderWithRoute('evt-99')

  expect(await screen.findByText(/evt-99 not found/i)).toBeInTheDocument()
})
