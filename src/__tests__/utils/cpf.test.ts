import { isValidCPF, formatCPF } from '@/utils/cpf'

describe('isValidCPF', () => {
  it('aceita CPF válido com máscara', () => {
    expect(isValidCPF('111.444.777-35')).toBe(true)
  })

  it('aceita CPF válido sem máscara', () => {
    expect(isValidCPF('11144477735')).toBe(true)
  })

  it('rejeita CPF com dígito verificador incorreto', () => {
    expect(isValidCPF('111.444.777-30')).toBe(false)
  })

  it('rejeita sequência de dígitos repetidos', () => {
    expect(isValidCPF('111.111.111-11')).toBe(false)
    expect(isValidCPF('000.000.000-00')).toBe(false)
  })

  it('rejeita CPF com quantidade errada de dígitos', () => {
    expect(isValidCPF('123456789')).toBe(false)
    expect(isValidCPF('123456789012')).toBe(false)
  })

  it('rejeita string vazia', () => {
    expect(isValidCPF('')).toBe(false)
  })
})

describe('formatCPF', () => {
  it('aplica a máscara progressivamente conforme os dígitos são digitados', () => {
    expect(formatCPF('1')).toBe('1')
    expect(formatCPF('111')).toBe('111')
    expect(formatCPF('1114')).toBe('111.4')
    expect(formatCPF('111444')).toBe('111.444')
    expect(formatCPF('1114447')).toBe('111.444.7')
    expect(formatCPF('111444777')).toBe('111.444.777')
    expect(formatCPF('1114447773')).toBe('111.444.777-3')
    expect(formatCPF('11144477735')).toBe('111.444.777-35')
  })

  it('ignora caracteres não numéricos na entrada', () => {
    expect(formatCPF('111.444.777-35')).toBe('111.444.777-35')
  })

  it('trunca em 11 dígitos', () => {
    expect(formatCPF('111444777359999')).toBe('111.444.777-35')
  })
})
