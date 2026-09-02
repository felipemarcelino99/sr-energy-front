import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ChangePasswordPage } from '@/views/pages/ChangePasswordPage'
import { supabase } from '@/services/supabase'

jest.mock('@/services/supabase', () => ({
  supabase: {
    auth: {
      updateUser: jest.fn(),
    },
  },
}))

beforeEach(() => {
  jest.clearAllMocks()
})

function getPasswordInputs(): HTMLInputElement[] {
  return Array.from(document.querySelectorAll('input[type="password"]'))
}

function fillAndSubmit(password: string, confirm: string) {
  const [passwordInput, confirmInput] = getPasswordInputs()
  fireEvent.change(passwordInput, { target: { value: password } })
  fireEvent.change(confirmInput, { target: { value: confirm } })
  fireEvent.click(screen.getByRole('button', { name: /alterar senha/i }))
}

it('renders password fields', () => {
  render(<ChangePasswordPage />)
  expect(screen.getByText(/^nova senha$/i)).toBeInTheDocument()
  expect(screen.getByText(/confirmar nova senha/i)).toBeInTheDocument()
  expect(getPasswordInputs()).toHaveLength(2)
})

it('shows an error and does not call supabase when password is too short', async () => {
  render(<ChangePasswordPage />)
  fillAndSubmit('123', '123')
  await waitFor(() => {
    expect(screen.getByText(/mínimo 6 caracteres/i)).toBeInTheDocument()
  })
  expect(supabase.auth.updateUser).not.toHaveBeenCalled()
})

it('shows an error and does not call supabase when passwords do not match', async () => {
  render(<ChangePasswordPage />)
  fillAndSubmit('senha123', 'outrasenha')
  await waitFor(() => {
    expect(screen.getByText(/senhas não coincidem/i)).toBeInTheDocument()
  })
  expect(supabase.auth.updateUser).not.toHaveBeenCalled()
})

it('shows a generic error when supabase returns an error', async () => {
  ;(supabase.auth.updateUser as jest.Mock).mockResolvedValue({ error: { message: 'boom' } })
  render(<ChangePasswordPage />)
  fillAndSubmit('senha123', 'senha123')
  await waitFor(() => {
    expect(screen.getByText(/erro ao alterar senha/i)).toBeInTheDocument()
  })
})

it('calls supabase.auth.updateUser and shows success message on valid submit', async () => {
  ;(supabase.auth.updateUser as jest.Mock).mockResolvedValue({ error: null })
  render(<ChangePasswordPage />)
  fillAndSubmit('senha123', 'senha123')
  await waitFor(() => {
    expect(supabase.auth.updateUser).toHaveBeenCalledWith({ password: 'senha123' })
  })
  await waitFor(() => {
    expect(screen.getByText(/senha alterada com sucesso/i)).toBeInTheDocument()
  })
  expect(getPasswordInputs()[0].value).toBe('')
})
