import { render, screen } from '@testing-library/react'
import { ErrorBoundary } from '@/views/components/ErrorBoundary'

// Component that throws
function BrokenComponent({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) throw new Error('Test error')
  return <div>Conteúdo normal</div>
}

// Suppress console.error for expected errors
beforeEach(() => {
  jest.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => {
  jest.restoreAllMocks()
})

describe('ErrorBoundary', () => {
  it('renders children when there is no error', () => {
    render(
      <ErrorBoundary>
        <BrokenComponent shouldThrow={false} />
      </ErrorBoundary>
    )
    expect(screen.getByText('Conteúdo normal')).toBeInTheDocument()
  })

  it('renders fallback UI when a child throws', () => {
    render(
      <ErrorBoundary>
        <BrokenComponent shouldThrow={true} />
      </ErrorBoundary>
    )
    expect(screen.getByRole('alert')).toBeInTheDocument()
    expect(screen.getByText(/algo deu errado/i)).toBeInTheDocument()
  })

  it('shows a reload button in the fallback UI', () => {
    render(
      <ErrorBoundary>
        <BrokenComponent shouldThrow={true} />
      </ErrorBoundary>
    )
    expect(screen.getByRole('button', { name: /recarregar/i })).toBeInTheDocument()
  })

  it('renders a custom fallback when provided', () => {
    render(
      <ErrorBoundary fallback={<div>Erro customizado</div>}>
        <BrokenComponent shouldThrow={true} />
      </ErrorBoundary>
    )
    expect(screen.getByText('Erro customizado')).toBeInTheDocument()
  })
})
