import { render, screen, fireEvent } from '@testing-library/react'
import { ChatMessage } from '@/views/components/ChatMessage'
import type { ChatMessage as ChatMessageType } from '@/models/chat.model'

const userMsg: ChatMessageType = { id: '1', role: 'user', content: 'Minha pergunta', timestamp: '' }
const assistantMsg: ChatMessageType = { id: '2', role: 'assistant', content: 'Minha resposta', timestamp: '' }

describe('ChatMessage', () => {
  it('renders user message content', () => {
    render(<ChatMessage message={userMsg} />)
    expect(screen.getByText('Minha pergunta')).toBeInTheDocument()
  })

  it('does not show thumbs-up for user messages', () => {
    render(<ChatMessage message={userMsg} onCurate={jest.fn()} />)
    expect(screen.queryByTitle('Marcar como resposta correta')).not.toBeInTheDocument()
  })

  it('shows thumbs-up button for assistant messages when onCurate is provided', () => {
    render(<ChatMessage message={assistantMsg} onCurate={jest.fn()} />)
    expect(screen.getByTitle('Marcar como resposta correta')).toBeInTheDocument()
  })

  it('calls onCurate when thumbs-up is clicked', () => {
    const onCurate = jest.fn()
    render(<ChatMessage message={assistantMsg} onCurate={onCurate} />)
    fireEvent.click(screen.getByTitle('Marcar como resposta correta'))
    expect(onCurate).toHaveBeenCalledTimes(1)
  })

  it('does not show thumbs-up when onCurate is not provided', () => {
    render(<ChatMessage message={assistantMsg} />)
    expect(screen.queryByTitle('Marcar como resposta correta')).not.toBeInTheDocument()
  })
})
