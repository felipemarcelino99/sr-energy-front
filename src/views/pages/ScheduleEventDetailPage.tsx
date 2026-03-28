import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { fetchScheduleEventById } from '@/services/schedule.service'
import { EVENT_TYPE_COLORS, EVENT_TYPE_LABELS } from '@/models/schedule.model'
import type { ScheduleEvent } from '@/models/schedule.model'
import { formatDate } from '@/utils/date'

export function ScheduleEventDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [event, setEvent] = useState<ScheduleEvent | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    fetchScheduleEventById(id)
      .then(setEvent)
      .catch((e) => setError(e.message))
  }, [id])

  if (error) return <div className="p-4 text-error">{error}</div>
  if (!event) return <div className="p-4">Carregando...</div>

  const color = EVENT_TYPE_COLORS[event.type]
  const label = EVENT_TYPE_LABELS[event.type]

  return (
    <div className="p-4 max-w-md">
      <button className="btn btn-ghost btn-sm mb-4" onClick={() => navigate('/schedule')}>← Voltar</button>

      <h1 className="text-xl font-bold mb-6">Detalhe do Evento</h1>

      <div className="flex flex-col gap-3">
        <div>
          <p className="text-xs text-base-content/50 uppercase tracking-wide mb-1">Tipo</p>
          <span className="badge text-white text-xs px-2 py-1" style={{ backgroundColor: color }}>{label}</span>
        </div>

        <div>
          <p className="text-xs text-base-content/50 uppercase tracking-wide mb-1">Funcionários</p>
          <p className="text-sm">{event.employeeNames.join(', ')}</p>
        </div>

        <div>
          <p className="text-xs text-base-content/50 uppercase tracking-wide mb-1">Data de início</p>
          <p className="text-sm">{formatDate(event.startDate)}</p>
        </div>

        {event.endDate !== event.startDate && (
          <div>
            <p className="text-xs text-base-content/50 uppercase tracking-wide mb-1">Data de término</p>
            <p className="text-sm">{formatDate(event.endDate)}</p>
          </div>
        )}

        {event.notes && (
          <div>
            <p className="text-xs text-base-content/50 uppercase tracking-wide mb-1">Observações</p>
            <p className="text-sm">{event.notes}</p>
          </div>
        )}
      </div>
    </div>
  )
}
