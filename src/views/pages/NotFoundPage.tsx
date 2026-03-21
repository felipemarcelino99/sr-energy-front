import { Link } from 'react-router-dom'

export function NotFoundPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4">
      <h1 className="text-6xl font-bold text-base-content/20">404</h1>
      <p className="text-base-content/60">Página não encontrada</p>
      <Link to="/" className="btn btn-primary btn-sm">Voltar ao início</Link>
    </div>
  )
}
