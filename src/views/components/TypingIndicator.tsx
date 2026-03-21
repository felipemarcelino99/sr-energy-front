interface Props {
  loading: boolean
}

export function TypingIndicator({ loading }: Props) {
  if (!loading) return null
  return (
    <div data-testid="typing-indicator" className="chat chat-start">
      <div className="chat-bubble chat-bubble-neutral flex gap-1 items-center px-4 py-3">
        <span className="loading loading-dots loading-xs" />
        <span className="text-xs opacity-60 ml-1">digitando...</span>
      </div>
    </div>
  )
}
