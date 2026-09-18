import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ProposalForm } from '@/views/components/ProposalForm'
import { useClientStore } from '@/viewmodels/client.viewmodel'
import { fetchContractsByClient } from '@/services/contract.service'
import type { Client } from '@/models/client.model'

jest.mock('@/services/contract.service')

const testClient = { id: 'cl1', razaoSocial: 'Cliente Teste', cnpj: '00.000.000/0001-00' } as Client

function renderForm(props?: Partial<React.ComponentProps<typeof ProposalForm>>) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <ProposalForm onSubmit={jest.fn()} {...props} />
    </QueryClientProvider>
  )
}

beforeEach(() => {
  jest.clearAllMocks()
  useClientStore.setState({
    clients: [testClient],
    loading: false,
    error: null,
    search: '',
  })
  ;(fetchContractsByClient as jest.Mock).mockResolvedValue([])
})

it('renderiza campo de busca de cliente e campo de link de arquivo', () => {
  renderForm()
  expect(screen.getByPlaceholderText(/buscar cliente/i)).toBeInTheDocument()
  expect(screen.getByLabelText(/link do arquivo/i)).toBeInTheDocument()
})

it('não renderiza mais um campo de data de término (endDate foi removido)', () => {
  renderForm()
  expect(screen.queryByLabelText(/data de término/i)).not.toBeInTheDocument()
})

it('rotula a data de início como opcional', () => {
  renderForm()
  expect(screen.getByLabelText(/data de início/i)).toBeInTheDocument()
  expect(document.querySelector('label[for="startDate"]')?.textContent).toMatch(/opcional/i)
})

it('exibe o seletor de contrato vinculado desabilitado até selecionar um cliente', () => {
  renderForm()
  const contractSelect = screen.getByLabelText(/contrato vinculado/i)
  expect(contractSelect).toBeDisabled()
})

it('habilita e carrega o seletor de contrato vinculado ao selecionar um cliente', async () => {
  ;(fetchContractsByClient as jest.Mock).mockResolvedValue([
    { id: 'ct1', number: 'CT-0001', description: 'Locação anual' },
  ])
  renderForm()

  const clientInput = screen.getByPlaceholderText(/buscar cliente/i)
  fireEvent.change(clientInput, { target: { value: 'Cliente' } })
  fireEvent.mouseDown(screen.getByText('Cliente Teste'))

  await waitFor(() => {
    expect(fetchContractsByClient).toHaveBeenCalledWith('cl1')
  })
  expect(screen.getByLabelText(/contrato vinculado/i)).toBeEnabled()
  await waitFor(() => {
    expect(screen.getByText(/CT-0001/)).toBeInTheDocument()
  })
})

it('limpa o contrato selecionado ao trocar de cliente', async () => {
  ;(fetchContractsByClient as jest.Mock).mockResolvedValue([
    { id: 'ct1', number: 'CT-0001', description: 'Locação anual' },
  ])
  renderForm({ initialData: { clientId: 'cl1', contractId: 'ct1' } })

  await waitFor(() => {
    expect((screen.getByLabelText(/contrato vinculado/i) as HTMLSelectElement).value).toBe('ct1')
  })

  const clientInput = screen.getByPlaceholderText(/buscar cliente/i)
  fireEvent.change(clientInput, { target: { value: '' } })

  await waitFor(() => {
    expect((screen.getByLabelText(/contrato vinculado/i) as HTMLSelectElement).value).toBe('')
  })
})

it('exibe erros de validação ao submeter formulário vazio', async () => {
  const onSubmit = jest.fn()
  renderForm({ onSubmit })
  fireEvent.submit(screen.getByRole('button', { name: /salvar/i }).closest('form')!)
  await waitFor(() => {
    expect(screen.getByTestId('error-clientId')).toBeInTheDocument()
  })
  expect(screen.getByTestId('error-description')).toBeInTheDocument()
  expect(onSubmit).not.toHaveBeenCalled()
})

it('chama onSubmit com dados convertidos (recurring boolean, contractValue number) sem exigir data ou contrato', async () => {
  const onSubmit = jest.fn().mockResolvedValue(undefined)
  renderForm({ onSubmit })

  fireEvent.change(screen.getByLabelText(/descrição/i), { target: { value: 'Proposta nova' } })
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
  const submitted = onSubmit.mock.calls[0][0]
  expect(submitted.startDate).toBeUndefined()
  expect(submitted.contractId).toBeUndefined()
})

it('inclui a data de início e o contrato vinculado no payload quando preenchidos', async () => {
  ;(fetchContractsByClient as jest.Mock).mockResolvedValue([
    { id: 'ct1', number: 'CT-0001', description: 'Locação anual' },
  ])
  const onSubmit = jest.fn().mockResolvedValue(undefined)
  renderForm({ onSubmit })

  fireEvent.change(screen.getByLabelText(/descrição/i), { target: { value: 'Proposta nova' } })
  fireEvent.change(screen.getByLabelText(/valor da proposta/i), { target: { value: '3500' } })

  const clientInput = screen.getByPlaceholderText(/buscar cliente/i)
  fireEvent.change(clientInput, { target: { value: 'Cliente' } })
  fireEvent.mouseDown(screen.getByText('Cliente Teste'))

  fireEvent.change(screen.getByLabelText(/data de início/i), { target: { value: '2026-01-15' } })
  await waitFor(() => {
    expect(screen.getByText(/CT-0001/)).toBeInTheDocument()
  })
  fireEvent.change(screen.getByLabelText(/contrato vinculado/i), { target: { value: 'ct1' } })

  fireEvent.click(screen.getByRole('button', { name: /salvar/i }))

  await waitFor(() => {
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ startDate: '2026-01-15', contractId: 'ct1' })
    )
  })
})

it('desabilita o botão salvar quando loading=true', () => {
  renderForm({ loading: true })
  expect(screen.getByRole('button')).toBeDisabled()
})

it('não renderiza botão salvar quando hideButtons=true', () => {
  renderForm({ hideButtons: true })
  expect(screen.queryByRole('button', { name: /salvar/i })).not.toBeInTheDocument()
})

it('pré-preenche os campos a partir de initialData', () => {
  renderForm({
    initialData: {
      clientId: 'cl1',
      description: 'Descrição existente',
      startDate: '2026-02-01',
      contractValue: 999,
      fileUrl: 'https://files/x.pdf',
    },
  })
  expect(screen.getByLabelText(/descrição/i)).toHaveValue('Descrição existente')
  expect(screen.getByLabelText(/link do arquivo/i)).toHaveValue('https://files/x.pdf')
  expect(screen.getByLabelText(/valor da proposta/i)).toHaveValue(999)
  expect(screen.getByLabelText(/data de início/i)).toHaveValue('2026-02-01')
})
