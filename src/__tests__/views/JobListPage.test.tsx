import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { JobListPage } from '@/views/pages/JobListPage'
import { useJobStore } from '@/viewmodels/job.viewmodel'

jest.mock('@/viewmodels/job.viewmodel')

it('aplica filtro de status ao montar se ?status=scheduled está na URL', () => {
  const setFilters = jest.fn()
  ;(useJobStore as unknown as jest.Mock).mockReturnValue({
    load: jest.fn(),
    filtered: () => [],
    cancel: jest.fn(),
    loading: false,
    error: null,
    filters: {},
    setFilters,
  })

  render(
    <MemoryRouter initialEntries={['/jobs?status=scheduled']}>
      <JobListPage />
    </MemoryRouter>
  )

  expect(setFilters).toHaveBeenCalledWith(expect.objectContaining({ status: 'scheduled' }))
})

it('renderiza link de novo trabalho com texto "Adicionar"', () => {
  ;(useJobStore as unknown as jest.Mock).mockReturnValue({
    load: jest.fn(), filtered: () => [], cancel: jest.fn(),
    loading: false, error: null, filters: {}, setFilters: jest.fn(),
  })
  render(<MemoryRouter><JobListPage /></MemoryRouter>)
  expect(screen.getByRole('link', { name: /adicionar/i })).toBeInTheDocument()
})
