import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import type { Job, JobDetail } from '@/models/job.model'
import { JOB_STATUS_LABEL, jobTypeLabel } from '@/models/job.model'
import { startJob } from '@/services/job.service'
import { JobRouteSuggestions } from '@/views/components/JobRouteSuggestions'
import { formatDate } from '@/utils/date'

interface Props {
  job: JobDetail
  relatedJobs?: Job[]
  /** Chamado após "Iniciar OS" ter sucesso, pra quem mantém o `job` em estado local (fora do TanStack Query) recarregar. */
  onStarted?: () => void
}

export function JobDetailView({ job, relatedJobs, onStarted }: Props) {
  const [confirmingStart, setConfirmingStart] = useState(false)
  const startMutation = useMutation({
    mutationFn: () => startJob(job.id),
    onSuccess: () => {
      setConfirmingStart(false)
      onStarted?.()
    },
  })

  const canStart = job.status === 'scheduled' || job.status === 'pending'

  return (
    <div className="flex flex-col gap-6">
      {(job.number || job.clientName) && (
        <div className="flex items-center gap-3 flex-wrap">
          {job.number && (
            <span className="badge badge-outline badge-lg font-mono">{job.number}</span>
          )}
          {job.clientName && <span className="text-sm text-base-content/60">{job.clientName}</span>}
        </div>
      )}
      {/* Basic info */}
      <div className="card bg-base-200 p-4">
        <h2 className="font-bold text-lg mb-3">Informações da OS</h2>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <span className="font-medium">Data:</span>
          <span>{formatDate(job.scheduledDate)}</span>
          <span className="font-medium">Cidade:</span>
          <span>
            {job.city}/{job.state}
          </span>
          {job.address && (
            <>
              <span className="font-medium">Endereço:</span>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${job.address}, ${job.city}, ${job.state}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="link link-primary text-sm"
              >
                {job.address} ↗
              </a>
            </>
          )}
          <span className="font-medium">Check-in:</span>
          <span>{job.startTime}</span>
          <span className="font-medium">Check-out:</span>
          <span>{job.endTime}</span>
          <span className="font-medium">Hospedagem:</span>
          <span>{job.accommodation ? 'Sim' : 'Não'}</span>
          <span className="font-medium">Carro:</span>
          <span>{job.car ? 'Sim' : 'Não'}</span>
          {job.car && job.carPickupTime && (
            <>
              <span className="font-medium">Retirada:</span>
              <span>{job.carPickupTime}</span>
            </>
          )}
          {job.car && job.carReturnTime && (
            <>
              <span className="font-medium">Devolução:</span>
              <span>{job.carReturnTime}</span>
            </>
          )}
          {job.car && job.carPickupAddress && (
            <>
              <span className="font-medium">Locadora:</span>
              <span>{job.carPickupAddress}</span>
            </>
          )}
          <span className="font-medium">Tipo:</span>
          <span>{jobTypeLabel(job.jobType)}</span>
        </div>
        {job.scopeDetail && (
          <p className="mt-3 text-sm">
            <span className="font-medium">Escopo:</span> {job.scopeDetail}
          </p>
        )}
        {job.notes && (
          <p className="mt-3 text-sm">
            <span className="font-medium">Observações:</span> {job.notes}
          </p>
        )}
      </div>

      {/* Machine manual */}
      {job.machine?.manualUrl && (
        <div className="card bg-base-200 p-4">
          <h2 className="font-bold text-lg mb-3">Manual do Equipamento</h2>
          <iframe
            src={job.machine.manualUrl}
            title="Manual do Equipamento"
            className="w-full h-96 rounded border"
          />
        </div>
      )}

      {/* Related jobs history */}
      {relatedJobs && relatedJobs.length > 0 && (
        <div className="card bg-base-200 p-4">
          <h2 className="font-bold text-lg mb-3">Histórico deste Equipamento</h2>
          <div className="overflow-x-auto">
            <table className="table table-sm">
              <thead>
                <tr className="text-xs text-base-content/40 uppercase tracking-wider">
                  <th>Data</th>
                  <th>Funcionário</th>
                  <th>Tipo</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {relatedJobs.map((r) => (
                  <tr key={r.id} className="hover:bg-base-300/30">
                    <td className="num text-base-content/60">{formatDate(r.scheduledDate)}</td>
                    <td>{r.employeeName}</td>
                    <td>
                      <span className="badge badge-sm badge-info">{jobTypeLabel(r.jobType)}</span>
                    </td>
                    <td>
                      <span className="badge badge-sm badge-ghost">
                        {JOB_STATUS_LABEL[r.status] ?? r.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Post-work route suggestions */}
      <JobRouteSuggestions city={job.city} state={job.state} />

      {/* Iniciar / Finalizar OS */}
      {canStart && (
        <div className="flex flex-col gap-2">
          <p className="text-xs text-base-content/50">Inicie a OS para poder finalizá-la.</p>
          {startMutation.isError && (
            <div className="alert alert-error text-sm">Não foi possível iniciar a OS.</div>
          )}
          {!confirmingStart ? (
            <button
              type="button"
              className="btn btn-primary w-full"
              onClick={() => setConfirmingStart(true)}
            >
              Iniciar OS
            </button>
          ) : (
            <div className="flex gap-3">
              <button
                type="button"
                className="btn btn-ghost flex-1"
                onClick={() => setConfirmingStart(false)}
                disabled={startMutation.isPending}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn btn-primary flex-1"
                onClick={() => startMutation.mutate()}
                disabled={startMutation.isPending}
              >
                {startMutation.isPending ? (
                  <span className="loading loading-spinner loading-sm" />
                ) : (
                  'Confirmar início'
                )}
              </button>
            </div>
          )}
        </div>
      )}
      {job.status === 'in_progress' && (
        <Link to={`/jobs/${job.id}/finalize`} className="btn btn-primary w-full">
          Finalizar OS
        </Link>
      )}
    </div>
  )
}
