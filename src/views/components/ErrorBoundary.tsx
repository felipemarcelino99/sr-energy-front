import { Component, type ErrorInfo, type ReactNode } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import * as Sentry from '@sentry/react'
import { IS_DEV } from '@/config/env'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (IS_DEV) {
      console.error('[ErrorBoundary]', error, info)
    }
    Sentry.captureException(error, { extra: { componentStack: info.componentStack } })
  }

  render() {
    if (!this.state.hasError) return this.props.children

    if (this.props.fallback) return this.props.fallback

    return (
      <div
        role="alert"
        className="flex flex-col items-center justify-center min-h-[40vh] gap-4 p-8 text-center"
      >
        <AlertTriangle size={40} className="text-error" />
        <div>
          <h2 className="text-lg font-semibold">Algo deu errado</h2>
          <p className="text-sm text-base-content/60 mt-1">
            Ocorreu um erro inesperado. Tente recarregar a página.
          </p>
        </div>
        <button className="btn btn-primary btn-sm gap-2" onClick={() => window.location.reload()}>
          <RefreshCw size={14} />
          Recarregar
        </button>
      </div>
    )
  }
}
