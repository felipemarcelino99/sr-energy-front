import { useEffect, useRef, useState } from 'react'
import { useChatStore } from '@/viewmodels/chat.viewmodel'
import { useMachineStore } from '@/viewmodels/machine.viewmodel'
import { ChatBubble } from '@/views/components/ChatBubble'
import { TypingIndicator } from '@/views/components/TypingIndicator'

export function ChatPage() {
  const { messages, loading, error, machineId, setMachineId, sendMessage, retryLastMessage, clear } = useChatStore()
  const { machines, load: loadMachines } = useMachineStore()
  const [input, setInput] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => { loadMachines() }, [loadMachines])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    if (!input.trim() || !machineId) return
    const msg = input
    setInput('')
    try {
      await sendMessage(msg)
    } catch {}
  }

  return (
    <div className="p-6 flex flex-col h-full max-w-2xl mx-auto gap-4">
      <h1 className="text-2xl font-bold">Chat com IA</h1>

      {/* Machine selector */}
      <div className="flex items-center gap-3">
        <select
          className="select select-bordered flex-1"
          value={machineId}
          onChange={(e) => { setMachineId(e.target.value); clear() }}
        >
          <option value="">Selecione uma máquina...</option>
          {machines.map((m) => (
            <option key={m.id} value={m.id}>{m.name}</option>
          ))}
        </select>
      </div>

      {!machineId && (
        <div className="alert alert-info text-sm">Selecione uma máquina para iniciar o chat.</div>
      )}

      {machineId && (
        <div className="alert alert-warning text-xs">
          ⚠️ Respostas baseadas apenas no manual da máquina selecionada
        </div>
      )}

      {/* Chat window */}
      {machineId && (
        <div className="flex-1 bg-base-200 rounded-lg p-4 overflow-y-auto min-h-64 max-h-[50vh] flex flex-col gap-2">
          {messages.length === 0 && (
            <p className="text-center text-base-content/40 text-sm mt-8">
              Faça uma pergunta sobre a máquina selecionada.
            </p>
          )}
          {messages.map((msg) => (
            <ChatBubble key={msg.id} role={msg.role} content={msg.content} />
          ))}
          <TypingIndicator loading={loading} />
          <div ref={bottomRef} />
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="alert alert-error text-sm flex justify-between">
          <span>{error}</span>
          <button className="btn btn-ghost btn-xs" onClick={retryLastMessage}>Tentar novamente</button>
        </div>
      )}

      {/* Input */}
      {machineId && (
        <form onSubmit={handleSend} className="flex gap-2">
          <input
            type="text"
            className="input input-bordered flex-1"
            placeholder="Digite sua pergunta..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
          />
          <button type="submit" className="btn btn-primary" disabled={loading || !input.trim()}>
            {loading ? <span className="loading loading-spinner loading-sm" /> : 'Enviar'}
          </button>
        </form>
      )}
    </div>
  )
}
