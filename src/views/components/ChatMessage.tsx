import type { ChatMessage as ChatMessageType } from '@/models/chat.model'

interface Props {
  message: ChatMessageType
  onCurate?: () => void
}

export function ChatMessage({ message, onCurate }: Props) {
  const isUser = message.role === 'user'
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[80%] rounded-lg px-4 py-2 ${
          isUser ? 'bg-primary text-primary-content' : 'bg-base-200 text-base-content'
        }`}
      >
        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
        {!isUser && onCurate && (
          <button
            onClick={onCurate}
            className="btn btn-ghost btn-xs mt-1 text-success"
            title="Marcar como resposta correta"
            type="button"
          >
            👍
          </button>
        )}
      </div>
    </div>
  )
}
