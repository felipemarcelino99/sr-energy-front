import { render, screen } from '@testing-library/react'
import { NotificationBell } from '@/views/components/NotificationBell'

describe('NotificationBell', () => {
  it('exibe badge com contagem de não-lidas quando > 0', () => {
    render(<NotificationBell unreadCount={3} onClick={jest.fn()} />)
    expect(screen.getByTestId('unread-badge')).toHaveTextContent('3')
  })

  it('não exibe badge quando contagem é 0', () => {
    render(<NotificationBell unreadCount={0} onClick={jest.fn()} />)
    expect(screen.queryByTestId('unread-badge')).not.toBeInTheDocument()
  })
})
