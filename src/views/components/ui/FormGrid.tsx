import type { ReactNode } from 'react'

interface FormGridProps {
  children: ReactNode
}

/** Shared 2-column layout for pairing short form fields (dates, selects, short text). */
export function FormGrid({ children }: FormGridProps) {
  return <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{children}</div>
}
