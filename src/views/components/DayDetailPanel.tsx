import type { CalendarEntry } from '@/models/schedule.model'
import { EVENT_TYPE_COLORS, EVENT_TYPE_LABELS, JOB_COLOR } from '@/models/schedule.model'
import type { Job } from '@/models/job.model'
import type { ScheduleEvent } from '@/models/schedule.model'

interface Props {
  date: string | null
  entries: CalendarEntry[]
  onJobClick: (id: string) => void
  onEventClick: (id: string) => void
}

function formatDate(date: string) {
  const [y, m, d] = date.split('-')
  return `${d}/${m}/${y}`
}

function JobRow({ job, onJobClick }: { job: Job; onJobClick: (id: string) => void }) {
  return (
    <div
      className="flex gap-3 items-start p-2 rounded-md bg-base-300 cursor-pointer hover:bg-base-100 transition-colors"
      onClick={() => onJobClick(job.id)}
    >
      <span className="w-2.5 h-2.5 rounded-sm mt-0.5 flex-shrink-0" style={{ backgroundColor: JOB_COLOR }} />
      <div>
        <p className="text-xs font-semibold">{job.title}</p>
        <p className="text-[11px] text-base-content/50">Trabalho</p>
      </div>
    </div>
  )
}

function EventRow({ event, onEventClick }: { event: ScheduleEvent; onEventClick: (id: string) => void }) {
  const color = EVENT_TYPE_COLORS[event.type]
  const label = EVENT_TYPE_LABELS[event.type]
  return (
    <div
      className="flex gap-3 items-start p-2 rounded-md bg-base-300 cursor-pointer hover:bg-base-100 transition-colors"
      onClick={() => onEventClick(event.id)}
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

export function DayDetailPanel({ date, entries, onJobClick, onEventClick }: Props) {
  if (!date) return null

  return (
    <div className="mt-4 bg-base-200 rounded-lg p-3">
      <p className="text-xs font-semibold text-base-content/50 mb-2">{formatDate(date)} — Detalhes</p>
      {entries.length === 0 ? (
        <p className="text-xs text-base-content/40">Nenhum evento neste dia.</p>
      ) : (
        <div className="flex flex-col gap-1.5">
          {entries.map((entry) =>
            entry.kind === 'job'
              ? <JobRow key={entry.kind + '-' + entry.data.id} job={entry.data} onJobClick={onJobClick} />
              : <EventRow key={entry.kind + '-' + entry.data.id} event={entry.data} onEventClick={onEventClick} />
          )}
        </div>
      )}
    </div>
  )
}
