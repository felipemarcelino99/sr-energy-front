import { filterNavByRole, NAV_ITEMS } from '@/models/navigation.model'

describe('filterNavByRole', () => {
  it('retorna itens permitidos para manager', () => {
    const items = filterNavByRole(NAV_ITEMS, 'manager')
    const paths = items.map((i) => i.path)
    expect(paths).toContain('/')
    expect(paths).toContain('/jobs')
    expect(paths).toContain('/machines')
    expect(paths).toContain('/contracts')
    expect(paths).toContain('/employees')
    expect(paths).toContain('/financial')
    expect(paths).not.toContain('/my-jobs')
    expect(paths).not.toContain('/chat')
  })

  it('retorna itens permitidos para employee', () => {
    const items = filterNavByRole(NAV_ITEMS, 'employee')
    const paths = items.map((i) => i.path)
    expect(paths).toContain('/dashboard')
    expect(paths).toContain('/my-jobs')
    expect(paths).toContain('/chat')
    expect(paths).not.toContain('/jobs')
    expect(paths).not.toContain('/financial')
  })

  it('retorna todos os itens acessíveis para admin', () => {
    const items = filterNavByRole(NAV_ITEMS, 'admin')
    const paths = items.map((i) => i.path)
    expect(paths).toContain('/jobs')
    expect(paths).toContain('/employees')
  })
})
