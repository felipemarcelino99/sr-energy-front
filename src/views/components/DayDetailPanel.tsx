import { useNavigate } from 'react-router-dom'
import type { CalendarEntry } from '@/models/schedule.model'
import { EVENT_TYPE_COLORS, EVENT_TYPE_LABELS } from '@/models/schedule.model'
import type { Job } from '@/models/job.model'
import type { ScheduleEvent } from '@/models/schedule.model'

interface Props {
  date: string | null
  entries: CalendarEntry[]
}

function formatDate(date: string) {
  const [y, m, d] = date.split('-')
  return `${d}/${m}/${y}`
}

function JobRow({ job }: { job: Job }) {
  const navigate = useNavigate()
  return (
    <div
      className="flex gap-3 items-start p-2 rounded-md bg-base-300 cursor-pointer hover:bg-base-100 transition-colors"
      onClick={() => navigate(`/jobs/${job.id}`)}
    >
      <span className="w-2.5 h-2.5 rounded-sm mt-0.5 flex-shrink-0" style={{ backgroundColor: '#3b82f6' }} />
      <div>
        <p className="text-xs font-semibold">{job.title}</p>
        <p className="text-[11px] text-base-content/50">Trabalho</p>
      </div>
    </div>
  )
}

function EventRow({ event }: { event: ScheduleEvent }) {
  const navigate = useNavigate()
  const color = EVENT_TYPE_COLORS[event.type]
  const label = EVENT_TYPE_LABELS[event.type]
  return (
    <div
      className="flex gap-3 items-start p-2 rounded-md bg-base-300 cursor-pointer hover:bg-base-100 transition-colors"
      onClick={() => navigate(`/schedule/${event.id}`)}
    >
      <span className="w-2.5 h-2.5 rounded-sm mt-0.5 flex-shrink-0" style={{ backgroundColor: color }} />
      <div>
        <p className="text-xs font-semibold">{label}</p>
        <p className="text-[11px] text-base-content/50">
          {event.employeeNames.join(', ')} · {formatDate(event.startDate)}
          {event.endDate !== event.startDate ? ` – ${formatDate(event.endDate)}` : ''}
        </p>
      </div>
    </div>
  )
}

export function DayDetailPanel({ date, entries }: Props) {
  if (!date) return null

  return (
    <div className="mt-4 bg-base-200 rounded-lg p-3">
      <p className="text-xs font-semibold text-base-content/50 mb-2">{formatDate(date)} — Detalhes</p>
      {entries.length === 0 ? (
        <p className="text-xs text-base-content/40">Nenhum evento neste dia.</p>
      ) : (
        <div className="flex flex-col gap-1.5">
          {entries.map((entry, i) =>
            entry.kind === 'job'
              ? <JobRow key={i} job={entry.data} />
              : <EventRow key={i} event={entry.data} />
          )}
        </div>
      )}
    </div>
  )
}
