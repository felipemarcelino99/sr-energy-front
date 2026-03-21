import { render, screen } from '@testing-library/react'
import { ContractStatusBadge } from '@/views/components/ContractStatusBadge'

describe('ContractStatusBadge', () => {
  it('exibe badge "Ativo" para contrato ativo', () => {
    render(<ContractStatusBadge status="active" />)
    expect(screen.getByText(/ativo/i)).toBeInTheDocument()
  })

  it('exibe badge "A vencer" para contrato expirando', () => {
    render(<ContractStatusBadge status="expiring" />)
    expect(screen.getByText(/a vencer/i)).toBeInTheDocument()
  })

  it('exibe badge "Vencido" para contrato vencido', () => {
    render(<ContractStatusBadge status="expired" />)
    expect(screen.getByText(/vencido/i)).toBeInTheDocument()
  })
})
