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
  readOnly?: boolean
  onJobEdit?: (id: string) => void
  onJobCancel?: (id: string) => Promise<void>
  onEventCancel?: (id: string) => Promise<void>
}

function JobRow({ job, onEdit, onCancel, readOnly = false }: {
  job: Job
  onEdit?: (id: string) => void
  onCancel?: (id: string) => Promise<void>
  readOnly?: boolean
}) {
  const [expanded, setExpanded] = useState(true)
  const [confirming, setConfirming] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const jobTypeLabel = job.jobType === 'maintenance' ? 'Manutenção' : 'Implementação'
  const isCancelled = job.status === 'cancelled'

  const handleConfirmCancel = async () => {
    setCancelling(true)
    try {
      await onCancel!(job.id)
    } finally {
      setCancelling(false)
      setConfirming(false)
    }
  }

  return (
    <>
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
            <div className="mt-2 flex gap-2">
              {readOnly ? (
                <Link
                  to={`/my-jobs/${job.id}`}
                  className="btn btn-xs btn-ghost"
                >
                  Ver detalhes →
                </Link>
              ) : !isCancelled && (
                <>
                  <button
                    type="button"
                    className="btn btn-xs btn-outline"
                    onClick={(e) => { e.stopPropagation(); onEdit!(job.id) }}
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    className="btn btn-xs btn-error btn-outline"
                    onClick={(e) => { e.stopPropagation(); setConfirming(true) }}
                  >
                    Cancelar
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {!readOnly && confirming && (
        <div className="modal modal-open" role="dialog" aria-modal="true">
          <div className="modal-box max-w-sm">
            <h3 className="font-bold text-base mb-2">Cancelar OS</h3>
            <p className="text-sm text-base-content/70">
              Tem certeza que deseja cancelar <span className="font-semibold">{job.description}</span>? Esta ação não pode ser desfeita.
            </p>
            <div className="modal-action">
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => setConfirming(false)}
                disabled={cancelling}
              >
                Voltar
              </button>
              <button
                type="button"
                className="btn btn-error btn-sm"
                onClick={handleConfirmCancel}
                disabled={cancelling}
              >
                {cancelling ? <span className="loading loading-spinner loading-xs" /> : 'Confirmar cancelamento'}
              </button>
            </div>
          </div>
          <div className="modal-backdrop" onClick={() => !cancelling && setConfirming(false)} />
        </div>
      )}
    </>
  )
}

function EventRow({ event, onCancel, readOnly = false }: {
  event: ScheduleEvent
  onCancel?: (id: string) => Promise<void>
  readOnly?: boolean
}) {
  const [expanded, setExpanded] = useState(true)
  const [confirming, setConfirming] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const color = EVENT_TYPE_COLORS[event.type]
  const label = EVENT_TYPE_LABELS[event.type]

  const handleConfirmCancel = async () => {
    setCancelling(true)
    try {
      await onCancel!(event.id)
    } finally {
      setCancelling(false)
      setConfirming(false)
    }
  }

  return (
    <>
      <div className="rounded-md bg-base-300 overflow-hidden">
        <div
          className="flex gap-3 items-start p-2 cursor-pointer hover:bg-base-100 transition-colors"
          onClick={() => setExpanded((v) => !v)}
        >
          <span className="w-2.5 h-2.5 rounded-sm mt-0.5 flex-shrink-0" style={{ backgroundColor: color }} />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold">{label}</p>
            <p className="text-[11px] text-base-content/50">{event.employeeNames.join(', ')}</p>
          </div>
        </div>

        {expanded && (
          <div className="px-3 pb-3 pt-1 border-t border-base-200 flex flex-col gap-1 text-sm">
            <p><span className="font-medium">Período:</span> {formatDate(event.startDate)}{event.endDate !== event.startDate ? ` – ${formatDate(event.endDate)}` : ''}</p>
            {event.notes && <p><span className="font-medium">Observações:</span> {event.notes}</p>}
            {!readOnly && (
              <div className="mt-2">
                <button
                  type="button"
                  className="btn btn-xs btn-error btn-outline"
                  onClick={(e) => { e.stopPropagation(); setConfirming(true) }}
                >
                  Cancelar
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {!readOnly && confirming && (
        <div className="modal modal-open" role="dialog" aria-modal="true">
          <div className="modal-box max-w-sm">
            <h3 className="font-bold text-base mb-2">Cancelar evento</h3>
            <p className="text-sm text-base-content/70">
              Tem certeza que deseja cancelar <span className="font-semibold">{label}</span> de <span className="font-semibold">{event.employeeNames.join(', ')}</span>?
            </p>
            <div className="modal-action">
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setConfirming(false)} disabled={cancelling}>
                Voltar
              </button>
              <button type="button" className="btn btn-error btn-sm" onClick={handleConfirmCancel} disabled={cancelling}>
                {cancelling ? <span className="loading loading-spinner loading-xs" /> : 'Confirmar cancelamento'}
              </button>
            </div>
          </div>
          <div className="modal-backdrop" onClick={() => !cancelling && setConfirming(false)} />
        </div>
      )}
    </>
  )
}

export function DayDetailPanel({ date, entries, readOnly = false, onJobEdit, onJobCancel, onEventCancel }: Props) {
  if (!date || entries.length === 0) return null

  return (
    <div className="mt-4 bg-base-200 rounded-lg p-3">
      <p className="text-xs font-semibold text-base-content/50 mb-2">{formatDate(date)} — Detalhes</p>
      <div className="flex flex-col gap-1.5">
        {entries.map((entry) =>
          entry.kind === 'job'
            ? <JobRow key={entry.kind + '-' + entry.data.id} job={entry.data} onEdit={onJobEdit} onCancel={onJobCancel} readOnly={readOnly} />
            : <EventRow key={entry.kind + '-' + entry.data.id} event={entry.data} onCancel={onEventCancel} readOnly={readOnly} />
        )}
      </div>
    </div>
  )
}
