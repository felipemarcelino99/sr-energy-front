// Sub-plano 05 (épico ajustes-cliente-2026-09): funcionário passa a ter CPF
// (documento pessoal) no lugar de CNPJ — mesmo algoritmo de dígitos
// verificadores usado no backend (sr-energy-api src/utils/cpf.ts), para que
// a validação no cliente e no servidor nunca divirjam.

function onlyDigits(value: string): string {
  return value.replace(/\D/g, '')
}

function calcCheckDigit(base: string): number {
  let sum = 0
  let weight = base.length + 1
  for (const digit of base) {
    sum += Number(digit) * weight
    weight--
  }
  const rest = sum % 11
  return rest < 2 ? 0 : 11 - rest
}

// Aceita CPF com ou sem máscara (111.444.777-35 ou 11144477735). Rejeita
// sequências de dígito repetido (000.000.000-00 etc.) — passam no cálculo
// dos dígitos verificadores mas nunca são CPFs válidos emitidos.
export function isValidCPF(value: string): boolean {
  const digits = onlyDigits(value)
  if (digits.length !== 11) return false
  if (/^(\d)\1{10}$/.test(digits)) return false

  const base = digits.slice(0, 9)
  const d1 = calcCheckDigit(base)
  const d2 = calcCheckDigit(base + String(d1))
  return digits === base + String(d1) + String(d2)
}

/** Aplica a máscara progressivamente (000.000.000-00) enquanto o usuário digita. */
export function formatCPF(value: string): string {
  const digits = onlyDigits(value).slice(0, 11)
  if (digits.length > 9) {
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`
  }
  if (digits.length > 6) {
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`
  }
  if (digits.length > 3) {
    return `${digits.slice(0, 3)}.${digits.slice(3)}`
  }
  return digits
}
