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
  it('exibe itens de manager (Trabalhos, Máquinas, etc.)', () => {
    renderSidebar('manager')
    expect(screen.getByText('Trabalhos')).toBeInTheDocument()
    expect(screen.getByText('Máquinas')).toBeInTheDocument()
    expect(screen.getByText('Contratos')).toBeInTheDocument()
    expect(screen.getByText('Funcionários')).toBeInTheDocument()
    expect(screen.getByText('Financeiro')).toBeInTheDocument()
  })

  it('não exibe itens de employee para manager', () => {
    renderSidebar('manager')
    expect(screen.queryByText('Meus Trabalhos')).not.toBeInTheDocument()
    expect(screen.queryByText('Chat IA')).not.toBeInTheDocument()
  })

  it('exibe itens de employee (Meus Trabalhos, Chat IA)', () => {
    renderSidebar('employee')
    expect(screen.getByText('Meus Trabalhos')).toBeInTheDocument()
    expect(screen.getByText('Chat IA')).toBeInTheDocument()
  })

  it('não exibe itens de manager para employee', () => {
    renderSidebar('employee')
    expect(screen.queryByText('Trabalhos')).not.toBeInTheDocument()
    expect(screen.queryByText('Financeiro')).not.toBeInTheDocument()
  })
})
