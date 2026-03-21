import { z } from 'zod'

export type TransactionType = 'credit' | 'debit'

export interface Transaction {
  id: string
  type: TransactionType
  amount: number
  description: string
  category: string
  destination?: string
  date: string
  createdAt: string
}

export interface FinancialSummary {
  totalCredits: number
  totalDebits: number
  balance: number
}

export interface MonthlyGroup {
  month: string   // "YYYY-MM"
  credits: number
  debits: number
  balance: number
}

export function calcSummary(transactions: Transaction[]): FinancialSummary {
  const totalCredits = transactions
    .filter((t) => t.type === 'credit')
    .reduce((sum, t) => sum + t.amount, 0)
  const totalDebits = transactions
    .filter((t) => t.type === 'debit')
    .reduce((sum, t) => sum + t.amount, 0)
  return {
    totalCredits,
    totalDebits,
    balance: totalCredits - totalDebits,
  }
}

export function groupByMonth(transactions: Transaction[]): MonthlyGroup[] {
  const map = new Map<string, { credits: number; debits: number }>()
  for (const t of transactions) {
    const month = t.date.slice(0, 7) // "YYYY-MM"
    const current = map.get(month) ?? { credits: 0, debits: 0 }
    if (t.type === 'credit') current.credits += t.amount
    else current.debits += t.amount
    map.set(month, current)
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, { credits, debits }]) => ({
      month,
      credits,
      debits,
      balance: credits - debits,
    }))
}

export const transactionSchema = z.object({
  type: z.enum(['credit', 'debit']),
  amount: z.coerce
    .number()
    .positive('Valor deve ser positivo e maior que zero'),
  description: z.string().min(1, 'Descrição é obrigatória'),
  category: z.string().min(1, 'Categoria é obrigatória'),
  destination: z.string().optional(),
  date: z.string().min(1, 'Data é obrigatória'),
})

export type TransactionFormData = z.infer<typeof transactionSchema>
