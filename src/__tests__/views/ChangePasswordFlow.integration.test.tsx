// Teste de integração cobrindo a suspeita de bug: funcionário/gestor preso em
// /change-password depois de trocar a senha com sucesso. Junta AuthProvider
// (real) + ChangePasswordPage + ProtectedRoute (reais) pra reproduzir o
// fluxo completo.
//
// O mock de supabase abaixo tem uma única fonte de verdade (currentUser),
// igual ao client real: updateUser() atualiza o "usuário" e dispara
// onAuthStateChange('USER_UPDATED', ...) sozinho (como o supabase-js faz de
// fato — _saveSession roda antes do updateUser() resolver pro chamador), e
// getSession() sempre lê esse mesmo estado (nunca fica "desatualizado" em
// relação ao próprio updateUser()).
//
// Investigação: com esse mock fiel, descobrimos que o AuthProvider tinha
// `navigate` nas deps do useEffect que assina onAuthStateChange. Como o app
// usa <BrowserRouter/> (não createBrowserRouter/RouterProvider),
// useNavigate() devolve uma função com identidade instável — ela muda a
// cada troca de rota (useNavigateUnstable no react-router). Isso fazia o
// efeito reassinar o onAuthStateChange e rechamar loadSession() (loading:
// true) a cada navegação do app inteiro, inclusive logo depois do
// navigate() de saída do /change-password — sobrepondo a página de destino
// com o spinner de loading. Corrigido em auth.context.tsx (navigate lido
// via ref, fora das deps do efeito).
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { AuthProvider } from '@/viewmodels/auth.context'
import { ProtectedRoute } from '@/views/components/ProtectedRoute'
import { ChangePasswordPage } from '@/views/pages/ChangePasswordPage'
import { supabase } from '@/services/supabase'

type AuthChangeCallback = (event: string, session: unknown) => void

function makeSupabaseUser(mustChangePassword: boolean) {
  return {
    id: 'user-1',
    email: 'gestor@sr.com',
    user_metadata: { role: 'manager', name: 'Gestor', must_change_password: mustChangePassword },
  }
}

function renderApp() {
  return render(
    <MemoryRouter initialEntries={['/change-password']}>
      <AuthProvider>
        <Routes>
          <Route element={<ProtectedRoute />}>
            <Route path="/change-password" element={<ChangePasswordPage />} />
            <Route path="/" element={<div>Home protegida</div>} />
          </Route>
        </Routes>
      </AuthProvider>
    </MemoryRouter>
  )
}

function getPasswordInputs(): HTMLInputElement[] {
  return Array.from(document.querySelectorAll('input[type="password"]'))
}

describe('fluxo de troca de senha obrigatória (AuthProvider + ChangePasswordPage + ProtectedRoute)', () => {
  let authChangeCallback: AuthChangeCallback = () => {}
  let currentUser = makeSupabaseUser(true)

  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
    currentUser = makeSupabaseUser(true)
    ;(supabase.auth.getSession as jest.Mock).mockImplementation(() =>
      Promise.resolve({ data: { session: { user: currentUser } } })
    )
    ;(supabase.auth.onAuthStateChange as jest.Mock).mockImplementation((cb: AuthChangeCallback) => {
      authChangeCallback = cb
      return { data: { subscription: { unsubscribe: jest.fn() } } }
    })
    // Simula o comportamento real do supabase-js: updateUser() atualiza a
    // sessão internamente e notifica onAuthStateChange ANTES de resolver a
    // Promise pro chamador.
    ;(supabase.auth.updateUser as jest.Mock).mockImplementation(
      async (payload: { password: string; data?: Record<string, unknown> }) => {
        currentUser = {
          ...currentUser,
          user_metadata: { ...currentUser.user_metadata, ...payload.data },
        }
        authChangeCallback('USER_UPDATED', { user: currentUser })
        return { error: null }
      }
    )
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('sai de /change-password sem ficar preso depois de trocar a senha', async () => {
    renderApp()

    // aguarda loadSession() resolver e a página renderizar com o usuário
    // "preso" em /change-password (mustChangePassword: true)
    await waitFor(() => expect(getPasswordInputs()).toHaveLength(2))

    const [passwordInput, confirmInput] = getPasswordInputs()
    fireEvent.change(passwordInput, { target: { value: 'novaSenha123' } })
    fireEvent.change(confirmInput, { target: { value: 'novaSenha123' } })

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /alterar senha/i }))
    })

    await waitFor(() => expect(supabase.auth.updateUser).toHaveBeenCalled())

    act(() => {
      jest.advanceTimersByTime(1200)
    })

    await waitFor(() => expect(screen.getByText('Home protegida')).toBeInTheDocument())
    expect(screen.queryByRole('button', { name: /alterar senha/i })).not.toBeInTheDocument()

    // regressão: o efeito de auth não deve reassinar onAuthStateChange (e
    // portanto não deve rechamar loadSession()/getSession()) por causa da
    // troca de rota disparada pelo navigate() da própria página.
    expect(supabase.auth.onAuthStateChange).toHaveBeenCalledTimes(1)
  })
})
