import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { RoleGuard } from '@/views/components/RoleGuard'
import { useAuth } from '@/viewmodels/auth.context'

jest.mock('@/viewmodels/auth.context')

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>

function renderWithRouter(allowedRoles: ('admin' | 'manager' | 'employee')[]) {
  return render(
    <MemoryRouter initialEntries={['/admin']}>
      <Routes>
        <Route element={<RoleGuard allowedRoles={allowedRoles} />}>
          <Route path="/admin" element={<div>Área admin</div>} />
        </Route>
        <Route path="/unauthorized" element={<div>Sem permissão</div>} />
      </Routes>
    </MemoryRouter>
  )
}

describe('RoleGuard', () => {
  it('redireciona para /unauthorized se role não autorizada', () => {
    mockUseAuth.mockReturnValue({
      user: { id: '1', email: 'u@e.com', name: 'User', role: 'employee' },
      role: 'employee',
      loading: false,
      login: jest.fn(),
      logout: jest.fn(),
    })

    renderWithRouter(['admin', 'manager'])
    expect(screen.getByText('Sem permissão')).toBeInTheDocument()
  })

  it('exibe conteúdo para role autorizada', () => {
    mockUseAuth.mockReturnValue({
      user: { id: '1', email: 'u@e.com', name: 'Admin', role: 'admin' },
      role: 'admin',
      loading: false,
      login: jest.fn(),
      logout: jest.fn(),
    })

    renderWithRouter(['admin', 'manager'])
    expect(screen.getByText('Área admin')).toBeInTheDocument()
  })

  it('redireciona para /unauthorized quando não autenticado', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      role: null,
      loading: false,
      login: jest.fn(),
      logout: jest.fn(),
    })

    renderWithRouter(['admin'])
    expect(screen.getByText('Sem permissão')).toBeInTheDocument()
  })
})
