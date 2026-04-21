import { Calendar } from 'lucide-react'
import type { JobSummary } from '@/models/dashboard.model'
import { formatDate } from '@/utils/date'

const STATUS_CLASS: Record<string, string> = {
  scheduled: 'badge-warning',
  pending: 'badge-warning',
  in_progress: 'badge-info',
  completed: 'badge-success',
  cancelled: 'badge-error',
}

const STATUS_LABEL: Record<string, string> = {
  scheduled: 'Agendado',
  pending: 'Pendente',
  in_progress: 'Em andamento',
  completed: 'Concluído',
  cancelled: 'Cancelado',
}

interface NextJobWidgetProps {
  job: JobSummary | null
}

export function NextJobWidget({ job }: NextJobWidgetProps) {
  if (!job) {
    return (
      <div
        data-testid="next-job-empty"
        className="flex flex-col items-center justify-center py-8 gap-2 text-base-content/30"
      >
        <Calendar size={24} />
        <p className="text-sm">Nenhuma OS agendada</p>
      </div>
    )
  }

  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex flex-col gap-1">
        <p className="font-semibold text-base-content">{job.title}</p>
        <p
          data-testid="next-job-date"
          className="text-sm text-base-content/50 flex items-center gap-1"
        >
          <Calendar size={12} />
          {formatDate(job.scheduledAt)}
        </p>
      </div>
      <span className={`badge badge-sm shrink-0 ${STATUS_CLASS[job.status] ?? 'badge-ghost'}`}>
        {STATUS_LABEL[job.status] ?? job.status}
      </span>
    </div>
  )
}
