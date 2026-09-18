import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronDown, X } from 'lucide-react'
import type { CalendarEntry, CalendarJob } from '@/models/schedule.model'
import { EVENT_TYPE_ICONS, EVENT_TYPE_LABELS } from '@/models/schedule.model'
import { jobTypeLabel } from '@/models/job.model'
import type { ScheduleEvent } from '@/models/schedule.model'
import { formatDate } from '@/utils/date'
import { getEmployeeColor, resolveEmployeeColor } from '@/utils/employee-color'

interface Props {
  date: string | null
  entries: CalendarEntry[]
  /** Índice id→cor real do funcionário (ver `buildEmployeeColorIndex`). */
  employeeColors: Map<string, string>
  readOnly?: boolean
  /**
   * Id do funcionário logado, usado só em modo `readOnly` (agenda da
   * equipe no dashboard do funcionário — passo 5): controla se a OS abre em
   * "Ver detalhes" (é do próprio funcionário) ou fica sem nenhuma ação
   * (é de outro colaborador — clicar não leva a lugar nenhum, evitando um
   * 404 do IDOR do backend). Quando omitido, mantém o comportamento antigo
   * (sempre mostra o link em modo readOnly).
   */
  currentEmployeeId?: string
  onJobEdit?: (id: string) => void
  onJobCancel?: (id: string) => Promise<void>
  onEventCancel?: (id: string) => Promise<void>
  /** Quando fornecido, mostra um botão de fechar no cabeçalho do painel. */
  onClose?: () => void
}

function JobRow({
  job,
  onEdit,
  onCancel,
  readOnly = false,
  currentEmployeeId,
}: {
  job: CalendarJob
  onEdit?: (id: string) => void
  onCancel?: (id: string) => Promise<void>
  readOnly?: boolean
  currentEmployeeId?: string
}) {
  const [expanded, setExpanded] = useState(true)
  const [confirming, setConfirming] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const typeLabel = jobTypeLabel(job.jobType)
  const title = `OS${job.number ? ` ${job.number}` : ''}`
  const isCancelled = job.status === 'cancelled'
  // Passo 2: mesma fonte de verdade do chip/legenda — cor e nome vêm do
  // primeiro colaborador de employees[].
  const primary = job.employees[0]
  const color = primary ? getEmployeeColor(primary) : '#6b7280'
  const isOwnJob = currentEmployeeId ? job.employees.some((e) => e.id === currentEmployeeId) : true

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
          <span
            className="w-2.5 h-2.5 rounded-sm mt-0.5 flex-shrink-0"
            style={{ backgroundColor: color }}
          />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold truncate">
              {title} · {job.city}/{job.state}
            </p>
            <p className="text-[11px] text-base-content/50">
              {typeLabel} — {primary?.name ?? '—'}
            </p>
          </div>
          <ChevronDown
            size={14}
            className={`flex-shrink-0 mt-0.5 text-base-content/40 transition-transform ${expanded ? 'rotate-180' : ''}`}
          />
        </div>

        {expanded && (
          <div className="px-3 pb-3 pt-2 border-t border-base-200 text-sm">
            <div className="flex flex-wrap gap-x-4 gap-y-1">
              <p>
                <span className="font-medium">Tipo:</span> {typeLabel}
              </p>
              {job.clientName && (
                <p>
                  <span className="font-medium">Cliente:</span> {job.clientName}
                </p>
              )}
              <p>
                <span className="font-medium">Local:</span> {job.city}/{job.state}
              </p>
              <p>
                <span className="font-medium">Horário:</span> {job.startTime} – {job.endTime}
              </p>
              <p>
                <span className="font-medium">Colaboradores:</span>{' '}
                {job.employees.map((e) => e.name).join(', ') || '—'}
              </p>
            </div>
            <div className="mt-3 flex gap-2">
              {readOnly
                ? isOwnJob && (
                    <Link to={`/my-jobs/${job.id}`} className="btn btn-xs btn-ghost">
                      Ver detalhes →
                    </Link>
                  )
                : !isCancelled && (
                    <>
                      <button
                        type="button"
                        className="btn btn-xs btn-outline"
                        onClick={(e) => {
                          e.stopPropagation()
                          onEdit!(job.id)
                        }}
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        className="btn btn-xs btn-error btn-outline"
                        onClick={(e) => {
                          e.stopPropagation()
                          setConfirming(true)
                        }}
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
          <div className="modal-box bg-base-200 max-w-sm max-h-[90vh] overflow-y-auto">
            <h3 className="font-bold text-base mb-2">Cancelar OS</h3>
            <p className="text-sm text-base-content/70">
              Tem certeza que deseja cancelar <span className="font-semibold">{title}</span>? Esta
              ação não pode ser desfeita.
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
                {cancelling ? (
                  <span className="loading loading-spinner loading-xs" />
                ) : (
                  'Confirmar cancelamento'
                )}
              </button>
            </div>
          </div>
          <div className="modal-backdrop" onClick={() => !cancelling && setConfirming(false)} />
        </div>
      )}
    </>
  )
}

function EventRow({
  event,
  employeeColors,
  onCancel,
  readOnly = false,
}: {
  event: ScheduleEvent
  employeeColors: Map<string, string>
  onCancel?: (id: string) => Promise<void>
  readOnly?: boolean
}) {
  const [expanded, setExpanded] = useState(true)
  const [confirming, setConfirming] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  // Cor é sempre do funcionário, não do tipo — o ícone ao lado do rótulo
  // identifica o tipo (Folga/Férias/Treinamento/Afastamento médico).
  const color = resolveEmployeeColor(event.employeeIds[0], employeeColors)
  const Icon = EVENT_TYPE_ICONS[event.type]
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
          <span
            className="w-2.5 h-2.5 rounded-sm mt-0.5 flex-shrink-0"
            style={{ backgroundColor: color }}
          />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold flex items-center gap-1">
              <Icon size={14} className="text-base-content/50 flex-shrink-0" aria-hidden="true" />
              {label}
            </p>
            <p className="text-[11px] text-base-content/50">{event.employeeNames.join(', ')}</p>
          </div>
          <ChevronDown
            size={14}
            className={`flex-shrink-0 mt-0.5 text-base-content/40 transition-transform ${expanded ? 'rotate-180' : ''}`}
          />
        </div>

        {expanded && (
          <div className="px-3 pb-3 pt-2 border-t border-base-200 flex flex-col gap-1 text-sm">
            <p>
              <span className="font-medium">Período:</span> {formatDate(event.startDate)}
              {event.endDate !== event.startDate ? ` – ${formatDate(event.endDate)}` : ''}
            </p>
            {event.notes && (
              <p>
                <span className="font-medium">Observações:</span> {event.notes}
              </p>
            )}
            {!readOnly && (
              <div className="mt-3">
                <button
                  type="button"
                  className="btn btn-xs btn-error btn-outline"
                  onClick={(e) => {
                    e.stopPropagation()
                    setConfirming(true)
                  }}
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
          <div className="modal-box bg-base-200 max-w-sm max-h-[90vh] overflow-y-auto">
            <h3 className="font-bold text-base mb-2">Cancelar evento</h3>
            <p className="text-sm text-base-content/70">
              Tem certeza que deseja cancelar <span className="font-semibold">{label}</span> de{' '}
              <span className="font-semibold">{event.employeeNames.join(', ')}</span>?
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
                {cancelling ? (
                  <span className="loading loading-spinner loading-xs" />
                ) : (
                  'Confirmar cancelamento'
                )}
              </button>
            </div>
          </div>
          <div className="modal-backdrop" onClick={() => !cancelling && setConfirming(false)} />
        </div>
      )}
    </>
  )
}

export function DayDetailPanel({
  date,
  entries,
  employeeColors,
  readOnly = false,
  currentEmployeeId,
  onJobEdit,
  onJobCancel,
  onEventCancel,
  onClose,
}: Props) {
  if (!date || entries.length === 0) return null

  return (
    <div className="bg-base-200 rounded-t-lg">
      <div className="sticky top-0 z-10 flex items-center justify-between bg-base-200 px-3 pt-3 pb-2 border-b border-base-300">
        <p className="text-base font-bold text-base-content">{formatDate(date)} — Detalhes</p>
        {onClose && (
          <button
            type="button"
            className="btn btn-xs btn-ghost btn-circle"
            onClick={onClose}
            aria-label="Fechar detalhes"
          >
            <X size={14} />
          </button>
        )}
      </div>
      <div className="flex flex-col gap-1.5 px-3 pb-3">
        {entries.map((entry) =>
          entry.kind === 'job' ? (
            <JobRow
              key={entry.kind + '-' + entry.data.id}
              job={entry.data}
              onEdit={onJobEdit}
              onCancel={onJobCancel}
              readOnly={readOnly}
              currentEmployeeId={currentEmployeeId}
            />
          ) : (
            <EventRow
              key={entry.kind + '-' + entry.data.id}
              event={entry.data}
              employeeColors={employeeColors}
              onCancel={onEventCancel}
              readOnly={readOnly}
            />
          )
        )}
      </div>
    </div>
  )
}
