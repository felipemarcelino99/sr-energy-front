import { render, screen } from '@testing-library/react'
import { FinancialSummaryCards } from '@/views/components/FinancialSummaryCards'

describe('FinancialSummaryCards', () => {
  it('exibe valores formatados com R$', () => {
    render(
      <FinancialSummaryCards
        totalCredits={5000}
        totalDebits={2000}
        balance={3000}
      />
    )
    expect(screen.getByText(/R\$\s*5\.000/)).toBeInTheDocument()
    expect(screen.getByText(/R\$\s*2\.000/)).toBeInTheDocument()
    expect(screen.getByText(/R\$\s*3\.000/)).toBeInTheDocument()
  })

  it('exibe saldo negativo em vermelho', () => {
    render(
      <FinancialSummaryCards
        totalCredits={1000}
        totalDebits={3000}
        balance={-2000}
      />
    )
    const balanceEl = screen.getByTestId('balance-value')
    expect(balanceEl).toHaveClass('text-error')
  })
})
