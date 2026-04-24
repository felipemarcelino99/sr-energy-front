import { render, screen } from '@testing-library/react'
import { Navbar } from '@/views/components/Navbar'
import type { AuthUser } from '@/models/auth.model'

// NotificationDropdown depends on stores/services — mock it for unit test
jest.mock('@/views/components/NotificationDropdown', () => ({
  NotificationDropdown: () => <button aria-label="Notificações">🔔</button>,
}))

const mockUser: AuthUser = { id: '1', email: 'admin@sr.com', name: 'Felipe Admin', role: 'admin' }

describe('Navbar', () => {
  it('exibe botão de menu mobile', () => {
    render(<Navbar user={mockUser} onLogout={jest.fn()} onMenuClick={jest.fn()} />)
    expect(screen.getByRole('button', { name: /abrir menu/i })).toBeInTheDocument()
  })

  it('exibe botão de logout', () => {
    render(<Navbar user={mockUser} onLogout={jest.fn()} onMenuClick={jest.fn()} />)
    expect(screen.getByRole('button', { name: /sair/i })).toBeInTheDocument()
  })

  it('exibe ícone de notificações', () => {
    render(<Navbar user={mockUser} onLogout={jest.fn()} onMenuClick={jest.fn()} />)
    expect(screen.getByRole('button', { name: /notificações/i })).toBeInTheDocument()
  })
})
