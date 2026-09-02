import api from '@/services/api'
import { supabase } from '@/services/supabase'
import {
  signIn,
  signOut,
  getSession,
  resolveEmployeeId,
  getEmployeeIdFromCache,
} from '../../services/auth.service'

jest.mock('@/services/api')
jest.mock('@/services/supabase')
const mockApi = api as jest.Mocked<typeof api>
const mockSupabase = supabase as unknown as {
  auth: {
    signInWithPassword: jest.Mock
    signOut: jest.Mock
    getSession: jest.Mock
  }
}

beforeEach(() => jest.clearAllMocks())

const employeeRow = (id: string, userId: string) => ({
  id,
  userId,
  name: 'Fulano',
  email: 'fulano@sr.com',
  phone: '11999999999',
  role: 'employee',
  salary: 1000,
  hiredAt: '2027-01-01',
  createdAt: '2027-01-01',
  updatedAt: '2027-01-01',
})

describe('auth.service — signIn', () => {
  it('retorna AuthUser em login bem-sucedido de manager (sem resolver employeeId)', async () => {
    mockSupabase.auth.signInWithPassword.mockResolvedValue({
      data: { user: { id: 'u1', email: 'a@b.com', user_metadata: { role: 'manager', name: 'A' } } },
      error: null,
    })
    const user = await signIn('a@b.com', 'senha')
    expect(user).toEqual({
      id: 'u1',
      employeeId: undefined,
      email: 'a@b.com',
      name: 'A',
      role: 'manager',
    })
    expect(mockApi.get).not.toHaveBeenCalled()
  })

  it('resolve employeeId quando role é employee', async () => {
    const userId = '11111111-1111-4111-8111-111111111111'
    const empId = '22222222-2222-4222-8222-222222222222'
    mockSupabase.auth.signInWithPassword.mockResolvedValue({
      data: { user: { id: userId, email: 'a@b.com', user_metadata: { role: 'employee' } } },
      error: null,
    })
    mockApi.get.mockResolvedValue({ data: [employeeRow(empId, userId)] })
    const user = await signIn('a@b.com', 'senha')
    expect(user.employeeId).toBe(empId)
  })

  it('mapeia erro de credenciais inválidas pra mensagem genérica', async () => {
    mockSupabase.auth.signInWithPassword.mockResolvedValue({
      data: {},
      error: { message: 'Invalid login credentials' },
    })
    await expect(signIn('a@b.com', 'errada')).rejects.toThrow('Email ou senha incorretos.')
  })

  it('usa mensagem genérica padrão para erro desconhecido', async () => {
    mockSupabase.auth.signInWithPassword.mockResolvedValue({
      data: {},
      error: { message: 'algo inesperado' },
    })
    await expect(signIn('a@b.com', 'x')).rejects.toThrow('Erro ao fazer login. Tente novamente.')
  })
})

describe('auth.service — signOut', () => {
  it('chama supabase signOut', async () => {
    mockSupabase.auth.signOut.mockResolvedValue({ error: null })
    await signOut()
    expect(mockSupabase.auth.signOut).toHaveBeenCalled()
  })

  it('propaga erro mapeado', async () => {
    mockSupabase.auth.signOut.mockResolvedValue({ error: { message: 'Too many requests' } })
    await expect(signOut()).rejects.toThrow('Muitas tentativas. Aguarde alguns minutos.')
  })
})

describe('auth.service — getSession', () => {
  it('retorna null quando não há sessão', async () => {
    mockSupabase.auth.getSession.mockResolvedValue({ data: { session: null } })
    expect(await getSession()).toBeNull()
  })

  it('retorna AuthUser quando há sessão', async () => {
    mockSupabase.auth.getSession.mockResolvedValue({
      data: {
        session: {
          user: { id: 'u1', email: 'a@b.com', user_metadata: { role: 'manager', name: 'A' } },
        },
      },
    })
    const user = await getSession()
    expect(user).toEqual({
      id: 'u1',
      employeeId: undefined,
      email: 'a@b.com',
      name: 'A',
      role: 'manager',
    })
  })
})

describe('auth.service — resolveEmployeeId', () => {
  it('retorna undefined e não quebra quando a API falha', async () => {
    mockApi.get.mockRejectedValue(new Error('network'))
    expect(await resolveEmployeeId('u-sem-cache')).toBeUndefined()
  })

  it('usa cache em chamadas subsequentes (getEmployeeIdFromCache)', async () => {
    const userId = '33333333-3333-4333-8333-333333333333'
    const empId = '44444444-4444-4444-8444-444444444444'
    mockApi.get.mockResolvedValue({ data: [employeeRow(empId, userId)] })
    await resolveEmployeeId(userId)
    expect(getEmployeeIdFromCache(userId)).toBe(empId)
  })
})
