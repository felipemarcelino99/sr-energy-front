import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { EmployeeForm } from '@/views/components/EmployeeForm'

describe('EmployeeForm — validação', () => {
  it('exibe erros de validação nos campos obrigatórios ao submeter vazio', async () => {
    render(<EmployeeForm onSubmit={jest.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: /salvar/i }))
    await waitFor(() => {
      expect(screen.getByTestId('error-name')).toBeInTheDocument()
      expect(screen.getByTestId('error-salary')).toBeInTheDocument()
    })
  })

  it('não exibe erros antes de submeter', () => {
    render(<EmployeeForm onSubmit={jest.fn()} />)
    expect(screen.queryByTestId('error-name')).not.toBeInTheDocument()
    expect(screen.queryByTestId('error-salary')).not.toBeInTheDocument()
  })

  it('chama onSubmit com dados válidos', async () => {
    const onSubmit = jest.fn().mockResolvedValue(undefined)
    render(<EmployeeForm onSubmit={onSubmit} />)

    fireEvent.change(screen.getByLabelText(/nome/i), { target: { value: 'Ana Silva' } })
    fireEvent.change(screen.getByLabelText(/e-mail/i), { target: { value: 'ana@example.com' } })
    fireEvent.change(screen.getByLabelText(/telefone/i), { target: { value: '11999999999' } })
    fireEvent.change(screen.getByLabelText(/salário/i), { target: { value: '5000' } })
    fireEvent.change(screen.getByLabelText(/contratação/i), { target: { value: '2024-01-15' } })

    fireEvent.click(screen.getByRole('button', { name: /salvar/i }))
    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledTimes(1)
    })
  })
})
