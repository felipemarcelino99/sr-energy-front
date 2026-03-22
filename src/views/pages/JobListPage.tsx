import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, Pencil, Ban } from 'lucide-react'
import { useJobStore } from '@/viewmodels/job.viewmodel'
import { usePagination } from '@/utils/usePagination'
import { Pagination } from '@/views/components/Pagination'
import type { JobStatus } from '@/models/job.model'
import { formatDate } from '@/utils/date'

const statusLabel: Record<JobStatus, string> = {
  scheduled: 'Agendado',
  in_progress: 'Em andamento',
  completed: 'Concluído',
  cancelled: 'Cancelado',
}

const statusClass: Record<JobStatus, string> = {
  scheduled: 'badge badge-warning',
  in_progress: 'badge badge-info',
  completed: 'badge badge-success',
  cancelled: 'badge badge-error badge-outline',
}

export function JobListPage() {
  const { load, filtered, cancel, loading, error, filters, setFilters } = useJobStore()
  const [cancelId, setCancelId] = useState<string | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    load()
  }, [load])

  async function handleCancel() {
    if (!cancelId) return
    await cancel(cancelId)
    setCancelId(null)
  }

  const jobs = filtered()
  const { paginated, page, totalPages, goTo } = usePagination(jobs, 10)

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Trabalhos</h1>
        <Link to="/jobs/new" className="btn btn-primary btn-sm" title="Novo trabalho">
          <Plus size={14} />
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <select
          className="select select-bordered select-sm"
          value={filters.status ?? ''}
          onChange={(e) => setFilters({ ...filters, status: (e.target.value as JobStatus) || undefined })}
        >
          <option value="">Todos os status</option>
          {(Object.keys(statusLabel) as JobStatus[]).map((s) => (
            <option key={s} value={s}>{statusLabel[s]}</option>
          ))}
        </select>

        <input
          type="date"
          className="input input-bordered input-sm"
          value={filters.date ?? ''}
          onChange={(e) => setFilters({ ...filters, date: e.target.value || undefined })}
        />
      </div>

      {loading && <div className="flex justify-center py-12"><span className="loading loading-spinner loading-lg" /></div>}
      {error && <div className="alert alert-error mb-4">{error}</div>}

      {!loading && jobs.length === 0 && (
        <div className="text-center text-base-content/50 py-16">Nenhum trabalho encontrado.</div>
      )}

      {!loading && jobs.length > 0 && (
        <>
        <div className="overflow-x-auto">
          <table className="table table-zebra w-full">
            <thead>
              <tr>
                <th>Data</th>
                <th>Funcionário</th>
                <th>Máquina</th>
                <th>Tipo</th>
                <th>Local</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((j) => (
                <tr
                  key={j.id}
                  className="hover cursor-pointer"
                  onClick={() => navigate(`/jobs/${j.id}`)}
                >
                  <td>{formatDate(j.scheduledDate)}</td>
                  <td>{j.employeeName ?? j.employeeId}</td>
                  <td>{j.machineName ?? j.machineId}</td>
                  <td>{j.jobType === 'maintenance' ? 'Manutenção' : 'Implementação'}</td>
                  <td>{j.city}/{j.state}</td>
                  <td><span className={statusClass[j.status]}>{statusLabel[j.status]}</span></td>
                  <td onClick={(e) => e.stopPropagation()} className="flex gap-2">
                    {j.status !== 'cancelled' && j.status !== 'completed' && (
                      <Link to={`/jobs/${j.id}/edit`} className="btn btn-ghost btn-xs" title="Editar">
                        <Pencil size={13} />
                      </Link>
                    )}
                    {j.status === 'scheduled' && (
                      <button className="btn btn-ghost btn-xs text-error" onClick={() => setCancelId(j.id)} title="Cancelar">
                        <Ban size={13} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination page={page} totalPages={totalPages} onGoTo={goTo} />
        </>
      )}

      {cancelId && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg">Confirmar cancelamento</h3>
            <p className="py-4">Tem certeza que deseja cancelar este trabalho?</p>
            <div className="modal-action">
              <button className="btn btn-ghost" onClick={() => setCancelId(null)}>Não</button>
              <button className="btn btn-error" onClick={handleCancel}>Cancelar trabalho</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
