/**
 * Formats an ISO date string (YYYY-MM-DD or full ISO timestamp) to DD/MM/YYYY.
 * Parses the date part directly to avoid timezone offset issues.
 */
export function formatDate(iso: string): string {
  if (!iso) return '—'
  const [y, m, d] = iso.split('T')[0].split('-')
  return `${d}/${m}/${y}`
}
