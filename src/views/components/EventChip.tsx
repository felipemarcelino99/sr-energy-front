import type { CalendarEntry } from '@/models/schedule.model'
import { EVENT_TYPE_COLORS, EVENT_TYPE_LABELS, JOB_COLOR } from '@/models/schedule.model'
import { getEmployeeColor } from '@/utils/employee-color'

interface Props {
  entry: CalendarEntry
}

export function EventChip({ entry }: Props) {
  if (entry.kind === 'job') {
    const { description, city, state, employeeName, employeeIds, scheduledDate, scheduledEndDate } =
      entry.data
    const ids = employeeIds ?? []
    const isMultiDay = !!scheduledEndDate && scheduledEndDate > scheduledDate
    const label = `${description} · ${city}/${state} — ${employeeName}`
    const hasMultiple = ids.length > 1
    const color = ids.length > 0 ? getEmployeeColor(ids[0]) : JOB_COLOR
    const titleParts = [label]
    if (hasMultiple) titleParts.push(`(+${ids.length - 1} colaborador(es))`)
    if (isMultiDay) titleParts.push(`(${scheduledDate} a ${scheduledEndDate})`)
    const title = titleParts.join(' ')
    return (
      <span
        className="relative block truncate rounded px-1 py-0.5 text-[10px] text-white"
        style={{
          backgroundColor: color,
          boxShadow: hasMultiple ? `inset 0 0 0 1.5px #ffffffcc` : undefined,
        }}
        title={title}
      >
        {isMultiDay && (
          <span className="mr-0.5" aria-hidden="true">
            ⋯
          </span>
        )}
        {label}
        {hasMultiple && (
          <span
            className="ml-1 inline-block rounded-full bg-white/80 px-1 text-[9px] font-semibold leading-none align-middle"
            style={{ color }}
          >
            +{ids.length - 1}
          </span>
        )}
      </span>
    )
  }

  const label = EVENT_TYPE_LABELS[entry.data.type]
  const color = EVENT_TYPE_COLORS[entry.data.type]
  const names = entry.data.employeeNames.join(', ')

  return (
    <span
      className="block truncate rounded px-1 py-0.5 text-[10px]"
      style={{
        backgroundColor: color,
        color: entry.data.type === 'medical_leave' ? '#0d0d21' : 'white',
      }}
      title={`${label} · ${names}`}
    >
      {label}
    </span>
  )
}
