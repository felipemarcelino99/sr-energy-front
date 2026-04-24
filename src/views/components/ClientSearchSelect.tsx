import { useState, useRef, useEffect } from 'react'
import { useClientStore } from '@/viewmodels/client.viewmodel'

interface Props {
  value: string
  onChange: (clientId: string) => void
  disabled?: boolean
  error?: string
}

export function ClientSearchSelect({ value, onChange, disabled, error }: Props) {
  const { clients } = useClientStore()

  const selectedClient = clients.find((c) => c.id === value)
  const [inputText, setInputText] = useState(selectedClient?.razaoSocial ?? '')
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setInputText(selectedClient?.razaoSocial ?? '')
  }, [value, selectedClient?.razaoSocial])

  const suggestions =
    inputText.length >= 1
      ? clients.filter(
          (c) =>
            c.razaoSocial.toLowerCase().includes(inputText.toLowerCase()) ||
            c.cnpj.includes(inputText)
        )
      : []

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    setInputText(e.target.value)
    setOpen(true)
    if (!e.target.value) onChange('')
  }

  function handleSelect(clientId: string, razaoSocial: string) {
    onChange(clientId)
    setInputText(razaoSocial)
    setOpen(false)
  }

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
        if (!selectedClient) setInputText('')
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [selectedClient])

  return (
    <div ref={containerRef} className="relative">
      <input
        type="text"
        className={`input input-bordered input-sm w-full${error ? ' input-error' : ''}`}
        placeholder="Buscar cliente por razão social ou CNPJ..."
        value={inputText}
        onChange={handleInputChange}
        onFocus={() => inputText.length >= 1 && setOpen(true)}
        disabled={disabled}
        autoComplete="off"
      />
      {open && suggestions.length > 0 && (
        <ul className="absolute z-50 mt-1 w-full bg-base-100 border border-base-300 rounded-lg shadow-lg max-h-56 overflow-y-auto">
          {suggestions.map((c) => (
            <li
              key={c.id}
              className="px-3 py-2 cursor-pointer hover:bg-base-200 text-sm"
              onMouseDown={() => handleSelect(c.id, c.razaoSocial)}
            >
              <span className="font-medium">{c.razaoSocial}</span>
              <span className="ml-2 text-base-content/50 text-xs">{c.cnpj}</span>
            </li>
          ))}
        </ul>
      )}
      {error && <p className="text-error text-xs mt-1">{error}</p>}
    </div>
  )
}
