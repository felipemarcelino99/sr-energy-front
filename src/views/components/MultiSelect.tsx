import { useState, useRef, useEffect } from 'react'
import { useTheme } from '@/hooks/useTheme'

interface MultiSelectProps {
  options: string[]
  value: string[]
  onChange: (v: string[]) => void
  placeholder?: string
  renderOption?: (opt: string) => React.ReactNode
}

export function MultiSelect({ options, value, onChange, placeholder = 'Todos', renderOption }: MultiSelectProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const ref = useRef<HTMLDivElement>(null)
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const filtered = options.filter((o) => o.toLowerCase().includes(search.toLowerCase()))
  const isActive = value.length > 0

  const borderColor = isDark ? 'rgba(255,255,255,.15)' : 'oklch(0.91 0.008 250)'
  const dropdownBg = isDark ? 'oklch(0.21 0.03 245)' : '#fff'
  const inputBg = isDark ? 'oklch(0.16 0.025 245)' : '#fff'
  const inputColor = isDark ? 'rgba(255,255,255,.85)' : '#262525'
  const mutedColor = isDark ? 'rgba(255,255,255,.35)' : '#999'
  const hoverBg = isDark ? 'rgba(255,255,255,.06)' : '#F5F7FA'
  const selectedBg = isDark ? 'rgba(27,107,181,.25)' : '#EEF5FF'

  function toggle(opt: string) {
    onChange(value.includes(opt) ? value.filter((x) => x !== opt) : [...value, opt])
  }

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-block', minWidth: 140 }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          height: 32,
          padding: '0 10px',
          borderRadius: 6,
          border: `1.5px solid ${isActive ? '#1B6BB5' : borderColor}`,
          background: isActive
            ? (isDark ? 'rgba(27,107,181,.2)' : 'rgba(27,107,181,.08)')
            : (isDark ? 'oklch(0.21 0.03 245)' : '#fff'),
          color: isActive ? '#1F93E7' : (isDark ? 'rgba(255,255,255,.5)' : '#777'),
          fontSize: 12,
          fontWeight: isActive ? 600 : 400,
          cursor: 'pointer',
          fontFamily: 'Inter, sans-serif',
          whiteSpace: 'nowrap',
          width: '100%',
        }}
      >
        <span style={{ flex: 1, textAlign: 'left' }}>
          {isActive ? `${value.length} selecionado${value.length > 1 ? 's' : ''}` : placeholder}
        </span>
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            background: dropdownBg,
            border: `1px solid ${borderColor}`,
            borderRadius: 8,
            boxShadow: isDark
              ? '0 8px 24px rgba(0,0,0,.4)'
              : '0 8px 24px rgba(0,0,0,.12)',
            zIndex: 200,
            minWidth: 200,
            padding: '4px 0',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Search input */}
          <div style={{ padding: '6px 10px 4px', borderBottom: `1px solid ${borderColor}` }}>
            <input
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar..."
              style={{
                width: '100%',
                border: `1.5px solid ${borderColor}`,
                borderRadius: 5,
                padding: '4px 8px',
                fontSize: 12,
                fontFamily: 'Inter, sans-serif',
                outline: 'none',
                background: inputBg,
                color: inputColor,
              }}
            />
          </div>

          {/* Options */}
          <div style={{ maxHeight: 220, overflowY: 'auto' }}>
            {filtered.length === 0 && (
              <div style={{ padding: '8px 12px', fontSize: 12, color: mutedColor }}>Nenhuma opção</div>
            )}
            {filtered.map((opt) => {
              const selected = value.includes(opt)
              return (
                <div
                  key={opt}
                  onClick={() => toggle(opt)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '7px 12px',
                    cursor: 'pointer',
                    fontSize: 12,
                    color: inputColor,
                    background: selected ? selectedBg : 'transparent',
                    transition: 'background 80ms',
                  }}
                  onMouseEnter={(e) => { if (!selected) (e.currentTarget as HTMLElement).style.background = hoverBg }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = selected ? selectedBg : 'transparent' }}
                >
                  <div
                    style={{
                      width: 14,
                      height: 14,
                      borderRadius: 3,
                      border: `1.5px solid ${selected ? '#1B6BB5' : (isDark ? 'rgba(255,255,255,.3)' : '#ccc')}`,
                      background: selected ? '#1B6BB5' : 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    {selected && (
                      <svg width="9" height="9" viewBox="0 0 12 12" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="2 6 5 9 10 3" />
                      </svg>
                    )}
                  </div>
                  {renderOption ? renderOption(opt) : opt}
                </div>
              )
            })}
          </div>

          {/* Clear */}
          {value.length > 0 && (
            <div style={{ borderTop: `1px solid ${borderColor}`, padding: '4px 0' }}>
              <button
                type="button"
                onClick={() => { onChange([]); setSearch('') }}
                style={{ padding: '6px 12px', fontSize: 11, color: '#E53E3E', cursor: 'pointer', fontWeight: 600, background: 'none', border: 'none', fontFamily: 'Inter, sans-serif', width: '100%', textAlign: 'left' }}
              >
                Limpar filtro
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
