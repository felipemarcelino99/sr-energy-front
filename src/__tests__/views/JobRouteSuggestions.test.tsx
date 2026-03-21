import { render, screen } from '@testing-library/react'
import { JobRouteSuggestions } from '@/views/components/JobRouteSuggestions'

describe('JobRouteSuggestions', () => {
  it('exibe a cidade e o estado do trabalho no cabeçalho', () => {
    render(<JobRouteSuggestions city="Curitiba" state="PR" />)
    const heading = screen.getByRole('heading', { level: 2 })
    expect(heading.textContent).toMatch(/Curitiba/)
    expect(heading.textContent).toMatch(/PR/)
  })

  it('exibe link para o Google Maps da cidade', () => {
    render(<JobRouteSuggestions city="Florianopolis" state="SC" />)
    const link = screen.getByRole('link', { name: /google maps/i })
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute('href', expect.stringContaining('Florianopolis'))
    expect(link).toHaveAttribute('target', '_blank')
  })

  it('exibe sugestões de roteiro pós-trabalho', () => {
    render(<JobRouteSuggestions city="Campinas" state="SP" />)
    const items = screen.getAllByText(/roteiro/i)
    expect(items.length).toBeGreaterThan(0)
  })

  it('exibe dicas de hospedagem e transporte', () => {
    render(<JobRouteSuggestions city="Porto Alegre" state="RS" />)
    const items = screen.getAllByText(/hospedagem|transporte/i)
    expect(items.length).toBeGreaterThan(0)
  })
})
