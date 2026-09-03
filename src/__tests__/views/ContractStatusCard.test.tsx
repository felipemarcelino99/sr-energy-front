import { render, screen, fireEvent } from '@testing-library/react'
import { ContractStatusCard } from '@/views/components/ContractStatusCard'
import type { ContractStatusSummary } from '@/models/dashboard.model'

const summary: ContractStatusSummary[] = [
  { status: 'expiring', count: 2 },
  { status: 'expired', count: 5 },
]

describe('ContractStatusCard', () => {
  it('renderiza o cabeçalho mesmo quando summary está vazio', () => {
    render(<ContractStatusCard summary={[]} />)
    expect(screen.getByText('Contratos por Status')).toBeInTheDocument()
  })

  it('exibe contagem e labels por status', () => {
    render(<ContractStatusCard summary={summary} />)
    expect(screen.getByText('Próximos ao vencimento')).toBeInTheDocument()
    expect(screen.getByText('Expirados')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
    expect(screen.getByText('5')).toBeInTheDocument()
  })

  it('chama onStatusClick com o status correto ao clicar no card', () => {
    const onStatusClick = jest.fn()
    render(<ContractStatusCard summary={summary} onStatusClick={onStatusClick} />)
    fireEvent.click(screen.getByText('Expirados'))
    expect(onStatusClick).toHaveBeenCalledWith('expired')
  })

  it('não lança erro se onStatusClick não for passado', () => {
    expect(() => render(<ContractStatusCard summary={summary} />)).not.toThrow()
  })

  it('modo compact exibe o total somado e chips clicáveis', () => {
    const onStatusClick = jest.fn()
    render(<ContractStatusCard summary={summary} onStatusClick={onStatusClick} compact />)
    expect(screen.getByTestId('contract-status-total').textContent).toBe('7')
    expect(screen.getByTestId('status-chip-expiring')).toBeInTheDocument()
    expect(screen.getByTestId('status-chip-expired')).toBeInTheDocument()
    fireEvent.click(screen.getByTestId('status-chip-expired'))
    expect(onStatusClick).toHaveBeenCalledWith('expired')
  })

  it('modo compact não lança erro sem onStatusClick', () => {
    expect(() => render(<ContractStatusCard summary={summary} compact />)).not.toThrow()
  })

  it('responde a Enter no card não-compact quando onStatusClick está definido', () => {
    const onStatusClick = jest.fn()
    render(<ContractStatusCard summary={summary} onStatusClick={onStatusClick} />)
    fireEvent.keyDown(screen.getByText('Expirados'), { key: 'Enter' })
    expect(onStatusClick).toHaveBeenCalledWith('expired')
  })

  it('altera o box-shadow no mouse enter/leave quando onStatusClick está definido', () => {
    const onStatusClick = jest.fn()
    render(<ContractStatusCard summary={summary} onStatusClick={onStatusClick} />)
    const card = screen.getByText('Expirados').closest('div')!.parentElement!
    fireEvent.mouseEnter(card)
    expect((card as HTMLDivElement).style.boxShadow).toBe('0 4px 12px rgba(0,0,0,.10)')
    fireEvent.mouseLeave(card)
    expect((card as HTMLDivElement).style.boxShadow).toBe('none')
  })

  it('não altera box-shadow no mouse enter quando onStatusClick não está definido', () => {
    render(<ContractStatusCard summary={summary} />)
    const card = screen.getByText('Expirados').closest('div')!.parentElement!
    fireEvent.mouseEnter(card)
    expect((card as HTMLDivElement).style.boxShadow).toBe('')
  })
})
