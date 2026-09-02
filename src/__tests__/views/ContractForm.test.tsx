import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ContractForm } from '@/views/components/ContractForm'
import { useClientStore } from '@/viewmodels/client.viewmodel'
import type { Client } from '@/models/client.model'

const testClient = { id: 'cl1', razaoSocial: 'Cliente Teste', cnpj: '00.000.000/0001-00' } as Client

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

beforeEach(() => {
  useClientStore.setState({
    clients: [testClient],
    loading: false,
    error: null,
    search: '',
  })
})

it('exibe erros de validação ao submeter formulário vazio', async () => {
  const onSubmit = jest.fn()
  render(<ContractForm onSubmit={onSubmit} />)
  fireEvent.click(screen.getByRole('button', { name: /salvar/i }))
  await waitFor(() => {
    expect(screen.getByTestId('error-clientId')).toBeInTheDocument()
  })
  expect(onSubmit).not.toHaveBeenCalled()
})

it('chama onSubmit com dados convertidos e arquivo em submit válido', async () => {
  const onSubmit = jest.fn().mockResolvedValue(undefined)
  render(<ContractForm onSubmit={onSubmit} />)

  fireEvent.change(screen.getByLabelText(/descrição/i), { target: { value: 'Contrato novo' } })
  fireEvent.change(screen.getByLabelText(/data de início/i), { target: { value: '2026-01-01' } })
  fireEvent.change(screen.getByLabelText(/data de término/i), { target: { value: '2026-12-31' } })
  fireEvent.change(screen.getByLabelText(/valor do contrato/i), { target: { value: '4200' } })
  fireEvent.change(screen.getByLabelText(/recorrente/i), { target: { value: 'true' } })

  const clientInput = screen.getByPlaceholderText(/buscar cliente/i)
  fireEvent.change(clientInput, { target: { value: 'Cliente' } })
  fireEvent.mouseDown(screen.getByText('Cliente Teste'))

  const file = new File(['conteudo'], 'contrato.pdf', { type: 'application/pdf' })
  const fileInput = screen.getByLabelText(/contrato pdf/i)
  fireEvent.change(fileInput, { target: { files: [file] } })
  expect(screen.getByTestId('file-preview')).toHaveTextContent('contrato.pdf')

  fireEvent.click(screen.getByRole('button', { name: /salvar/i }))

  await waitFor(() => {
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        clientId: 'cl1',
        description: 'Contrato novo',
        recurring: true,
        contractValue: 4200,
      }),
      file
    )
  })
})

it('desabilita o botão salvar quando loading=true', () => {
  render(<ContractForm onSubmit={jest.fn()} loading />)
  expect(screen.getByRole('button')).toBeDisabled()
})

it('não renderiza botão salvar quando hideButtons=true', () => {
  render(<ContractForm onSubmit={jest.fn()} hideButtons />)
  expect(screen.queryByRole('button', { name: /salvar/i })).not.toBeInTheDocument()
})

it('pré-preenche os campos a partir de initialData', () => {
  render(
    <ContractForm
      onSubmit={jest.fn()}
      initialData={{
        clientId: 'cl1',
        description: 'Descrição existente',
        startDate: '2026-02-01',
        endDate: '2026-03-01',
        contractValue: 999,
      }}
    />
  )
  expect(screen.getByLabelText(/descrição/i)).toHaveValue('Descrição existente')
  expect(screen.getByLabelText(/valor do contrato/i)).toHaveValue(999)
})
