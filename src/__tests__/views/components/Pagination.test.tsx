import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Pagination } from '@/views/components/Pagination'

describe('Pagination', () => {
  it('renders page label', () => {
    render(<Pagination page={2} totalPages={5} onGoTo={jest.fn()} />)
    expect(screen.getByText('Página 2 de 5')).toBeInTheDocument()
  })

  it('calls onGoTo with prev page when Anterior clicked', async () => {
    const onGoTo = jest.fn()
    render(<Pagination page={3} totalPages={5} onGoTo={onGoTo} />)
    await userEvent.click(screen.getByText('Anterior'))
    expect(onGoTo).toHaveBeenCalledWith(2)
  })

  it('calls onGoTo with next page when Próxima clicked', async () => {
    const onGoTo = jest.fn()
    render(<Pagination page={3} totalPages={5} onGoTo={onGoTo} />)
    await userEvent.click(screen.getByText('Próxima'))
    expect(onGoTo).toHaveBeenCalledWith(4)
  })

  it('disables Anterior on first page', () => {
    render(<Pagination page={1} totalPages={5} onGoTo={jest.fn()} />)
    expect(screen.getByText('Anterior').closest('button')).toBeDisabled()
  })

  it('disables Próxima on last page', () => {
    render(<Pagination page={5} totalPages={5} onGoTo={jest.fn()} />)
    expect(screen.getByText('Próxima').closest('button')).toBeDisabled()
  })

  it('does not render when totalPages is 1', () => {
    const { container } = render(<Pagination page={1} totalPages={1} onGoTo={jest.fn()} />)
    expect(container.firstChild).toBeNull()
  })
})
