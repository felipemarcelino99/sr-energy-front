import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { AppLayout } from '@/views/layouts/AppLayout'
import { useAuth } from '@/viewmodels/auth.context'

jest.mock('@/viewmodels/auth.context')

function renderLayout() {
  return render(
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<div>Página Filha</div>} />
        </Route>
      </Routes>
    </MemoryRouter>
  )
}

beforeEach(() => {
  jest.clearAllMocks()
  localStorage.clear()
})

it('não renderiza nada quando não há usuário autenticado', () => {
  ;(useAuth as jest.Mock).mockReturnValue({ user: null, logout: jest.fn() })
  const { container } = renderLayout()
  expect(container).toBeEmptyDOMElement()
})

it('renderiza sidebar, navbar e o conteúdo da rota filha (Outlet) quando autenticado', () => {
  ;(useAuth as jest.Mock).mockReturnValue({
    user: { id: 'u1', email: 'a@a.com', name: 'Ana', role: 'manager' },
    logout: jest.fn(),
  })
  renderLayout()
  expect(screen.getByText('Página Filha')).toBeInTheDocument()
  // itens da sidebar de manager
  expect(screen.getByText('OS')).toBeInTheDocument()
})

it('alterna o collapse do sidebar e persiste em localStorage', () => {
  ;(useAuth as jest.Mock).mockReturnValue({
    user: { id: 'u1', email: 'a@a.com', name: 'Ana', role: 'manager' },
    logout: jest.fn(),
  })
  renderLayout()

  expect(localStorage.getItem('sidebar-collapsed')).toBeNull()

  const collapseButton = screen.getByLabelText(/recolher menu/i)
  fireEvent.click(collapseButton)

  expect(localStorage.getItem('sidebar-collapsed')).toBe('true')
})

it('inicializa o collapse a partir do valor salvo em localStorage', () => {
  localStorage.setItem('sidebar-collapsed', 'true')
  ;(useAuth as jest.Mock).mockReturnValue({
    user: { id: 'u1', email: 'a@a.com', name: 'Ana', role: 'manager' },
    logout: jest.fn(),
  })
  renderLayout()
  expect(screen.getByLabelText(/expandir menu/i)).toBeInTheDocument()
})

it('não persiste em localStorage quando destrava o sidebar de volta', () => {
  ;(useAuth as jest.Mock).mockReturnValue({
    user: { id: 'u1', email: 'a@a.com', name: 'Ana', role: 'manager' },
    logout: jest.fn(),
  })
  renderLayout()
  fireEvent.click(screen.getByLabelText(/recolher menu/i))
  fireEvent.click(screen.getByLabelText(/expandir menu/i))
  expect(localStorage.getItem('sidebar-collapsed')).toBe('false')
})

it('abre o drawer ao clicar no menu do navbar e fecha ao clicar no overlay', () => {
  ;(useAuth as jest.Mock).mockReturnValue({
    user: { id: 'u1', email: 'a@a.com', name: 'Ana', role: 'manager' },
    logout: jest.fn(),
  })
  const { container } = renderLayout()
  const checkbox = container.querySelector('#app-drawer') as HTMLInputElement
  expect(checkbox.checked).toBe(false)

  fireEvent.click(screen.getByLabelText(/abrir menu/i))
  expect(checkbox.checked).toBe(true)

  const overlay = container.querySelector('.drawer-overlay') as HTMLElement
  fireEvent.click(overlay)
  expect(checkbox.checked).toBe(false)
})

it('permite alternar o checkbox do drawer diretamente', () => {
  ;(useAuth as jest.Mock).mockReturnValue({
    user: { id: 'u1', email: 'a@a.com', name: 'Ana', role: 'manager' },
    logout: jest.fn(),
  })
  const { container } = renderLayout()
  const checkbox = container.querySelector('#app-drawer') as HTMLInputElement
  fireEvent.click(checkbox)
  expect(checkbox.checked).toBe(true)
})
