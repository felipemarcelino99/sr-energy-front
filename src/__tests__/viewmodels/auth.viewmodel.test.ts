import { useAuthStore } from '@/viewmodels/auth.viewmodel'

jest.mock('@/services/auth.service', () => ({
  signIn: jest.fn(),
  signOut: jest.fn(),
  getSession: jest.fn(),
}))

import * as authService from '@/services/auth.service'

const mockUser = { id: '1', email: 'user@example.com', name: 'User', role: 'employee' as const }

beforeEach(() => {
  useAuthStore.setState({ user: null, loading: false, error: null })
  jest.clearAllMocks()
})

describe('auth.viewmodel — login', () => {
  it('popula o store com o usuário após login bem-sucedido', async () => {
    ;(authService.signIn as jest.Mock).mockResolvedValue(mockUser)

    await useAuthStore.getState().login({ email: 'user@example.com', password: '123456' })

    const { user, loading, error } = useAuthStore.getState()
    expect(user).toEqual(mockUser)
    expect(loading).toBe(false)
    expect(error).toBeNull()
  })

  it('seta erro e lança exceção quando login falha', async () => {
    ;(authService.signIn as jest.Mock).mockRejectedValue(new Error('Credenciais inválidas'))

    await expect(
      useAuthStore.getState().login({ email: 'bad@example.com', password: 'wrong' })
    ).rejects.toThrow('Credenciais inválidas')

    const { user, error } = useAuthStore.getState()
    expect(user).toBeNull()
    expect(error).toBe('Credenciais inválidas')
  })
})

describe('auth.viewmodel — logout', () => {
  it('limpa o store após logout', async () => {
    useAuthStore.setState({ user: mockUser })
    ;(authService.signOut as jest.Mock).mockResolvedValue(undefined)

    await useAuthStore.getState().logout()

    expect(useAuthStore.getState().user).toBeNull()
  })
})

describe('auth.viewmodel — loadSession', () => {
  it('carrega sessão existente no store', async () => {
    ;(authService.getSession as jest.Mock).mockResolvedValue(mockUser)

    await useAuthStore.getState().loadSession()

    expect(useAuthStore.getState().user).toEqual(mockUser)
  })

  it('seta user como null quando não há sessão', async () => {
    ;(authService.getSession as jest.Mock).mockResolvedValue(null)

    await useAuthStore.getState().loadSession()

    expect(useAuthStore.getState().user).toBeNull()
  })
})
