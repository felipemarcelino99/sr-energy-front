import type { MessageRole } from '@/models/chat.model'

interface Props {
  role: MessageRole
  content: string
}

export function ChatBubble({ role, content }: Props) {
  const isUser = role === 'user'
  return (
    <div data-testid="chat-bubble" className={`chat ${isUser ? 'chat-end' : 'chat-start'}`}>
      <div className="chat-header text-xs opacity-50 mb-1">
        {isUser ? 'Você' : 'IA'}
      </div>
      <div className={`chat-bubble ${isUser ? 'chat-bubble-primary' : 'chat-bubble-neutral'}`}>
        {content}
      </div>
    </div>
  )
}
