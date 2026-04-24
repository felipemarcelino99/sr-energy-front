import { render, screen } from '@testing-library/react'
import { ContractForm } from '@/views/components/ContractForm'
import { useClientStore } from '@/viewmodels/client.viewmodel'

beforeEach(() => {
  useClientStore.setState({ clients: [], loading: false, error: null, search: '' })
})

it('renderiza campo de busca de cliente', () => {
  render(<ContractForm onSubmit={jest.fn()} />)
  expect(screen.getByPlaceholderText(/buscar cliente/i)).toBeInTheDocument()
})

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

it('não renderiza campos clientName nem clientCnpj', () => {
  render(<ContractForm onSubmit={jest.fn()} />)
  expect(screen.queryByLabelText(/nome do cliente/i)).not.toBeInTheDocument()
  expect(screen.queryByLabelText(/cnpj do cliente/i)).not.toBeInTheDocument()
})
