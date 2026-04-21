import { Link } from 'react-router-dom'
import type { Job, JobDetail } from '@/models/job.model'
import { JobRouteSuggestions } from '@/views/components/JobRouteSuggestions'
import { formatDate } from '@/utils/date'

const STATUS_LABEL: Record<string, string> = {
  scheduled: 'Agendado',
  pending: 'Pendente',
  in_progress: 'Em andamento',
  completed: 'Concluído',
  cancelled: 'Cancelado',
}

interface Props {
  job: JobDetail
  relatedJobs?: Job[]
}

export function JobDetailView({ job, relatedJobs }: Props) {
  return (
    <div className="flex flex-col gap-6">
      {(job.osCode || job.clientName) && (
        <div className="flex items-center gap-3 flex-wrap">
          {job.osCode && <span className="badge badge-outline badge-lg font-mono">{job.osCode}</span>}
          {job.clientName && <span className="text-sm text-base-content/60">{job.clientName}</span>}
        </div>
      )}
      {/* Basic info */}
      <div className="card bg-base-200 p-4">
        <h2 className="font-bold text-lg mb-3">Informações da OS</h2>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <span className="font-medium">Data:</span><span>{formatDate(job.scheduledDate)}</span>
          <span className="font-medium">Cidade:</span><span>{job.city}/{job.state}</span>
          {job.address && <>
            <span className="font-medium">Endereço:</span>
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${job.address}, ${job.city}, ${job.state}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="link link-primary text-sm"
            >
              {job.address} ↗
            </a>
          </>}
          <span className="font-medium">Check-in:</span><span>{job.startTime}</span>
          <span className="font-medium">Check-out:</span><span>{job.endTime}</span>
          <span className="font-medium">Hospedagem:</span><span>{job.accommodation ? 'Sim' : 'Não'}</span>
          <span className="font-medium">Carro:</span><span>{job.car ? 'Sim' : 'Não'}</span>
          {job.car && job.carPickupTime && <><span className="font-medium">Retirada:</span><span>{job.carPickupTime}</span></>}
          {job.car && job.carReturnTime && <><span className="font-medium">Devolução:</span><span>{job.carReturnTime}</span></>}
          {job.car && job.carPickupAddress && <><span className="font-medium">Locadora:</span><span>{job.carPickupAddress}</span></>}
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

      {/* Related jobs history */}
      {relatedJobs && relatedJobs.length > 0 && (
        <div className="card bg-base-200 p-4">
          <h2 className="font-bold text-lg mb-3">Histórico desta Máquina</h2>
          <div className="overflow-x-auto">
            <table className="table table-sm">
              <thead>
                <tr className="text-xs text-base-content/40 uppercase tracking-wider">
                  <th>Data</th>
                  <th>Funcionário</th>
                  <th>Tipo</th>
                  <th>Status</th>
                  <th>Descrição</th>
                </tr>
              </thead>
              <tbody>
                {relatedJobs.map((r) => (
                  <tr key={r.id} className="hover:bg-base-300/30">
                    <td className="num text-base-content/60">{formatDate(r.scheduledDate)}</td>
                    <td>{r.employeeName}</td>
                    <td>
                      <span className={`badge badge-sm ${r.jobType === 'maintenance' ? 'badge-warning' : 'badge-info'}`}>
                        {r.jobType === 'maintenance' ? 'Manutenção' : 'Implementação'}
                      </span>
                    </td>
                    <td>
                      <span className="badge badge-sm badge-ghost">{STATUS_LABEL[r.status] ?? r.status}</span>
                    </td>
                    <td className="text-base-content/70 truncate max-w-48">{r.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Post-work route suggestions */}
      <JobRouteSuggestions city={job.city} state={job.state} />

      {/* Finalize button */}
      {job.status === 'in_progress' && (
        <Link to={`/jobs/${job.id}/finalize`} className="btn btn-primary w-full">
          Finalizar OS
        </Link>
      )}
    </div>
  )
}
