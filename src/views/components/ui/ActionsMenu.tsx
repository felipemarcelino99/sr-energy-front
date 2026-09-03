import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { MoreVertical } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export interface ActionsMenuAction {
  label: string
  icon: LucideIcon
  onClick: () => void
  variant?: 'default' | 'danger'
}

interface ActionsMenuProps {
  actions: ActionsMenuAction[]
}

/**
 * Compact 3-dot actions menu for table rows. Renders its dropdown via a portal
 * to document.body so it isn't clipped by DataTable's scrollable container,
 * and closes on outside click / when another ActionsMenu opens.
 */
export function ActionsMenu({ actions }: ActionsMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [position, setPosition] = useState({ top: 0, left: 0 })
  const buttonRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLUListElement>(null)

  useEffect(() => {
    if (!isOpen) return

    function handleOutsideClick(e: MouseEvent) {
      const target = e.target as Node
      if (buttonRef.current?.contains(target) || menuRef.current?.contains(target)) return
      setIsOpen(false)
    }

    function handleCloseOthers(e: Event) {
      const source = (e as CustomEvent<HTMLButtonElement | null>).detail
      if (source !== buttonRef.current) setIsOpen(false)
    }

    document.addEventListener('mousedown', handleOutsideClick)
    document.addEventListener('actions-menu-open', handleCloseOthers)
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick)
      document.removeEventListener('actions-menu-open', handleCloseOthers)
    }
  }, [isOpen])

  function toggleOpen(e: React.MouseEvent) {
    e.stopPropagation()
    if (isOpen) {
      setIsOpen(false)
      return
    }
    const rect = e.currentTarget.getBoundingClientRect()
    setPosition({ top: rect.bottom + 4, left: rect.right - 176 })
    document.dispatchEvent(new CustomEvent('actions-menu-open', { detail: buttonRef.current }))
    setIsOpen(true)
  }

  function handleAction(e: React.MouseEvent<HTMLButtonElement>, action: ActionsMenuAction) {
    e.stopPropagation()
    setIsOpen(false)
    action.onClick()
  }

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={toggleOpen}
        className="btn btn-ghost btn-xs"
        aria-label="Ações"
      >
        <MoreVertical size={14} />
      </button>
      {isOpen &&
        createPortal(
          <ul
            ref={menuRef}
            className="menu z-50 bg-base-200 shadow-xl rounded-box border border-base-300 w-44 p-1 fixed"
            style={{ top: position.top, left: position.left }}
          >
            {actions.map((action) => {
              const Icon = action.icon
              return (
                <li key={action.label}>
                  <button
                    type="button"
                    onClick={(e) => handleAction(e, action)}
                    className={action.variant === 'danger' ? 'text-error' : ''}
                  >
                    <Icon size={14} /> {action.label}
                  </button>
                </li>
              )
            })}
          </ul>,
          document.body
        )}
    </>
  )
}
