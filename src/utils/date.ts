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

/**
 * Formats an ISO timestamp string to DD/MM/YYYY HH:mm in local timezone.
 * Use for datetime fields (createdAt, adjustedAt, submittedAt, scheduledAt, etc.).
 */
export function formatDateTime(date: string): string {
  if (!date) return '—'
  const d = new Date(date)
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const year = d.getFullYear()
  const hours = String(d.getHours()).padStart(2, '0')
  const minutes = String(d.getMinutes()).padStart(2, '0')
  return `${day}/${month}/${year} ${hours}:${minutes}`
}
