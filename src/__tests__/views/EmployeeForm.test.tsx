import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { EmployeeForm } from '@/views/components/EmployeeForm'

describe('EmployeeForm — validação', () => {
  // jsdom doesn't implement these — the photo preview uses them to build a
  // local URL for the selected file (see EmployeeForm.handlePhotoChange).
  beforeEach(() => {
    ;(URL as unknown as { createObjectURL: jest.Mock }).createObjectURL = jest
      .fn()
      .mockReturnValue('blob:mock-url')
    ;(URL as unknown as { revokeObjectURL: jest.Mock }).revokeObjectURL = jest.fn()
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

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

  it('preenche cor com um valor válido da paleta por padrão, sem exigir seleção manual', async () => {
    const onSubmit = jest.fn().mockResolvedValue(undefined)
    render(<EmployeeForm onSubmit={onSubmit} />)

    fireEvent.change(screen.getByLabelText(/nome/i), { target: { value: 'Ana Silva' } })
    fireEvent.change(screen.getByLabelText(/e-mail/i), { target: { value: 'ana@example.com' } })
    fireEvent.change(screen.getByLabelText(/telefone/i), { target: { value: '11999999999' } })
    fireEvent.change(screen.getByLabelText(/salário/i), { target: { value: '5000' } })
    fireEvent.change(screen.getByLabelText(/contratação/i), { target: { value: '2024-01-15' } })
    fireEvent.click(screen.getByRole('button', { name: /salvar/i }))

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ color: expect.stringMatching(/^#[0-9a-fA-F]{6}$/) }),
        undefined
      )
    })
  })

  it('seleciona uma cor da paleta sugerida ao clicar em um swatch', () => {
    render(<EmployeeForm onSubmit={jest.fn()} />)
    const swatch = screen.getByRole('button', { name: /usar cor #059669/i })
    fireEvent.click(swatch)
    expect(screen.getByLabelText(/cor de identificação/i)).toHaveValue('#059669')
  })

  it('rejeita foto com tipo de arquivo não permitido', async () => {
    render(<EmployeeForm onSubmit={jest.fn()} />)
    const file = new File(['x'], 'foto.gif', { type: 'image/gif' })
    fireEvent.change(screen.getByLabelText(/^foto/i), { target: { files: [file] } })
    await waitFor(() => {
      expect(screen.getByTestId('error-photo')).toHaveTextContent(/jpeg ou png/i)
    })
  })

  it('rejeita foto maior que 5MB', async () => {
    render(<EmployeeForm onSubmit={jest.fn()} />)
    const bigFile = new File(['x'], 'foto.png', { type: 'image/png' })
    Object.defineProperty(bigFile, 'size', { value: 6 * 1024 * 1024 })
    fireEvent.change(screen.getByLabelText(/^foto/i), { target: { files: [bigFile] } })
    await waitFor(() => {
      expect(screen.getByTestId('error-photo')).toHaveTextContent(/5MB/i)
    })
  })

  it('aceita foto válida e envia o arquivo junto com onSubmit', async () => {
    const onSubmit = jest.fn().mockResolvedValue(undefined)
    render(<EmployeeForm onSubmit={onSubmit} />)

    const file = new File(['x'], 'foto.png', { type: 'image/png' })
    fireEvent.change(screen.getByLabelText(/^foto/i), { target: { files: [file] } })
    expect(screen.queryByTestId('error-photo')).not.toBeInTheDocument()

    fireEvent.change(screen.getByLabelText(/nome/i), { target: { value: 'Ana Silva' } })
    fireEvent.change(screen.getByLabelText(/e-mail/i), { target: { value: 'ana@example.com' } })
    fireEvent.change(screen.getByLabelText(/telefone/i), { target: { value: '11999999999' } })
    fireEvent.change(screen.getByLabelText(/salário/i), { target: { value: '5000' } })
    fireEvent.change(screen.getByLabelText(/contratação/i), { target: { value: '2024-01-15' } })
    fireEvent.click(screen.getByRole('button', { name: /salvar/i }))

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ name: 'Ana Silva' }), file)
    })
  })
})
