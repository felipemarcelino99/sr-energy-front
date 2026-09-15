const CHARSET = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%&*'

/** Generates a strong random password using the Web Crypto API (CSPRNG). */
export function generatePassword(length = 16): string {
  const bytes = new Uint32Array(length)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (n) => CHARSET[n % CHARSET.length]).join('')
}
