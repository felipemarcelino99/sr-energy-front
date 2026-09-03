import { z } from 'zod'
import { isValidCNPJ } from '@/utils/cnpj'

export type ClientStatus = 'active' | 'inactive'

export interface ClientAddress {
  logradouro: string
  numero: string
  complemento?: string
  bairro: string
  cidade: string
  estado: string
  cep: string
}

export interface Client {
  id: string
  razaoSocial: string
  cnpj: string
  segmento: string
  endereco: ClientAddress
  telefone?: string
  celular?: string
  email: string
  status: ClientStatus
  createdAt: string
  updatedAt: string
}

const addressSchema = z.object({
  logradouro: z.string().min(1, 'Logradouro é obrigatório'),
  numero: z.string().min(1, 'Número é obrigatório'),
  complemento: z.string().optional(),
  bairro: z.string().min(1, 'Bairro é obrigatório'),
  cidade: z.string().min(1, 'Cidade é obrigatória'),
  estado: z.string().min(1, 'Estado é obrigatório'),
  cep: z.string().min(1, 'CEP é obrigatório'),
})

// ---- Stepper schemas (one per step, mirrors job.model.ts pattern) ----

export const clientStep1Schema = z.object({
  razaoSocial: z.string().min(2, 'Razão Social é obrigatória'),
  cnpj: z.string().min(1, 'CNPJ é obrigatório').refine(isValidCNPJ, { message: 'CNPJ inválido' }),
  segmento: z.string().min(1, 'Segmento é obrigatório'),
  telefone: z.string().optional(),
  celular: z.string().optional(),
  email: z.string().email('E-mail inválido'),
  status: z.enum(['active', 'inactive']),
})

export const clientStep2Schema = addressSchema

export const clientSchema = clientStep1Schema.extend({
  endereco: clientStep2Schema,
})

export type ClientFormData = z.infer<typeof clientSchema>
export type ClientStep1Data = z.infer<typeof clientStep1Schema>
export type ClientStep2Data = z.infer<typeof clientStep2Schema>
