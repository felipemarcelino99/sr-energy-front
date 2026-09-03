import { render, screen, waitFor, act } from '@testing-library/react'
import { AuthProvider, useAuth } from '@/viewmodels/auth.context'
import { useAuthStore } from '@/viewmodels/auth.viewmodel'
import { supabase } from '@/services/supabase'
import { getEmployeeIdFromCache, resolveEmployeeId } from '@/services/auth.service'

jest.mock('@/services/auth.service', () => ({
  signIn: jest.fn(),
  signOut: jest.fn(),
  getSession: jest.fn().mockResolvedValue(null),
  getEmployeeIdFromCache: jest.fn(),
  resolveEmployeeId: jest.fn(),
}))

const mockSupabase = supabase as unknown as {
  auth: { onAuthStateChange: jest.Mock }
}

function Probe() {
  const { user, role } = useAuth()
  return <div data-testid="probe">{user ? `${role}:${user.email}` : 'sem-usuario'}</div>
}

function getAuthChangeCallback() {
  return mockSupabase.auth.onAuthStateChange.mock.calls[0][0]
}

beforeEach(() => {
  jest.clearAllMocks()
  useAuthStore.setState({ user: null, loading: false, error: null })
  mockSupabase.auth.onAuthStateChange.mockReturnValue({
    data: { subscription: { unsubscribe: jest.fn() } },
  })
})

describe('AuthProvider', () => {
  it('define user como null quando a sessão é encerrada', async () => {
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>
    )
    await waitFor(() => expect(mockSupabase.auth.onAuthStateChange).toHaveBeenCalled())
    act(() => getAuthChangeCallback()('SIGNED_OUT', null))
    expect(screen.getByTestId('probe')).toHaveTextContent('sem-usuario')
  })

  it('define user pra manager sem tentar resolver employeeId', async () => {
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>
    )
    await waitFor(() => expect(mockSupabase.auth.onAuthStateChange).toHaveBeenCalled())
    const session = {
      user: {
        id: 'u1',
        email: 'gestor@sr.com',
        user_metadata: { role: 'manager', name: 'Gestor' },
      },
    }
    act(() => getAuthChangeCallback()('SIGNED_IN', session))
    expect(screen.getByTestId('probe')).toHaveTextContent('manager:gestor@sr.com')
    expect(resolveEmployeeId).not.toHaveBeenCalled()
  })

  it('usa employeeId do cache quando disponível pra employee', async () => {
    ;(getEmployeeIdFromCache as jest.Mock).mockReturnValue('emp-cached')
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>
    )
    await waitFor(() => expect(mockSupabase.auth.onAuthStateChange).toHaveBeenCalled())
    const session = {
      user: { id: 'u2', email: 'joao@sr.com', user_metadata: { role: 'employee' } },
    }
    act(() => getAuthChangeCallback()('SIGNED_IN', session))
    expect(screen.getByTestId('probe')).toHaveTextContent('employee:joao@sr.com')
    expect(resolveEmployeeId).not.toHaveBeenCalled()
  })

  it('resolve employeeId de forma assíncrona quando não está em cache', async () => {
    ;(getEmployeeIdFromCache as jest.Mock).mockReturnValue(undefined)
    ;(resolveEmployeeId as jest.Mock).mockResolvedValue('emp-resolvido')
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>
    )
    await waitFor(() => expect(mockSupabase.auth.onAuthStateChange).toHaveBeenCalled())
    const session = { user: { id: 'u3', email: 'ana@sr.com', user_metadata: { role: 'employee' } } }
    await act(async () => {
      getAuthChangeCallback()('SIGNED_IN', session)
      await Promise.resolve()
    })
    expect(resolveEmployeeId).toHaveBeenCalledWith('u3')
    expect(useAuthStore.getState().user?.employeeId).toBe('emp-resolvido')
  })
})

describe('useAuth fora do provider', () => {
  it('lança erro', () => {
    function Bare() {
      useAuth()
      return null
    }
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => render(<Bare />)).toThrow('useAuth must be used within AuthProvider')
    spy.mockRestore()
  })
})
