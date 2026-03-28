import type { CalendarEntry } from '@/models/schedule.model'
import { EVENT_TYPE_COLORS, EVENT_TYPE_LABELS, JOB_COLOR } from '@/models/schedule.model'

interface Props {
  entry: CalendarEntry
}

export function EventChip({ entry }: Props) {
  if (entry.kind === 'job') {
    const { description, city, state, employeeName } = entry.data
    const label = `${description} · ${city}/${state} — ${employeeName}`
    return (
      <span
        className="block truncate rounded px-1 py-0.5 text-[10px] text-white"
        style={{ backgroundColor: JOB_COLOR }}
        title={label}
      >
        {label}
      </span>
    )
  }

  const label = EVENT_TYPE_LABELS[entry.data.type]
  const color = EVENT_TYPE_COLORS[entry.data.type]
  const names = entry.data.employeeNames.join(', ')

  return (
    <span
      className="block truncate rounded px-1 py-0.5 text-[10px]"
      style={{ backgroundColor: color, color: entry.data.type === 'medical_leave' ? '#0d0d21' : 'white' }}
      title={`${label} · ${names}`}
    >
      {label}
    </span>
  )
}
