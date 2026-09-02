import { render, screen, fireEvent, act, waitFor } from '@testing-library/react'
import { MemoryRouter, useNavigate } from 'react-router-dom'
import { LoginPage } from '@/views/pages/LoginPage'
import { useAuth } from '@/viewmodels/auth.context'

jest.mock('@/viewmodels/auth.context')
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: jest.fn(),
}))

function fillForm(email = 'user@srenergia.com.br', password = 'senha123') {
  fireEvent.change(screen.getByLabelText('E-mail'), { target: { value: email } })
  fireEvent.change(screen.getByLabelText('Senha'), { target: { value: password } })
}

async function submit() {
  fireEvent.click(screen.getByRole('button', { name: /entrar|aguarde/i }))
  await act(async () => {})
}

beforeEach(() => {
  jest.clearAllMocks()
})

it('mostra erros de validação quando os campos são inválidos', async () => {
  ;(useAuth as jest.Mock).mockReturnValue({ login: jest.fn(), loading: false })
  render(
    <MemoryRouter>
      <LoginPage />
    </MemoryRouter>
  )
  fillForm('email-invalido', '123')
  await submit()
  expect(await screen.findByText('E-mail inválido')).toBeInTheDocument()
  expect(screen.getByText('Senha deve ter ao menos 6 caracteres')).toBeInTheDocument()
})

it('faz login com sucesso e navega para /dashboard quando role é employee', async () => {
  const navigate = jest.fn()
  ;(useNavigate as unknown as jest.Mock).mockReturnValue(navigate)
  const login = jest.fn().mockResolvedValue({ role: 'employee' })
  ;(useAuth as jest.Mock).mockReturnValue({ login, loading: false })
  render(
    <MemoryRouter>
      <LoginPage />
    </MemoryRouter>
  )
  fillForm()
  await submit()
  await waitFor(() => {
    expect(login).toHaveBeenCalledWith({ email: 'user@srenergia.com.br', password: 'senha123' })
  })
  expect(navigate).toHaveBeenCalledWith('/dashboard', { replace: true })
})

it('faz login com sucesso e navega para / quando role não é employee', async () => {
  const navigate = jest.fn()
  ;(useNavigate as unknown as jest.Mock).mockReturnValue(navigate)
  const login = jest.fn().mockResolvedValue({ role: 'manager' })
  ;(useAuth as jest.Mock).mockReturnValue({ login, loading: false })
  render(
    <MemoryRouter>
      <LoginPage />
    </MemoryRouter>
  )
  fillForm()
  await submit()
  await waitFor(() => {
    expect(navigate).toHaveBeenCalledWith('/', { replace: true })
  })
})

it('mostra erro do servidor numa tentativa mal-sucedida isolada (sem travar)', async () => {
  const login = jest.fn().mockRejectedValue(new Error('Credenciais inválidas'))
  ;(useAuth as jest.Mock).mockReturnValue({ login, loading: false })
  render(
    <MemoryRouter>
      <LoginPage />
    </MemoryRouter>
  )
  fillForm()
  await submit()
  expect(await screen.findByRole('alert')).toHaveTextContent('Credenciais inválidas')
  expect(screen.getByRole('button', { name: 'Entrar' })).not.toBeDisabled()
})

describe('lockout após MAX_ATTEMPTS tentativas falhas', () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('trava o formulário, atualiza contagem regressiva e destrava depois de LOCKOUT_MS', async () => {
    const login = jest.fn().mockRejectedValue(new Error('Credenciais inválidas'))
    ;(useAuth as jest.Mock).mockReturnValue({ login, loading: false })
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    )

    fillForm()

    // 5 tentativas falhas consecutivas (MAX_ATTEMPTS)
    for (let i = 0; i < 5; i++) {
      fireEvent.click(screen.getByRole('button', { name: /entrar|aguarde/i }))
      await act(async () => {
        await Promise.resolve()
      })
    }

    expect(login).toHaveBeenCalledTimes(5)
    expect(screen.getByRole('button')).toHaveTextContent('Aguarde 30s')
    expect(screen.getByRole('button')).toBeDisabled()

    act(() => {
      jest.advanceTimersByTime(5000)
    })
    expect(screen.getByRole('button')).toHaveTextContent('Aguarde 25s')

    act(() => {
      jest.advanceTimersByTime(25_000)
    })

    await waitFor(() => {
      expect(screen.getByRole('button')).toHaveTextContent('Entrar')
    })
    expect(screen.getByRole('button')).not.toBeDisabled()
  })
})
