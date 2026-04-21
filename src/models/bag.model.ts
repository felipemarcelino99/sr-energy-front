import { z } from 'zod'

export interface CalibrationCertificate {
  id: string
  fileUrl: string
  expiryDate: string
}

export interface Bag {
  id: string
  name: string
  model: string
  quantity: number
  calibrationCertificates: CalibrationCertificate[]
  createdAt: string
  updatedAt: string
}

export const bagSchema = z.object({
  name: z.string().min(2, 'Nome deve ter ao menos 2 caracteres'),
  model: z.string().min(1, 'Modelo é obrigatório'),
  quantity: z.coerce.number().int('Quantidade deve ser inteira').min(1, 'Quantidade mínima é 1'),
})

export type BagFormData = z.infer<typeof bagSchema>

export function isCertificateExpiringSoon(expiryDate: string, today = new Date()): boolean {
  const expiry = new Date(expiryDate)
  const diffMs = expiry.getTime() - today.getTime()
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))
  return diffDays >= 0 && diffDays <= 30
}

export function isCertificateExpired(expiryDate: string, today = new Date()): boolean {
  return new Date(expiryDate) < today
}
