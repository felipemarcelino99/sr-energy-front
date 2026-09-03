// Imports `services/api.ts` via a relative path (not the `@/services/api` alias) on purpose:
// jest.config.cjs maps the alias to a lightweight mock for every other test suite, so the
// only way to exercise the *real* interceptor/case-conversion logic is to bypass that mapping.

interface FakeInterceptorManager {
  handlers: Array<(arg: unknown) => unknown>
  use(fn: (arg: unknown) => unknown): void
}

interface FakeAxiosInstance {
  interceptors: {
    request: FakeInterceptorManager
    response: FakeInterceptorManager
  }
}

function makeInterceptorManager(): FakeInterceptorManager {
  return {
    handlers: [],
    use(fn) {
      this.handlers.push(fn)
    },
  }
}

jest.mock('axios', () => {
  const create = jest.fn(
    (): FakeAxiosInstance => ({
      interceptors: {
        request: makeInterceptorManager(),
        response: makeInterceptorManager(),
      },
    })
  )
  return { __esModule: true, default: { create } }
})

jest.mock('@/services/supabase', () => ({
  supabase: {
    auth: {
      getSession: jest.fn(),
    },
  },
}))

jest.mock('@/config/env', () => ({ API_BASE_URL: 'http://localhost/api' }))

import { supabase } from '@/services/supabase'
import api from '../../services/api'

const fakeApi = api as unknown as FakeAxiosInstance
const getSessionMock = supabase.auth.getSession as jest.Mock

const authInterceptor = fakeApi.interceptors.request.handlers[0] as (config: {
  headers: Record<string, string>
}) => Promise<{ headers: Record<string, string> }>
const snakeCaseInterceptor = fakeApi.interceptors.request.handlers[1] as (config: {
  data?: unknown
}) => { data?: unknown }
const camelCaseInterceptor = fakeApi.interceptors.response.handlers[0] as (response: {
  data?: unknown
}) => { data?: unknown }

beforeEach(() => {
  getSessionMock.mockReset()
})

describe('api — auth interceptor', () => {
  it('anexa o Authorization header quando há sessão ativa', async () => {
    getSessionMock.mockResolvedValue({ data: { session: { access_token: 'token-123' } } })
    const config = await authInterceptor({ headers: {} })
    expect(config.headers.Authorization).toBe('Bearer token-123')
  })

  it('não anexa Authorization header quando não há sessão', async () => {
    getSessionMock.mockResolvedValue({ data: { session: null } })
    const config = await authInterceptor({ headers: {} })
    expect(config.headers.Authorization).toBeUndefined()
  })
})

describe('api — deepToSnakeCase (outgoing request bodies)', () => {
  it('converte chaves de nível superior para snake_case', () => {
    const result = snakeCaseInterceptor({ data: { employeeId: '1', scheduledDate: '2026-01-01' } })
    expect(result.data).toEqual({ employee_id: '1', scheduled_date: '2026-01-01' })
  })

  it('converte chaves aninhadas recursivamente', () => {
    const result = snakeCaseInterceptor({
      data: { jobDetail: { machineId: 'm1', clientInfo: { clientName: 'Acme' } } },
    })
    expect(result.data).toEqual({
      job_detail: { machine_id: 'm1', client_info: { client_name: 'Acme' } },
    })
  })

  it('converte arrays de objetos', () => {
    const result = snakeCaseInterceptor({
      data: { jobList: [{ employeeId: '1' }, { employeeId: '2' }] },
    })
    expect(result.data).toEqual({ job_list: [{ employee_id: '1' }, { employee_id: '2' }] })
  })

  it('não altera chaves que já estão em snake_case (underscore legítimo)', () => {
    const result = snakeCaseInterceptor({ data: { os_code: 'OS-001', already_snake: true } })
    expect(result.data).toEqual({ os_code: 'OS-001', already_snake: true })
  })

  it('não transforma o corpo quando é FormData', () => {
    const formData = new FormData()
    const config = { data: formData }
    const result = snakeCaseInterceptor(config)
    expect(result.data).toBe(formData)
  })
})

describe('api — deepToCamelCase (incoming response bodies)', () => {
  it('converte chaves de nível superior para camelCase', () => {
    const result = camelCaseInterceptor({
      data: { employee_id: '1', scheduled_date: '2026-01-01' },
    })
    expect(result.data).toEqual({ employeeId: '1', scheduledDate: '2026-01-01' })
  })

  it('converte chaves aninhadas recursivamente', () => {
    const result = camelCaseInterceptor({
      data: { job_detail: { machine_id: 'm1', client_info: { client_name: 'Acme' } } },
    })
    expect(result.data).toEqual({
      jobDetail: { machineId: 'm1', clientInfo: { clientName: 'Acme' } },
    })
  })

  it('converte arrays de objetos aninhados', () => {
    const result = camelCaseInterceptor({
      data: { job_list: [{ employee_id: '1' }, { employee_id: '2' }] },
    })
    expect(result.data).toEqual({ jobList: [{ employeeId: '1' }, { employeeId: '2' }] })
  })

  it('mantém chaves já em camelCase (underscore legítimo dentro do valor não é afetado)', () => {
    const result = camelCaseInterceptor({ data: { osCode: 'OS_2026_001' } })
    expect(result.data).toEqual({ osCode: 'OS_2026_001' })
  })
})
