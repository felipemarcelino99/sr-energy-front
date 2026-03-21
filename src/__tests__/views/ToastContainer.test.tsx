import { render, screen, act } from '@testing-library/react'
import { ToastContainer } from '@/views/components/ToastContainer'
import { useToastStore } from '@/viewmodels/toast.viewmodel'

describe('ToastContainer', () => {
  beforeEach(() => {
    useToastStore.setState({ toasts: [] })
  })

  it('renders nothing when there are no toasts', () => {
    const { container } = render(<ToastContainer />)
    expect(container.firstChild).toBeNull()
  })

  it('renders a success toast', () => {
    act(() => {
      useToastStore.getState().add({ message: 'Salvo com sucesso!', type: 'success' })
    })
    render(<ToastContainer />)
    expect(screen.getByText('Salvo com sucesso!')).toBeInTheDocument()
    expect(screen.getByRole('alert')).toHaveClass('alert-success')
  })

  it('renders an error toast', () => {
    act(() => {
      useToastStore.getState().add({ message: 'Erro ao salvar', type: 'error' })
    })
    render(<ToastContainer />)
    expect(screen.getByText('Erro ao salvar')).toBeInTheDocument()
    expect(screen.getByRole('alert')).toHaveClass('alert-error')
  })

  it('renders a warning toast', () => {
    act(() => {
      useToastStore.getState().add({ message: 'Atenção!', type: 'warning' })
    })
    render(<ToastContainer />)
    expect(screen.getByText('Atenção!')).toBeInTheDocument()
    expect(screen.getByRole('alert')).toHaveClass('alert-warning')
  })

  it('removes a toast when dismissed', () => {
    act(() => {
      useToastStore.getState().add({ message: 'Toast temporário', type: 'info' })
    })
    render(<ToastContainer />)
    const dismissBtn = screen.getByRole('button', { name: /fechar/i })
    act(() => {
      dismissBtn.click()
    })
    expect(screen.queryByText('Toast temporário')).not.toBeInTheDocument()
  })
})
