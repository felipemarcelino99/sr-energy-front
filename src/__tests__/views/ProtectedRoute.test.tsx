import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { ProtectedRoute } from '@/views/components/ProtectedRoute'
import { useAuth } from '@/viewmodels/auth.context'

jest.mock('@/viewmodels/auth.context')

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>

function renderWithRouter(initialEntry = '/protected') {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route element={<ProtectedRoute />}>
          <Route path="/protected" element={<div>Conteúdo protegido</div>} />
        </Route>
        <Route path="/login" element={<div>Página de login</div>} />
      </Routes>
    </MemoryRouter>
  )
}

describe('ProtectedRoute', () => {
  it('redireciona para /login quando não autenticado', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      role: null,
      loading: false,
      login: jest.fn(),
      logout: jest.fn(),
    })

    renderWithRouter()
    expect(screen.getByText('Página de login')).toBeInTheDocument()
  })

  it('exibe conteúdo quando autenticado', () => {
    mockUseAuth.mockReturnValue({
      user: { id: '1', email: 'u@e.com', name: 'User', role: 'employee' },
      role: 'employee',
      loading: false,
      login: jest.fn(),
      logout: jest.fn(),
    })

    renderWithRouter()
    expect(screen.getByText('Conteúdo protegido')).toBeInTheDocument()
  })

  it('exibe loading spinner enquanto verifica sessão', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      role: null,
      loading: true,
      login: jest.fn(),
      logout: jest.fn(),
    })

    renderWithRouter()
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
  })
})
