import { formatDate, formatDateTime } from '@/utils/date'

describe('formatDate', () => {
  it('formats YYYY-MM-DD to DD/MM/YYYY', () => {
    expect(formatDate('2026-04-01')).toBe('01/04/2026')
  })

  it('returns — for empty string', () => {
    expect(formatDate('')).toBe('—')
  })

  it('ignores time component', () => {
    expect(formatDate('2026-12-25T10:30:00Z')).toBe('25/12/2026')
  })
})

describe('formatDateTime', () => {
  it('formats ISO timestamp (no offset) to DD/MM/YYYY HH:mm', () => {
    // No timezone suffix → parsed as local time
    expect(formatDateTime('2026-04-01T14:30:00')).toBe('01/04/2026 14:30')
  })

  it('returns — for empty string', () => {
    expect(formatDateTime('')).toBe('—')
  })

  it('pads single-digit hours and minutes', () => {
    expect(formatDateTime('2026-04-01T09:05:00')).toBe('01/04/2026 09:05')
  })

  it('returns — for falsy input', () => {
    expect(formatDateTime(undefined as unknown as string)).toBe('—')
  })
})
