import { render, screen } from '@testing-library/react'
import { JobStatusCard } from '@/views/components/JobStatusCard'

describe('JobStatusCard', () => {
  it('exibe contagem por status', () => {
    render(
      <JobStatusCard
        summary={[
          { status: 'pending', count: 4 },
          { status: 'completed', count: 2 },
          { status: 'in_progress', count: 1 },
        ]}
      />
    )
    expect(screen.getByTestId('count-pending').textContent).toBe('4')
    expect(screen.getByTestId('count-completed').textContent).toBe('2')
    expect(screen.getByTestId('count-in_progress').textContent).toBe('1')
  })

  it('exibe labels em português', () => {
    render(
      <JobStatusCard summary={[{ status: 'pending', count: 1 }]} />
    )
    expect(screen.getByText('Pendente')).toBeInTheDocument()
  })
})
