import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/viewmodels/auth.context'
import { loginSchema } from '@/models/auth.model'
import logo from '@/assets/sr-energy-logo.png'

const MAX_ATTEMPTS = 5
const LOCKOUT_MS = 30_000

export function LoginPage() {
  const { login, loading } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({})
  const [serverError, setServerError] = useState<string | null>(null)
  const [lockedUntil, setLockedUntil] = useState<number | null>(null)
  const attemptCount = useRef(0)

  const isLocked = lockedUntil !== null && Date.now() < lockedUntil
  const remainingSeconds = isLocked ? Math.ceil((lockedUntil! - Date.now()) / 1000) : 0

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setServerError(null)

    if (isLocked) {
      setServerError(`Muitas tentativas. Aguarde ${remainingSeconds}s para tentar novamente.`)
      return
    }

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
      attemptCount.current = 0
      navigate(user.role === 'employee' ? '/dashboard' : '/', { replace: true })
    } catch (err) {
      attemptCount.current += 1
      if (attemptCount.current >= MAX_ATTEMPTS) {
        setLockedUntil(Date.now() + LOCKOUT_MS)
        attemptCount.current = 0
        setServerError(`Muitas tentativas. Aguarde ${LOCKOUT_MS / 1000}s para tentar novamente.`)
      } else {
        setServerError((err as Error).message)
      }
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-base-100">
      <div className="w-full max-w-sm">
        {/* Brand mark */}
        <div className="flex flex-col items-center">
          <div className="w-60 h-auto">
            <img src={logo} alt="SR Energy" />
          </div>
        </div>

        {/* Card */}
        <div className="card bg-base-200 border border-base-300 shadow-lg">
          <div className="card-body gap-5">
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
                <label
                  className="label text-xs font-medium text-base-content/60"
                  htmlFor="password"
                >
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
                disabled={loading || isLocked}
              >
                {loading ? (
                  <span className="loading loading-spinner loading-sm" />
                ) : isLocked ? (
                  `Aguarde ${remainingSeconds}s`
                ) : (
                  'Entrar'
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
