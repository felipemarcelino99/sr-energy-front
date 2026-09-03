import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ClientStepper } from '@/views/components/ClientStepper'
import { useClientStore } from '@/viewmodels/client.viewmodel'

beforeEach(() => {
  useClientStore.setState({ clients: [], loading: false, error: null, search: '' })
})

describe('ClientStepper — passo 1 (Dados Cadastrais)', () => {
  it('renderiza campo Razão Social', () => {
    render(<ClientStepper onSubmit={jest.fn()} />)
    expect(screen.getByLabelText(/razão social/i)).toBeInTheDocument()
  })

  it('renderiza campo CNPJ', () => {
    render(<ClientStepper onSubmit={jest.fn()} />)
    expect(screen.getByLabelText(/cnpj/i)).toBeInTheDocument()
  })

  it('renderiza campo E-mail', () => {
    render(<ClientStepper onSubmit={jest.fn()} />)
    expect(screen.getByLabelText(/e-mail/i)).toBeInTheDocument()
  })

  it('renderiza select de Segmento', () => {
    render(<ClientStepper onSubmit={jest.fn()} />)
    expect(screen.getByLabelText(/segmento/i)).toBeInTheDocument()
  })

  it('renderiza select de Status com opções Ativo/Inativo', () => {
    render(<ClientStepper onSubmit={jest.fn()} />)
    expect(screen.getByLabelText(/status/i)).toBeInTheDocument()
    expect(screen.getByRole('option', { name: /^ativo$/i })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: /^inativo$/i })).toBeInTheDocument()
  })

  it('não avança para o passo 2 se campos obrigatórios estão vazios', async () => {
    render(<ClientStepper onSubmit={jest.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: /próximo/i }))
    await waitFor(() => {
      expect(screen.getByText(/razão social é obrigatória/i)).toBeInTheDocument()
    })
    expect(screen.queryByLabelText(/logradouro/i)).not.toBeInTheDocument()
  })

  it('preenche initialData quando fornecido', () => {
    render(
      <ClientStepper
        onSubmit={jest.fn()}
        initialData={{
          razaoSocial: 'Empresa XYZ',
          cnpj: '11.222.333/0001-81',
          segmento: 'Industrial',
          email: 'xyz@empresa.com',
          status: 'active',
          endereco: {
            logradouro: 'Rua A',
            numero: '1',
            bairro: 'B',
            cidade: 'SP',
            estado: 'SP',
            cep: '01001-000',
          },
        }}
      />
    )
    expect(screen.getByDisplayValue('Empresa XYZ')).toBeInTheDocument()
  })
})

function fillStep1() {
  fireEvent.change(screen.getByLabelText(/razão social/i), { target: { value: 'Empresa XYZ' } })
  fireEvent.change(screen.getByLabelText(/cnpj/i), { target: { value: '11.222.333/0001-81' } })
  fireEvent.change(screen.getByLabelText(/segmento/i), { target: { value: 'Industrial' } })
  fireEvent.change(screen.getByLabelText(/e-mail/i), { target: { value: 'xyz@empresa.com' } })
  fireEvent.click(screen.getByRole('button', { name: /próximo/i }))
}

describe('ClientStepper — passo 2 (Endereço)', () => {
  it('avança para o passo 2 com dados válidos no passo 1', async () => {
    render(<ClientStepper onSubmit={jest.fn()} />)
    fillStep1()
    await waitFor(() => {
      expect(screen.getByLabelText(/logradouro/i)).toBeInTheDocument()
    })
  })

  it('renderiza campos de endereço', async () => {
    render(<ClientStepper onSubmit={jest.fn()} />)
    fillStep1()
    await waitFor(() => screen.getByLabelText(/logradouro/i))
    expect(screen.getByLabelText(/cidade/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/cep/i)).toBeInTheDocument()
  })

  it('chama onSubmit com os dados completos ao clicar em Salvar', async () => {
    const onSubmit = jest.fn()
    render(<ClientStepper onSubmit={onSubmit} />)
    fillStep1()
    await waitFor(() => screen.getByLabelText(/logradouro/i))

    fireEvent.change(screen.getByLabelText(/cep/i), { target: { value: '01001-000' } })
    fireEvent.change(screen.getByLabelText(/logradouro/i), { target: { value: 'Rua A' } })
    fireEvent.change(screen.getByLabelText(/número/i), { target: { value: '1' } })
    fireEvent.change(screen.getByLabelText(/bairro/i), { target: { value: 'B' } })
    fireEvent.change(screen.getByLabelText(/cidade/i), { target: { value: 'SP' } })
    fireEvent.change(screen.getByLabelText(/estado/i), { target: { value: 'SP' } })
    fireEvent.click(screen.getByRole('button', { name: /salvar/i }))

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          razaoSocial: 'Empresa XYZ',
          endereco: expect.objectContaining({ cidade: 'SP', logradouro: 'Rua A' }),
        })
      )
    })
  })

  it('permite voltar ao passo 1', async () => {
    render(<ClientStepper onSubmit={jest.fn()} />)
    fillStep1()
    await waitFor(() => screen.getByLabelText(/logradouro/i))
    fireEvent.click(screen.getByRole('button', { name: /voltar/i }))
    expect(screen.getByLabelText(/razão social/i)).toBeInTheDocument()
  })
})
