import { TrendingUp, TrendingDown, Wallet } from 'lucide-react'
import type { FinancialSummary } from '@/models/dashboard.model'

function formatCurrency(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

interface FinancialCardProps {
  summary: FinancialSummary
}

export function FinancialCard({ summary }: FinancialCardProps) {
  const isPositive = summary.balance >= 0

  return (
    <div className="card bg-base-200 border border-base-300">
      <div className="card-body gap-4">
        <h2 className="text-xs font-semibold text-base-content/40 uppercase tracking-wider">
          Resumo Financeiro
        </h2>

        <div className="grid grid-cols-3 divide-x divide-base-300">
          {/* Income */}
          <div className="pr-4 flex flex-col gap-1.5">
            <div className="flex items-center gap-1.5">
              <TrendingUp size={13} className="text-success/70" />
              <span className="text-xs text-base-content/40">Entradas</span>
            </div>
            <p
              className="text-xl font-bold text-success num"
              data-testid="total-income"
            >
              {formatCurrency(summary.totalIncome)}
            </p>
          </div>

          {/* Expenses */}
          <div className="px-4 flex flex-col gap-1.5">
            <div className="flex items-center gap-1.5">
              <TrendingDown size={13} className="text-error/70" />
              <span className="text-xs text-base-content/40">Saídas</span>
            </div>
            <p
              className="text-xl font-bold text-error num"
              data-testid="total-expense"
            >
              {formatCurrency(summary.totalExpense)}
            </p>
          </div>

          {/* Balance */}
          <div className="pl-4 flex flex-col gap-1.5">
            <div className="flex items-center gap-1.5">
              <Wallet size={13} className={isPositive ? 'text-primary/70' : 'text-error/70'} />
              <span className="text-xs text-base-content/40">Saldo</span>
            </div>
            <p
              className={`text-xl font-bold num ${isPositive ? 'text-primary' : 'text-error'}`}
              data-testid="balance"
            >
              {formatCurrency(summary.balance)}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
