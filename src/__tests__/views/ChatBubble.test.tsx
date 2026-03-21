import { render, screen } from '@testing-library/react'
import { ChatBubble } from '@/views/components/ChatBubble'

describe('ChatBubble', () => {
  it('renderiza no lado esquerdo para mensagens da IA', () => {
    render(<ChatBubble role="assistant" content="Olá! Como posso ajudar?" />)
    const bubble = screen.getByTestId('chat-bubble')
    expect(bubble).toHaveClass('chat-start')
  })

  it('renderiza no lado direito para mensagens do usuário', () => {
    render(<ChatBubble role="user" content="Como faço a manutenção?" />)
    const bubble = screen.getByTestId('chat-bubble')
    expect(bubble).toHaveClass('chat-end')
  })

  it('exibe o conteúdo da mensagem', () => {
    render(<ChatBubble role="user" content="Minha pergunta" />)
    expect(screen.getByText('Minha pergunta')).toBeInTheDocument()
  })
})
