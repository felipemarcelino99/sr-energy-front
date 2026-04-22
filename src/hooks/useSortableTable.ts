import { useState, useMemo } from 'react'

type SortDir = 'asc' | 'desc' | null

interface SortState {
  key: string
  dir: SortDir
}

function compareValues(a: unknown, b: unknown, dir: 'asc' | 'desc'): number {
  const mul = dir === 'asc' ? 1 : -1

  if (a === null || a === undefined) return 1
  if (b === null || b === undefined) return -1

  // Numbers
  if (typeof a === 'number' && typeof b === 'number') {
    return (a - b) * mul
  }

  // Date strings (ISO or pt-BR dd/mm/yyyy)
  const dateA = parseDate(String(a))
  const dateB = parseDate(String(b))
  if (dateA && dateB) return (dateA - dateB) * mul

  // Strings
  return String(a).localeCompare(String(b), 'pt-BR', { sensitivity: 'base' }) * mul
}

function parseDate(s: string): number | null {
  // ISO
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return new Date(s).getTime()
  // pt-BR dd/mm/yyyy
  const m = s.match(/^(\d{2})\/(\d{2})\/(\d{4})/)
  if (m) return new Date(`${m[3]}-${m[2]}-${m[1]}`).getTime()
  return null
}

export function useSortableTable<T extends Record<string, unknown>>(data: T[]) {
  const [sort, setSort] = useState<SortState>({ key: '', dir: null })

  const toggle = (key: string) => {
    setSort((s) => {
      if (s.key !== key) return { key, dir: 'asc' }
      if (s.dir === 'asc') return { key, dir: 'desc' }
      return { key: '', dir: null }
    })
  }

  const sorted = useMemo(() => {
    if (!sort.key || !sort.dir) return data
    return [...data].sort((a, b) => compareValues(a[sort.key], b[sort.key], sort.dir!))
  }, [data, sort])

  return { sorted, sort, toggle }
}

/** Inline sort icon — no extra imports needed */
export function sortIcon(dir: SortDir): string {
  if (dir === 'asc') return ' ↑'
  if (dir === 'desc') return ' ↓'
  return ' ↕'
}
