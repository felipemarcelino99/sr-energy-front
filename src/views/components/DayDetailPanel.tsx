import { useState } from 'react'
import { Link } from 'react-router-dom'
import type { CalendarEntry } from '@/models/schedule.model'
import { EVENT_TYPE_COLORS, EVENT_TYPE_LABELS, JOB_COLOR } from '@/models/schedule.model'
import type { Job } from '@/models/job.model'
import type { ScheduleEvent } from '@/models/schedule.model'
import { formatDate } from '@/utils/date'

interface Props {
  date: string | null
  entries: CalendarEntry[]
  onJobClick: (id: string) => void
  onEventClick: (id: string) => void
}

function JobRow({ job }: { job: Job }) {
  const [expanded, setExpanded] = useState(false)
  const jobTypeLabel = job.jobType === 'maintenance' ? 'Manutenção' : 'Implementação'

  return (
    <div className="rounded-md bg-base-300 overflow-hidden">
      <div
        className="flex gap-3 items-start p-2 cursor-pointer hover:bg-base-100 transition-colors"
        onClick={() => setExpanded((v) => !v)}
      >
        <span className="w-2.5 h-2.5 rounded-sm mt-0.5 flex-shrink-0" style={{ backgroundColor: JOB_COLOR }} />
        <div className="min-w-0">
          <p className="text-xs font-semibold truncate">{job.description} · {job.city}/{job.state}</p>
          <p className="text-[11px] text-base-content/50">{jobTypeLabel} — {job.employeeName}</p>
        </div>
      </div>

      {expanded && (
        <div className="px-3 pb-3 pt-1 border-t border-base-200 flex flex-col gap-1 text-sm">
          <p><span className="font-medium">Descrição:</span> {job.description}</p>
          <p><span className="font-medium">Local:</span> {job.city}/{job.state}</p>
          <p><span className="font-medium">Horário:</span> {job.startTime} – {job.endTime}</p>
          <p>
            <span className="font-medium">Hospedagem:</span> {job.accommodation ? 'Sim' : 'Não'}
            {' · '}
            <span className="font-medium">Carro:</span> {job.car ? 'Sim' : 'Não'}
          </p>
          <div className="mt-1">
            <Link to={`/jobs/${job.id}`} className="btn btn-xs btn-primary">Ver detalhes</Link>
          </div>
        </div>
      )}
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

export function DayDetailPanel({ date, entries, onJobClick: _onJobClick, onEventClick }: Props) {
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
              ? <JobRow key={entry.kind + '-' + entry.data.id} job={entry.data} />
              : <EventRow key={entry.kind + '-' + entry.data.id} event={entry.data} onEventClick={onEventClick} />
          )}
        </div>
      )}
    </div>
  )
}
