import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { ScheduleEventFormPage } from '@/views/pages/ScheduleEventFormPage'
import * as scheduleService from '@/services/schedule.service'
import * as employeeService from '@/services/employee.service'

jest.mock('@/services/schedule.service', () => ({ createScheduleEvent: jest.fn() }))
jest.mock('@/services/employee.service', () => ({ fetchEmployees: jest.fn() }))

const mockNavigate = jest.fn()
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}))

const MOCK_EMPLOYEES = [
  { id: 'emp-1', name: 'João Silva', email: 'joao@sr.com', role: 'employee', salary: 3000 },
  { id: 'emp-2', name: 'Ana Souza', email: 'ana@sr.com', role: 'employee', salary: 3500 },
]

beforeEach(() => {
  ;(employeeService.fetchEmployees as jest.Mock).mockResolvedValue(MOCK_EMPLOYEES)
  ;(scheduleService.createScheduleEvent as jest.Mock).mockResolvedValue({ id: 'evt-new' })
  mockNavigate.mockClear()
})

it('shows validation error when no employee is selected', async () => {
  render(<MemoryRouter><ScheduleEventFormPage /></MemoryRouter>)
  await screen.findByText('João Silva')

  fireEvent.click(screen.getByRole('button', { name: /salvar/i }))

  expect(await screen.findByText(/selecione ao menos um funcionário/i)).toBeInTheDocument()
})

it('shows validation error when endDate is before startDate', async () => {
  render(<MemoryRouter><ScheduleEventFormPage /></MemoryRouter>)
  await screen.findByText('João Silva')

  fireEvent.click(screen.getByLabelText('João Silva'))
  fireEvent.change(screen.getByLabelText(/data de início/i), { target: { value: '2026-04-10' } })
  fireEvent.change(screen.getByLabelText(/data de término/i), { target: { value: '2026-04-05' } })
  fireEvent.click(screen.getByRole('button', { name: /salvar/i }))

  expect(await screen.findByText(/posterior à data de início/i)).toBeInTheDocument()
})

it('submits and redirects on valid data', async () => {
  render(<MemoryRouter><ScheduleEventFormPage /></MemoryRouter>)
  await screen.findByText('João Silva')

  fireEvent.change(screen.getByRole('combobox', { name: /tipo/i }), { target: { value: 'training' } })
  fireEvent.click(screen.getByLabelText('João Silva'))
  fireEvent.change(screen.getByLabelText(/data de início/i), { target: { value: '2026-04-02' } })
  fireEvent.change(screen.getByLabelText(/data de término/i), { target: { value: '2026-04-03' } })
  fireEvent.click(screen.getByRole('button', { name: /salvar/i }))

  await waitFor(() => expect(scheduleService.createScheduleEvent).toHaveBeenCalledTimes(1))
  expect(mockNavigate).toHaveBeenCalledWith('/schedule')
})
