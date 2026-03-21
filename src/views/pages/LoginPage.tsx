import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Zap } from 'lucide-react'
import { useAuth } from '@/viewmodels/auth.context'
import { loginSchema } from '@/models/auth.model'

export function LoginPage() {
  const { login, loading } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({})
  const [serverError, setServerError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setServerError(null)

    const result = loginSchema.safeParse({ email, password })
    if (!result.success) {
      const fieldErrors: { email?: string; password?: string } = {}
      for (const issue of result.error.issues) {
        const field = issue.path[0] as 'email' | 'password'
        fieldErrors[field] = issue.message
      }
      setErrors(fieldErrors)
      return
    }

    setErrors({})
    try {
      const user = await login({ email, password })
      navigate(user.role === 'employee' ? '/dashboard' : '/', { replace: true })
    } catch (err) {
      setServerError((err as Error).message)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-base-300">
      <div className="w-full max-w-sm">
        {/* Brand mark */}
        <div className="flex flex-col items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center">
            <Zap size={22} className="text-primary-content" />
          </div>
          <div className="text-center">
            <h1 className="text-xl font-bold tracking-tight">SR Energy</h1>
            <p className="text-sm text-base-content/40 mt-1">Gestão de operações energéticas</p>
          </div>
        </div>

        {/* Card */}
        <div className="card bg-base-200 border border-base-300 shadow-lg">
          <div className="card-body gap-5">
            <h2 className="text-sm font-semibold text-base-content/60">Acesse sua conta</h2>

            {serverError && (
              <div role="alert" className="alert alert-error text-sm py-2">
                {serverError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
              <fieldset className="fieldset gap-1">
                <label className="label text-xs font-medium text-base-content/60" htmlFor="email">
                  E-mail
                </label>
                <input
                  id="email"
                  type="email"
                  className={`input input-bordered w-full ${errors.email ? 'input-error' : ''}`}
                  placeholder="voce@srenergia.com.br"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                />
                {errors.email && <p className="text-error text-xs">{errors.email}</p>}
              </fieldset>

              <fieldset className="fieldset gap-1">
                <label className="label text-xs font-medium text-base-content/60" htmlFor="password">
                  Senha
                </label>
                <input
                  id="password"
                  type="password"
                  className={`input input-bordered w-full ${errors.password ? 'input-error' : ''}`}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
                {errors.password && <p className="text-error text-xs">{errors.password}</p>}
              </fieldset>

              <button
                type="submit"
                className="btn btn-primary w-full mt-1"
                disabled={loading}
              >
                {loading ? <span className="loading loading-spinner loading-sm" /> : 'Entrar'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
