import { render, screen } from '@testing-library/react'
import { EventChip } from '@/views/components/EventChip'
import { JOB_COLOR } from '@/models/schedule.model'
import { getEmployeeColor } from '@/utils/employee-color'
import type { Job } from '@/models/job.model'
import type { CalendarEntry } from '@/models/schedule.model'

const baseJob: Job = {
  id: 'job-1',
  employeeId: 'emp-1',
  employeeName: 'Ana Silva',
  machineId: 'mach-1',
  machineName: 'Torno CNC',
  jobType: 'maintenance',
  status: 'scheduled',
  description: 'Manutenção',
  scheduledDate: '2025-06-01',
  city: 'São Paulo',
  state: 'SP',
  accommodation: false,
  car: false,
  startTime: '08:00',
  endTime: '17:00',
  createdAt: '2025-01-01T00:00:00Z',
  updatedAt: '2025-01-01T00:00:00Z',
  employeeIds: ['emp-1'],
}

it('usa a cor do colaborador (getEmployeeColor) em vez da JOB_COLOR fixa quando há employeeIds', () => {
  const entry: CalendarEntry = { kind: 'job', data: baseJob }
  render(<EventChip entry={entry} />)
  const chip = screen.getByTitle(/Manutenção/)
  const expectedColor = getEmployeeColor('emp-1')
  expect(expectedColor).not.toBe(JOB_COLOR)
  expect(chip).toHaveStyle({ backgroundColor: expectedColor })
})
