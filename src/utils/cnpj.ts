export function isValidCNPJ(cnpj: string): boolean {
  const s = cnpj.replace(/[^\d]/g, '')
  if (s.length !== 14 || /^(\d)\1+$/.test(s)) return false
  const calc = (n: number) => {
    let sum = 0
    let pos = n - 7
    for (let i = n; i >= 1; i--) {
      sum += parseInt(s[n - i]) * pos--
      if (pos < 2) pos = 9
    }
    const rem = sum % 11
    return rem < 2 ? 0 : 11 - rem
  }
  return calc(12) === parseInt(s[12]) && calc(13) === parseInt(s[13])
}
