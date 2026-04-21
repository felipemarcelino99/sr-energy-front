import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { Sidebar } from '@/views/components/Sidebar'

function renderSidebar(role: 'admin' | 'manager' | 'employee') {
  return render(
    <MemoryRouter>
      <Sidebar role={role} />
    </MemoryRouter>
  )
}

describe('Sidebar', () => {
  it('exibe itens de manager (OS, Máquinas, etc.)', () => {
    renderSidebar('manager')
    expect(screen.getByText('OS')).toBeInTheDocument()
    expect(screen.getByText('Máquinas')).toBeInTheDocument()
    expect(screen.getByText('Contratos')).toBeInTheDocument()
    expect(screen.getByText('Funcionários')).toBeInTheDocument()
    expect(screen.getByText('Financeiro')).toBeInTheDocument()
  })

  it('não exibe itens de employee para manager', () => {
    renderSidebar('manager')
    expect(screen.queryByText('Minhas OS')).not.toBeInTheDocument()
    expect(screen.queryByText('Chat IA')).not.toBeInTheDocument()
  })

  it('exibe itens de employee (Minhas OS, Chat IA)', () => {
    renderSidebar('employee')
    expect(screen.getByText('Minhas OS')).toBeInTheDocument()
    expect(screen.getByText('Chat IA')).toBeInTheDocument()
  })

  it('não exibe itens de manager para employee', () => {
    renderSidebar('employee')
    expect(screen.queryByText('OS')).not.toBeInTheDocument()
    expect(screen.queryByText('Financeiro')).not.toBeInTheDocument()
  })
})
