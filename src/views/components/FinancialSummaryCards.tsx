interface Props {
  totalCredits: number
  totalDebits: number
  balance: number
}

function formatCurrency(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export function FinancialSummaryCards({ totalCredits, totalDebits, balance }: Props) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="card bg-success/10 border border-success/30 p-4">
        <p className="text-xs font-medium text-base-content/60 mb-1">Entradas</p>
        <p className="text-2xl font-bold text-success">{formatCurrency(totalCredits)}</p>
      </div>

      <div className="card bg-error/10 border border-error/30 p-4">
        <p className="text-xs font-medium text-base-content/60 mb-1">Saídas</p>
        <p className="text-2xl font-bold text-error">{formatCurrency(totalDebits)}</p>
      </div>

      <div className={`card p-4 ${balance >= 0 ? 'bg-primary/10 border border-primary/30' : 'bg-error/10 border border-error/30'}`}>
        <p className="text-xs font-medium text-base-content/60 mb-1">Saldo</p>
        <p
          data-testid="balance-value"
          className={`text-2xl font-bold ${balance >= 0 ? 'text-primary' : 'text-error'}`}
        >
          {formatCurrency(balance)}
        </p>
      </div>
    </div>
  )
}
