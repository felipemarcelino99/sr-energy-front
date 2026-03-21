import { render, screen } from '@testing-library/react'
import { TypingIndicator } from '@/views/components/TypingIndicator'

describe('TypingIndicator', () => {
  it('é visível quando loading é true', () => {
    render(<TypingIndicator loading={true} />)
    expect(screen.getByTestId('typing-indicator')).toBeInTheDocument()
  })

  it('não é visível quando loading é false', () => {
    render(<TypingIndicator loading={false} />)
    expect(screen.queryByTestId('typing-indicator')).not.toBeInTheDocument()
  })
})
