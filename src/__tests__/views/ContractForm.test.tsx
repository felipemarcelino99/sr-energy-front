import { render, screen } from '@testing-library/react'
import { ContractForm } from '@/views/components/ContractForm'

it('renderiza select de recorrência com opções Sim/Não', () => {
  render(<ContractForm onSubmit={jest.fn()} />)
  expect(screen.getByLabelText(/recorrente/i)).toBeInTheDocument()
  expect(screen.getByRole('option', { name: /não recorrente/i })).toBeInTheDocument()
  expect(screen.getByRole('option', { name: /^recorrente$/i })).toBeInTheDocument()
})

it('select de recorrência tem valor padrão "false" (Não recorrente)', () => {
  render(<ContractForm onSubmit={jest.fn()} />)
  const select = screen.getByLabelText(/recorrente/i) as HTMLSelectElement
  expect(select.value).toBe('false')
})
