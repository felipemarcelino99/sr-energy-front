import { render, screen, fireEvent } from '@testing-library/react'
import { JobStatusCard } from '@/views/components/JobStatusCard'
import type { JobStatusSummary } from '@/models/dashboard.model'

const mockSummary: JobStatusSummary[] = [
  { status: 'scheduled', count: 3 },
  { status: 'in_progress', count: 1 },
  { status: 'completed', count: 5 },
  { status: 'cancelled', count: 2 },
]

describe('JobStatusCard', () => {
  it('exibe contagem por status', () => {
    render(
      <JobStatusCard
        summary={[
          { status: 'scheduled', count: 4 },
          { status: 'completed', count: 2 },
          { status: 'in_progress', count: 1 },
        ]}
      />
    )
    expect(screen.getByTestId('count-scheduled').textContent).toBe('4')
    expect(screen.getByTestId('count-completed').textContent).toBe('2')
    expect(screen.getByTestId('count-in_progress').textContent).toBe('1')
  })

  it('exibe labels em português', () => {
    render(
      <JobStatusCard summary={[{ status: 'scheduled', count: 1 }]} />
    )
    expect(screen.getByText('Agendado')).toBeInTheDocument()
  })
})

describe('JobStatusCard — clicável', () => {
  it('chama onStatusClick com o status correto ao clicar no card', () => {
    const onStatusClick = jest.fn()
    render(<JobStatusCard summary={mockSummary} onStatusClick={onStatusClick} />)
    fireEvent.click(screen.getByTestId('status-card-scheduled'))
    expect(onStatusClick).toHaveBeenCalledWith('scheduled')
  })

  it('não lança erro se onStatusClick não for passado', () => {
    expect(() =>
      render(<JobStatusCard summary={mockSummary} />)
    ).not.toThrow()
  })

  it('aplica cursor-pointer quando onStatusClick está definido', () => {
    const onStatusClick = jest.fn()
    render(<JobStatusCard summary={mockSummary} onStatusClick={onStatusClick} />)
    const card = screen.getByTestId('status-card-scheduled')
    expect(card.className).toContain('cursor-pointer')
  })
})
