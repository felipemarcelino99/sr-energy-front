import { render, screen } from '@testing-library/react'
import { NextJobWidget } from '@/views/components/NextJobWidget'
import type { JobSummary } from '@/models/dashboard.model'

const mockJob: JobSummary = {
  id: '1',
  title: 'Manutenção Serra',
  status: 'pending',
  employeeId: 'e1',
  employeeName: 'Ana',
  scheduledAt: '2099-06-15',
}

describe('NextJobWidget', () => {
  it('exibe o trabalho mais próximo', () => {
    render(<NextJobWidget job={mockJob} />)
    expect(screen.getByText('Manutenção Serra')).toBeInTheDocument()
    expect(screen.getByTestId('next-job-date')).toBeInTheDocument()
  })

  it('exibe estado vazio quando não há próximo trabalho', () => {
    render(<NextJobWidget job={null} />)
    expect(screen.getByTestId('next-job-empty')).toBeInTheDocument()
  })
})
