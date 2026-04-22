interface Props {
  totalCredits: number
  totalDebits: number
  balance: number
}

function formatCurrency(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export function FinancialSummaryCards({ totalCredits, totalDebits, balance }: Props) {
  const balanceColor = balance >= 0 ? '#16A34A' : '#E53E3E'
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div style={{ background: '#fff', border: '1px solid #E2E5EA', borderRadius: 8, padding: '18px 20px', boxShadow: '0 1px 3px rgba(0,0,0,.08)' }}>
        <p style={{ fontSize: 11, fontWeight: 600, color: '#777', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 6 }}>Entradas</p>
        <p style={{ fontSize: 22, fontWeight: 700, color: '#16A34A', fontFamily: "'JetBrains Mono', monospace" }}>{formatCurrency(totalCredits)}</p>
      </div>

      <div style={{ background: '#fff', border: '1px solid #E2E5EA', borderRadius: 8, padding: '18px 20px', boxShadow: '0 1px 3px rgba(0,0,0,.08)' }}>
        <p style={{ fontSize: 11, fontWeight: 600, color: '#777', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 6 }}>Saídas</p>
        <p style={{ fontSize: 22, fontWeight: 700, color: '#E53E3E', fontFamily: "'JetBrains Mono', monospace" }}>{formatCurrency(totalDebits)}</p>
      </div>

      <div style={{ background: '#fff', border: '1px solid #E2E5EA', borderRadius: 8, padding: '18px 20px', boxShadow: '0 1px 3px rgba(0,0,0,.08)' }}>
        <p style={{ fontSize: 11, fontWeight: 600, color: '#777', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 6 }}>Saldo</p>
        <p data-testid="balance-value" style={{ fontSize: 22, fontWeight: 700, color: balanceColor, fontFamily: "'JetBrains Mono', monospace" }}>
          {formatCurrency(balance)}
        </p>
      </div>
    </div>
  )
}
