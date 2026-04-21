import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { SchedulePage } from '@/views/pages/SchedulePage'
import * as scheduleService from '@/services/schedule.service'
import * as jobService from '@/services/job.service'
import * as employeeService from '@/services/employee.service'

jest.mock('@/services/schedule.service', () => ({ fetchScheduleEvents: jest.fn() }))
jest.mock('@/services/job.service', () => ({ fetchJobs: jest.fn() }))
jest.mock('@/services/employee.service', () => ({ fetchEmployees: jest.fn() }))

beforeEach(() => {
  ;(scheduleService.fetchScheduleEvents as jest.Mock).mockResolvedValue([])
  ;(jobService.fetchJobs as jest.Mock).mockResolvedValue([])
  ;(employeeService.fetchEmployees as jest.Mock).mockResolvedValue([])
})

it('renders the legend and toolbar without crashing', async () => {
  render(<MemoryRouter><SchedulePage /></MemoryRouter>)
  expect(await screen.findByText('OS')).toBeInTheDocument()
  expect(screen.getByText('Folga')).toBeInTheDocument()
  expect(screen.getByText('Férias')).toBeInTheDocument()
  expect(screen.getByText('Treinamento')).toBeInTheDocument()
  expect(screen.getByText('Afastamento médico')).toBeInTheDocument()
  expect(screen.getByText('+ Novo Evento')).toBeInTheDocument()
})
