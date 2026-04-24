import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ClientSearchSelect } from '@/views/components/ClientSearchSelect'
import { useClientStore } from '@/viewmodels/client.viewmodel'
import type { Client } from '@/models/client.model'

const mockClient: Client = {
  id: '1',
  razaoSocial: 'Empresa Alfa Ltda',
  cnpj: '11.222.333/0001-81',
  segmento: 'Industrial',
  endereco: { logradouro: 'R. A', numero: '1', bairro: 'B', cidade: 'SP', estado: 'SP', cep: '01001-000' },
  email: 'alfa@empresa.com',
  status: 'active',
  createdAt: '2024-01-01',
  updatedAt: '2024-01-01',
}

beforeEach(() => {
  useClientStore.setState({ clients: [mockClient], loading: false, error: null, search: '' })
})

describe('ClientSearchSelect', () => {
  it('renderiza input de busca', () => {
    render(<ClientSearchSelect value="" onChange={jest.fn()} />)
    expect(screen.getByPlaceholderText(/buscar cliente/i)).toBeInTheDocument()
  })

  it('exibe sugestões ao digitar', async () => {
    render(<ClientSearchSelect value="" onChange={jest.fn()} />)
    fireEvent.change(screen.getByPlaceholderText(/buscar cliente/i), { target: { value: 'alfa' } })
    await waitFor(() => {
      expect(screen.getByText('Empresa Alfa Ltda')).toBeInTheDocument()
    })
  })

  it('chama onChange com o id do cliente ao selecionar', async () => {
    const onChange = jest.fn()
    render(<ClientSearchSelect value="" onChange={onChange} />)
    fireEvent.change(screen.getByPlaceholderText(/buscar cliente/i), { target: { value: 'alfa' } })
    await waitFor(() => screen.getByText('Empresa Alfa Ltda'))
    fireEvent.mouseDown(screen.getByText('Empresa Alfa Ltda'))
    expect(onChange).toHaveBeenCalledWith('1')
  })

  it('exibe a razão social quando value é um clientId válido', () => {
    render(<ClientSearchSelect value="1" onChange={jest.fn()} />)
    expect(screen.getByDisplayValue('Empresa Alfa Ltda')).toBeInTheDocument()
  })

  it('fica desabilitado quando disabled=true', () => {
    render(<ClientSearchSelect value="" onChange={jest.fn()} disabled />)
    expect(screen.getByPlaceholderText(/buscar cliente/i)).toBeDisabled()
  })
})
