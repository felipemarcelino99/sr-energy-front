import { render, screen, fireEvent } from '@testing-library/react'
import { SalaryAdjustmentForm } from '@/views/components/SalaryAdjustmentForm'

describe('SalaryAdjustmentForm', () => {
  it('calcula e exibe diferença positiva de salário', () => {
    render(<SalaryAdjustmentForm currentSalary={5000} onSubmit={jest.fn()} />)
    fireEvent.change(screen.getByLabelText(/novo salário/i), { target: { value: '6000' } })
    const diff = screen.getByTestId('salary-diff')
    expect(diff.textContent).toContain('+')
    expect(diff.textContent).toContain('1.000')
  })

  it('calcula e exibe diferença negativa de salário', () => {
    render(<SalaryAdjustmentForm currentSalary={5000} onSubmit={jest.fn()} />)
    fireEvent.change(screen.getByLabelText(/novo salário/i), { target: { value: '4000' } })
    const diff = screen.getByTestId('salary-diff')
    expect(diff.textContent).toContain('-')
    expect(diff.textContent).toContain('1.000')
  })

  it('não exibe diff quando campo de novo salário está vazio', () => {
    render(<SalaryAdjustmentForm currentSalary={5000} onSubmit={jest.fn()} />)
    expect(screen.queryByTestId('salary-diff')).not.toBeInTheDocument()
  })
})
