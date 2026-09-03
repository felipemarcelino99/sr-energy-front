import { Card } from '@/views/components/ui/Card'

interface Props {
  totalCredits: number
  totalDebits: number
  balance: number
}

function formatCurrency(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

const labelStyle: React.CSSProperties = {
  fontSize: 'var(--font-size-xs)',
  fontWeight: 600,
  color: 'var(--color-text-muted)',
  textTransform: 'uppercase',
  letterSpacing: '.05em',
  marginBottom: 'var(--space-2)',
}

export function FinancialSummaryCards({ totalCredits, totalDebits, balance }: Props) {
  const balanceColorClass = balance >= 0 ? 'text-success' : 'text-error'
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card padding="lg">
        <p style={labelStyle}>Entradas</p>
        <p
          className="num"
          style={{ fontSize: 'var(--font-size-xl)', fontWeight: 700, color: '#16A34A' }}
        >
          {formatCurrency(totalCredits)}
        </p>
      </Card>

      <Card padding="lg">
        <p style={labelStyle}>Saídas</p>
        <p
          className="num"
          style={{ fontSize: 'var(--font-size-xl)', fontWeight: 700, color: '#E53E3E' }}
        >
          {formatCurrency(totalDebits)}
        </p>
      </Card>

      <Card padding="lg">
        <p style={labelStyle}>Saldo</p>
        <p
          data-testid="balance-value"
          className={`num ${balanceColorClass}`}
          style={{ fontSize: 'var(--font-size-xl)', fontWeight: 700 }}
        >
          {formatCurrency(balance)}
        </p>
      </Card>
    </div>
  )
}
