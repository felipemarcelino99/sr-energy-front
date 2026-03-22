import { render, screen } from '@testing-library/react'
import { Navbar } from '@/views/components/Navbar'
import type { AuthUser } from '@/models/auth.model'

// NotificationDropdown depends on stores/services — mock it for unit test
jest.mock('@/views/components/NotificationDropdown', () => ({
  NotificationDropdown: () => <button aria-label="Notificações">🔔</button>,
}))

const mockUser: AuthUser = { id: '1', email: 'admin@sr.com', name: 'Felipe Admin', role: 'admin' }

describe('Navbar', () => {
  it('exibe o nome do usuário', () => {
    render(<Navbar user={mockUser} onLogout={jest.fn()} onMenuClick={jest.fn()} />)
    expect(screen.getByText('Felipe Admin')).toBeInTheDocument()
  })

  it('exibe o badge de role', () => {
    render(<Navbar user={mockUser} onLogout={jest.fn()} onMenuClick={jest.fn()} />)
    expect(screen.getByText('Admin')).toBeInTheDocument()
  })

  it('exibe ícone de notificações', () => {
    render(<Navbar user={mockUser} onLogout={jest.fn()} onMenuClick={jest.fn()} />)
    expect(screen.getByRole('button', { name: /notificações/i })).toBeInTheDocument()
  })
})
