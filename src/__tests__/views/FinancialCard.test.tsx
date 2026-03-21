import { render, screen } from '@testing-library/react'
import { FinancialCard } from '@/views/components/FinancialCard'

describe('FinancialCard', () => {
  it('exibe entradas, saídas e saldo formatados em BRL', () => {
    render(
      <FinancialCard summary={{ totalIncome: 8000, totalExpense: 1500, balance: 6500 }} />
    )
    expect(screen.getByTestId('total-income').textContent).toContain('8.000')
    expect(screen.getByTestId('total-expense').textContent).toContain('1.500')
    expect(screen.getByTestId('balance').textContent).toContain('6.500')
  })

  it('exibe saldo negativo com cor de erro', () => {
    render(
      <FinancialCard summary={{ totalIncome: 1000, totalExpense: 3000, balance: -2000 }} />
    )
    const balance = screen.getByTestId('balance')
    expect(balance.className).toContain('text-error')
  })
})
