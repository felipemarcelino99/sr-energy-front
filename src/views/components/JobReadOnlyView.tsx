import type { JobDetail } from '@/models/job.model'
import { formatDate } from '@/utils/date'

const STATUS_LABEL: Record<string, string> = {
  scheduled: 'Agendado',
  in_progress: 'Em andamento',
  completed: 'Concluído',
  cancelled: 'Cancelado',
}

const STATUS_CLASS: Record<string, string> = {
  scheduled: 'badge-warning',
  in_progress: 'badge-info',
  completed: 'badge-success',
  cancelled: 'badge-error',
}

interface Props { job: JobDetail }

export function JobReadOnlyView({ job }: Props) {
  return (
    <div className="flex flex-col gap-6">
      <div className="card bg-base-200 border border-base-300">
        <div className="card-body gap-3">
          <h2 className="text-xs font-semibold text-base-content/40 uppercase tracking-wider">Funcionário e Data</h2>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <span className="font-medium">Funcionário:</span><span>{job.employeeName}</span>
            <span className="font-medium">Data:</span><span>{formatDate(job.scheduledDate)}</span>
          </div>
        </div>
      </div>

      <div className="card bg-base-200 border border-base-300">
        <div className="card-body gap-3">
          <h2 className="text-xs font-semibold text-base-content/40 uppercase tracking-wider">Local e Horários</h2>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <span className="font-medium">Cidade:</span><span>{job.city}</span>
            <span className="font-medium">Estado:</span><span>{job.state}</span>
            <span className="font-medium">Início:</span><span>{job.startTime}</span>
            <span className="font-medium">Término:</span><span>{job.endTime}</span>
            <span className="font-medium">Hospedagem:</span><span>{job.accommodation ? 'Sim' : 'Não'}</span>
            <span className="font-medium">Carro:</span><span>{job.car ? 'Sim' : 'Não'}</span>
          </div>
        </div>
      </div>

      <div className="card bg-base-200 border border-base-300">
        <div className="card-body gap-3">
          <h2 className="text-xs font-semibold text-base-content/40 uppercase tracking-wider">Máquina e Trabalho</h2>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <span className="font-medium">Máquina:</span><span>{job.machineName}</span>
            <span className="font-medium">Tipo:</span>
            <span>{job.jobType === 'maintenance' ? 'Manutenção' : 'Implementação'}</span>
            <span className="font-medium">Status:</span>
            <span>
              <span className={`badge badge-sm ${STATUS_CLASS[job.status] ?? 'badge-ghost'}`}>
                {STATUS_LABEL[job.status] ?? job.status}
              </span>
            </span>
          </div>
          <div className="text-sm mt-1">
            <p className="font-medium mb-1">Descrição:</p>
            <p className="text-base-content/70">{job.description}</p>
          </div>
          {job.notes && (
            <div className="text-sm">
              <p className="font-medium mb-1">Observações:</p>
              <p className="text-base-content/70">{job.notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
