import { render, screen } from '@testing-library/react'
import { ClientForm } from '@/views/components/ClientForm'
import { useClientStore } from '@/viewmodels/client.viewmodel'

beforeEach(() => {
  useClientStore.setState({ clients: [], loading: false, error: null, search: '' })
})

describe('ClientForm', () => {
  it('renderiza campo Razão Social', () => {
    render(<ClientForm onSubmit={jest.fn()} />)
    expect(screen.getByLabelText(/razão social/i)).toBeInTheDocument()
  })

  it('renderiza campo CNPJ', () => {
    render(<ClientForm onSubmit={jest.fn()} />)
    expect(screen.getByLabelText(/cnpj/i)).toBeInTheDocument()
  })

  it('renderiza campo E-mail', () => {
    render(<ClientForm onSubmit={jest.fn()} />)
    expect(screen.getByLabelText(/e-mail/i)).toBeInTheDocument()
  })

  it('renderiza select de Segmento', () => {
    render(<ClientForm onSubmit={jest.fn()} />)
    expect(screen.getByLabelText(/segmento/i)).toBeInTheDocument()
  })

  it('renderiza select de Status com opções Ativo/Inativo', () => {
    render(<ClientForm onSubmit={jest.fn()} />)
    expect(screen.getByLabelText(/status/i)).toBeInTheDocument()
    expect(screen.getByRole('option', { name: /^ativo$/i })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: /^inativo$/i })).toBeInTheDocument()
  })

  it('renderiza campos de endereço', () => {
    render(<ClientForm onSubmit={jest.fn()} />)
    expect(screen.getByLabelText(/logradouro/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/cidade/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/cep/i)).toBeInTheDocument()
  })

  it('preenche initialData quando fornecido', () => {
    render(
      <ClientForm
        onSubmit={jest.fn()}
        initialData={{
          razaoSocial: 'Empresa XYZ',
          cnpj: '11.222.333/0001-81',
          segmento: 'Industrial',
          email: 'xyz@empresa.com',
          status: 'active',
          endereco: { logradouro: 'Rua A', numero: '1', bairro: 'B', cidade: 'SP', estado: 'SP', cep: '01001-000' },
        }}
      />
    )
    expect(screen.getByDisplayValue('Empresa XYZ')).toBeInTheDocument()
  })
})
