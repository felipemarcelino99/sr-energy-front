import { render, screen } from '@testing-library/react'
import { EmployeeAvatar } from '@/views/components/EmployeeAvatar'

describe('EmployeeAvatar', () => {
  it('renders the photo when photoUrl is set', () => {
    render(
      <EmployeeAvatar name="Ana Silva" photoUrl="https://example.com/ana.jpg" color="#2563eb" />
    )
    const img = screen.getByRole('img', { name: 'Ana Silva' })
    expect(img).toHaveAttribute('src', 'https://example.com/ana.jpg')
    expect(img.tagName).toBe('IMG')
  })

  it('sets explicit width/height on the photo to avoid layout shift', () => {
    render(<EmployeeAvatar name="Ana Silva" photoUrl="https://example.com/ana.jpg" size="lg" />)
    const img = screen.getByRole('img', { name: 'Ana Silva' })
    expect(img).toHaveAttribute('width', '80')
    expect(img).toHaveAttribute('height', '80')
  })

  it('falls back to initials over the color when there is no photo', () => {
    render(<EmployeeAvatar name="Ana Silva" color="#2563eb" />)
    const fallback = screen.getByRole('img', { name: 'Ana Silva' })
    expect(fallback.tagName).not.toBe('IMG')
    expect(fallback).toHaveTextContent('AS')
    expect(fallback).toHaveStyle({ backgroundColor: '#2563eb' })
  })

  it('uses a fallback color when no color is provided and there is no photo', () => {
    render(<EmployeeAvatar name="Ana Silva" />)
    const fallback = screen.getByRole('img', { name: 'Ana Silva' })
    expect(fallback).toHaveStyle({ backgroundColor: '#6b7280' })
  })

  it('renders initials from a single-word name', () => {
    render(<EmployeeAvatar name="Madonna" color="#2563eb" />)
    expect(screen.getByText('MA')).toBeInTheDocument()
  })

  it('renders a placeholder for an empty name', () => {
    render(<EmployeeAvatar name="" color="#2563eb" />)
    expect(screen.getByText('?')).toBeInTheDocument()
  })
})
