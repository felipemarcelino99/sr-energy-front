import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePageHeader } from '@/hooks/usePageHeader'
import { supabase } from '@/services/supabase'
import { useAuth } from '@/viewmodels/auth.context'

export function ChangePasswordPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (password.length < 6) return setError('A senha deve ter no mínimo 6 caracteres.')
    if (password !== confirm) return setError('As senhas não coincidem.')

    setLoading(true)
    const { error: err } = await supabase.auth.updateUser({
      password,
      data: { must_change_password: false },
    })
    setLoading(false)

    if (err) return setError('Erro ao alterar senha. Tente novamente.')
    setSuccess(true)
    setPassword('')
    setConfirm('')
    if (user?.mustChangePassword) {
      setTimeout(
        () => navigate(user.role === 'employee' ? '/dashboard' : '/', { replace: true }),
        1200
      )
    }
  }

  usePageHeader('Alterar Senha')

  return (
    <div className="flex flex-col gap-5 max-w-md">
      {success && <div className="alert alert-success text-sm">Senha alterada com sucesso!</div>}

      <form onSubmit={handleSubmit} className="card bg-base-200 border border-base-300">
        <div className="card-body gap-4">
          <fieldset className="fieldset gap-1">
            <label className="label text-xs font-medium text-base-content/60">Nova senha</label>
            <input
              type="password"
              className="input input-bordered w-full"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </fieldset>

          <fieldset className="fieldset gap-1">
            <label className="label text-xs font-medium text-base-content/60">
              Confirmar nova senha
            </label>
            <input
              type="password"
              className="input input-bordered w-full"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
            />
          </fieldset>

          {error && <div className="alert alert-error text-sm">{error}</div>}

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? <span className="loading loading-spinner loading-sm" /> : 'Alterar senha'}
          </button>
        </div>
      </form>
    </div>
  )
}
