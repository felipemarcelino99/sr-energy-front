import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MachineForm } from '@/views/components/MachineForm'

describe('MachineForm — validação', () => {
  it('exibe erros de validação nos campos obrigatórios ao submeter vazio', async () => {
    render(<MachineForm onSubmit={jest.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: /salvar/i }))
    await waitFor(() => {
      expect(screen.getByTestId('error-name')).toBeInTheDocument()
      expect(screen.getByTestId('error-year')).toBeInTheDocument()
    })
  })

  it('não exibe erros antes de submeter', () => {
    render(<MachineForm onSubmit={jest.fn()} />)
    expect(screen.queryByTestId('error-name')).not.toBeInTheDocument()
    expect(screen.queryByTestId('error-year')).not.toBeInTheDocument()
  })

  it('exibe preview do nome do arquivo após seleção', async () => {
    render(<MachineForm onSubmit={jest.fn()} />)
    const file = new File(['content'], 'manual.pdf', { type: 'application/pdf' })
    const input = screen.getByLabelText(/manual/i)
    fireEvent.change(input, { target: { files: [file] } })
    await waitFor(() => {
      expect(screen.getByTestId('file-preview')).toHaveTextContent('manual.pdf')
    })
  })

  it('chama onSubmit com dados válidos', async () => {
    const onSubmit = jest.fn().mockResolvedValue(undefined)
    render(<MachineForm onSubmit={onSubmit} />)

    fireEvent.change(screen.getByLabelText(/nome/i), { target: { value: 'Torno CNC' } })
    fireEvent.change(screen.getByLabelText(/marca/i), { target: { value: 'Romi' } })
    fireEvent.change(screen.getByLabelText(/modelo/i), { target: { value: 'D800' } })
    fireEvent.change(screen.getByLabelText(/série/i), { target: { value: 'SN-001' } })
    fireEvent.change(screen.getByLabelText(/ano/i), { target: { value: '2020' } })

    fireEvent.click(screen.getByRole('button', { name: /salvar/i }))
    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledTimes(1)
    })
  })
})
