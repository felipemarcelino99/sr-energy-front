import { clientSchema } from '@/models/client.model'

const validCNPJ = '11.222.333/0001-81'

const validAddress = {
  logradouro: 'Rua das Flores',
  numero: '100',
  bairro: 'Centro',
  cidade: 'São Paulo',
  estado: 'SP',
  cep: '01001-000',
}

const validData = {
  razaoSocial: 'Empresa Teste Ltda',
  cnpj: validCNPJ,
  segmento: 'Industrial',
  endereco: validAddress,
  telefone: '(11) 3333-4444',
  celular: '(11) 99999-8888',
  email: 'contato@empresa.com',
  status: 'active' as const,
}

describe('client.model — schema', () => {
  it('aceita dados válidos', () => {
    const result = clientSchema.safeParse(validData)
    expect(result.success).toBe(true)
  })

  it('rejeita razaoSocial ausente', () => {
    const result = clientSchema.safeParse({ ...validData, razaoSocial: '' })
    expect(result.success).toBe(false)
  })

  it('rejeita CNPJ inválido', () => {
    const result = clientSchema.safeParse({ ...validData, cnpj: '00.000.000/0000-00' })
    expect(result.success).toBe(false)
    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path[0])
      expect(paths).toContain('cnpj')
    }
  })

  it('rejeita email inválido', () => {
    const result = clientSchema.safeParse({ ...validData, email: 'nao-e-email' })
    expect(result.success).toBe(false)
  })

  it('rejeita status inválido', () => {
    const result = clientSchema.safeParse({ ...validData, status: 'unknown' })
    expect(result.success).toBe(false)
  })

  it('aceita status "inactive"', () => {
    const result = clientSchema.safeParse({ ...validData, status: 'inactive' })
    expect(result.success).toBe(true)
  })

  it('campos opcionais (complemento, telefone, celular) podem ser omitidos', () => {
    const { telefone: _t, celular: _c, ...withoutOptionals } = validData
    const result = clientSchema.safeParse({
      ...withoutOptionals,
      endereco: { ...validAddress, complemento: undefined },
    })
    expect(result.success).toBe(true)
  })

  it('rejeita endereco com logradouro ausente', () => {
    const result = clientSchema.safeParse({
      ...validData,
      endereco: { ...validAddress, logradouro: '' },
    })
    expect(result.success).toBe(false)
  })
})
