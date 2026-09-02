import { render, screen, fireEvent } from '@testing-library/react'
import { BagCertificateStatusCard } from '@/views/components/BagCertificateStatusCard'
import type { BagCertificateStatusSummary } from '@/models/dashboard.model'

const summary: BagCertificateStatusSummary[] = [
  { status: 'expiring', count: 3 },
  { status: 'expired', count: 1 },
]

describe('BagCertificateStatusCard', () => {
  it('não renderiza nada quando summary está vazio', () => {
    const { container } = render(<BagCertificateStatusCard summary={[]} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('exibe contagem e labels por status', () => {
    render(<BagCertificateStatusCard summary={summary} />)
    expect(screen.getByText('Próximos ao vencimento')).toBeInTheDocument()
    expect(screen.getByText('Expirados')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
    expect(screen.getByText('1')).toBeInTheDocument()
  })

  it('chama onStatusClick com o status correto ao clicar no card', () => {
    const onStatusClick = jest.fn()
    render(<BagCertificateStatusCard summary={summary} onStatusClick={onStatusClick} />)
    fireEvent.click(screen.getByText('Próximos ao vencimento'))
    expect(onStatusClick).toHaveBeenCalledWith('expiring')
  })

  it('não lança erro se onStatusClick não for passado', () => {
    expect(() => render(<BagCertificateStatusCard summary={summary} />)).not.toThrow()
  })

  it('modo compact exibe o total somado e chips clicáveis', () => {
    const onStatusClick = jest.fn()
    render(<BagCertificateStatusCard summary={summary} onStatusClick={onStatusClick} compact />)
    expect(screen.getByTestId('bag-cert-status-total').textContent).toBe('4')
    expect(screen.getByTestId('status-chip-expiring')).toBeInTheDocument()
    expect(screen.getByTestId('status-chip-expired')).toBeInTheDocument()
    fireEvent.click(screen.getByTestId('status-chip-expiring'))
    expect(onStatusClick).toHaveBeenCalledWith('expiring')
  })

  it('modo compact não lança erro sem onStatusClick', () => {
    expect(() => render(<BagCertificateStatusCard summary={summary} compact />)).not.toThrow()
  })

  it('responde a Enter no card não-compact quando onStatusClick está definido', () => {
    const onStatusClick = jest.fn()
    render(<BagCertificateStatusCard summary={summary} onStatusClick={onStatusClick} />)
    fireEvent.keyDown(screen.getByText('Próximos ao vencimento'), { key: 'Enter' })
    expect(onStatusClick).toHaveBeenCalledWith('expiring')
  })

  it('altera o box-shadow no mouse enter/leave quando onStatusClick está definido', () => {
    const onStatusClick = jest.fn()
    render(<BagCertificateStatusCard summary={summary} onStatusClick={onStatusClick} />)
    const card = screen.getByText('Próximos ao vencimento').closest('div')!.parentElement!
    fireEvent.mouseEnter(card)
    expect((card as HTMLDivElement).style.boxShadow).toBe('0 4px 12px rgba(0,0,0,.10)')
    fireEvent.mouseLeave(card)
    expect((card as HTMLDivElement).style.boxShadow).toBe('none')
  })

  it('não altera box-shadow no mouse enter quando onStatusClick não está definido', () => {
    render(<BagCertificateStatusCard summary={summary} />)
    const card = screen.getByText('Próximos ao vencimento').closest('div')!.parentElement!
    fireEvent.mouseEnter(card)
    expect((card as HTMLDivElement).style.boxShadow).toBe('')
  })
})
