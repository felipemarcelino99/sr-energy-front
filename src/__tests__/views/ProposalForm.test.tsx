import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ProposalForm } from '@/views/components/ProposalForm'
import { useClientStore } from '@/viewmodels/client.viewmodel'
import type { Client } from '@/models/client.model'

const testClient = { id: 'cl1', razaoSocial: 'Cliente Teste', cnpj: '00.000.000/0001-00' } as Client

beforeEach(() => {
  useClientStore.setState({
    clients: [testClient],
    loading: false,
    error: null,
    search: '',
  })
})

it('renderiza campo de busca de cliente e campo de link de arquivo', () => {
  render(<ProposalForm onSubmit={jest.fn()} />)
  expect(screen.getByPlaceholderText(/buscar cliente/i)).toBeInTheDocument()
  expect(screen.getByLabelText(/link do arquivo/i)).toBeInTheDocument()
})

it('exibe erros de validação ao submeter formulário vazio', async () => {
  const onSubmit = jest.fn()
  render(<ProposalForm onSubmit={onSubmit} />)
  fireEvent.submit(screen.getByRole('button', { name: /salvar/i }).closest('form')!)
  await waitFor(() => {
    expect(screen.getByTestId('error-clientId')).toBeInTheDocument()
  })
  expect(screen.getByTestId('error-description')).toBeInTheDocument()
  expect(onSubmit).not.toHaveBeenCalled()
})

it('chama onSubmit com dados convertidos (recurring boolean, contractValue number) em submit válido', async () => {
  const onSubmit = jest.fn().mockResolvedValue(undefined)
  render(<ProposalForm onSubmit={onSubmit} />)

  fireEvent.change(screen.getByLabelText(/descrição/i), { target: { value: 'Proposta nova' } })
  fireEvent.change(screen.getByLabelText(/data de início/i), { target: { value: '2026-01-01' } })
  fireEvent.change(screen.getByLabelText(/data de término/i), { target: { value: '2026-12-31' } })
  fireEvent.change(screen.getByLabelText(/valor da proposta/i), { target: { value: '3500' } })
  fireEvent.change(screen.getByLabelText(/recorrente/i), { target: { value: 'true' } })

  const clientInput = screen.getByPlaceholderText(/buscar cliente/i)
  fireEvent.change(clientInput, { target: { value: 'Cliente' } })
  fireEvent.mouseDown(screen.getByText('Cliente Teste'))

  fireEvent.click(screen.getByRole('button', { name: /salvar/i }))

  await waitFor(() => {
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        clientId: 'cl1',
        description: 'Proposta nova',
        recurring: true,
        contractValue: 3500,
      })
    )
  })
})

it('desabilita o botão salvar quando loading=true', () => {
  render(<ProposalForm onSubmit={jest.fn()} loading />)
  expect(screen.getByRole('button')).toBeDisabled()
})

it('não renderiza botão salvar quando hideButtons=true', () => {
  render(<ProposalForm onSubmit={jest.fn()} hideButtons />)
  expect(screen.queryByRole('button', { name: /salvar/i })).not.toBeInTheDocument()
})

it('pré-preenche os campos a partir de initialData', () => {
  render(
    <ProposalForm
      onSubmit={jest.fn()}
      initialData={{
        clientId: 'cl1',
        description: 'Descrição existente',
        startDate: '2026-02-01',
        endDate: '2026-03-01',
        contractValue: 999,
        fileUrl: 'https://files/x.pdf',
      }}
    />
  )
  expect(screen.getByLabelText(/descrição/i)).toHaveValue('Descrição existente')
  expect(screen.getByLabelText(/link do arquivo/i)).toHaveValue('https://files/x.pdf')
  expect(screen.getByLabelText(/valor da proposta/i)).toHaveValue(999)
})
