import { Link } from 'react-router-dom'
import type { JobDetail } from '@/models/job.model'
import { JobRouteSuggestions } from '@/views/components/JobRouteSuggestions'
import { formatDate } from '@/utils/date'

interface Props {
  job: JobDetail
}

export function JobDetailView({ job }: Props) {
  return (
    <div className="flex flex-col gap-6">
      {/* Basic info */}
      <div className="card bg-base-200 p-4">
        <h2 className="font-bold text-lg mb-3">Informações do Trabalho</h2>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <span className="font-medium">Data:</span><span>{formatDate(job.scheduledDate)}</span>
          <span className="font-medium">Cidade:</span><span>{job.city}/{job.state}</span>
          <span className="font-medium">Horário:</span><span>{job.startTime} – {job.endTime}</span>
          <span className="font-medium">Hospedagem:</span><span>{job.accommodation ? 'Sim' : 'Não'}</span>
          <span className="font-medium">Carro:</span><span>{job.car ? 'Sim' : 'Não'}</span>
          <span className="font-medium">Tipo:</span>
          <span>{job.jobType === 'maintenance' ? 'Manutenção' : 'Implementação'}</span>
        </div>
        <p className="mt-3 text-sm"><span className="font-medium">Descrição:</span> {job.description}</p>
      </div>

      {/* Machine manual */}
      {job.machine?.manualUrl && (
        <div className="card bg-base-200 p-4">
          <h2 className="font-bold text-lg mb-3">Manual da Máquina</h2>
          <iframe
            src={job.machine.manualUrl}
            title="Manual da Máquina"
            className="w-full h-96 rounded border"
          />
        </div>
      )}

      {/* Post-work route suggestions */}
      <JobRouteSuggestions city={job.city} state={job.state} />

      {/* Finalize button */}
      {job.status === 'in_progress' && (
        <Link to={`/jobs/${job.id}/finalize`} className="btn btn-primary w-full">
          Finalizar Trabalho
        </Link>
      )}
    </div>
  )
}
