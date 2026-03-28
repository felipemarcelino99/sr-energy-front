export function toLocalDateString(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/**
 * Formats an ISO date string (YYYY-MM-DD or full ISO timestamp) to DD/MM/YYYY.
 * Parses the date part directly to avoid timezone offset issues.
 */
export function formatDate(date: string): string {
  if (!date) return '—'
  const [y, m, d] = date.split('T')[0].split('-')
  return `${d}/${m}/${y}`
}
