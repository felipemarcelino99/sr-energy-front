import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Plus, Pencil, Ban } from 'lucide-react'
import { useJobStore } from '@/viewmodels/job.viewmodel'
import { usePagination } from '@/utils/usePagination'
import { Pagination } from '@/views/components/Pagination'
import type { JobStatus } from '@/models/job.model'
import { formatDate } from '@/utils/date'

const statusLabel: Record<JobStatus, string> = {
  pending: 'Pendente',
  scheduled: 'Agendado',
  in_progress: 'Em andamento',
  completed: 'Concluído',
  cancelled: 'Cancelado',
}

const statusClass: Record<JobStatus, string> = {
  pending: 'badge badge-neutral',
  scheduled: 'badge badge-warning',
  in_progress: 'badge badge-info',
  completed: 'badge badge-success',
  cancelled: 'badge badge-error badge-outline',
}

export function JobListPage() {
  const { load, filtered, cancel, loading, error, filters, setFilters } = useJobStore()
  const [cancelId, setCancelId] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [searchParams] = useSearchParams()

  useEffect(() => {
    const statusParam = searchParams.get('status') as JobStatus | null
    if (statusParam) {
      setFilters({ ...filters, status: statusParam })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // mount only

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
        <h1 className="text-2xl font-bold">Ordens de Serviço</h1>
        <Link to="/jobs/new" className="btn btn-primary btn-sm gap-1">
          <Plus size={14} /> Nova OS
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        <input
          type="text"
          placeholder="Buscar funcionário, máquina, cidade, OS…"
          className="input input-bordered input-sm w-64"
          value={filters.search ?? ''}
          onChange={(e) => setFilters({ ...filters, search: e.target.value || undefined })}
        />
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
        <select
          className="select select-bordered select-sm"
          value={filters.jobType ?? ''}
          onChange={(e) => setFilters({ ...filters, jobType: e.target.value || undefined })}
        >
          <option value="">Todos os tipos</option>
          <option value="maintenance">Manutenção</option>
          <option value="implementation">Implementação</option>
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
        <div className="text-center text-base-content/50 py-16">Nenhuma OS encontrada.</div>
      )}

      {!loading && jobs.length > 0 && (
        <>
        <div className="overflow-x-auto">
          <table className="table table-zebra w-full">
            <thead>
              <tr>
                <th>ID</th>
                <th>Data</th>
                <th>Funcionário</th>
                <th>Máquina</th>
                <th>Tipo</th>
                <th>Local</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((j) => (
                <>
                  <tr
                    key={j.id}
                    className="hover cursor-pointer"
                    onClick={() => setExpandedId(expandedId === j.id ? null : j.id)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && setExpandedId(expandedId === j.id ? null : j.id)}
                  >
                    <td className="num text-xs text-base-content/50">{j.osCode ?? '—'}</td>
                    <td>{formatDate(j.scheduledDate)}</td>
                    <td>{j.employeeName ?? j.employeeId}</td>
                    <td>{j.machineName ?? j.machineId}</td>
                    <td>{j.jobType === 'maintenance' ? 'Manutenção' : 'Implementação'}</td>
                    <td>{j.city}/{j.state}</td>
                    <td><span className={statusClass[j.status]}>{statusLabel[j.status]}</span></td>
                  </tr>
                  {expandedId === j.id && (
                    <tr key={`preview-${j.id}`}>
                      <td colSpan={6} className="bg-base-200 px-4 py-3">
                        <div data-testid={`job-preview-${j.id}`} className="flex flex-col gap-1 text-sm">
                          <p><span className="font-medium">Descrição:</span> {j.description}</p>
                          <p><span className="font-medium">Local:</span> {j.city}/{j.state}</p>
                          <p><span className="font-medium">Horário:</span> {j.startTime} – {j.endTime}</p>
                          <p><span className="font-medium">Hospedagem:</span> {j.accommodation ? 'Sim' : 'Não'} · <span className="font-medium">Carro:</span> {j.car ? 'Sim' : 'Não'}</p>
                          <div className="mt-2 flex gap-2">
                            <Link to={`/jobs/${j.id}`} className="btn btn-xs btn-primary">Ver detalhes</Link>
                            {j.status !== 'cancelled' && j.status !== 'completed' && (
                              <Link to={`/jobs/${j.id}/edit`} className="btn btn-xs btn-ghost" onClick={(e) => e.stopPropagation()}>
                                <Pencil size={11} /> Editar
                              </Link>
                            )}
                            {j.status === 'scheduled' && (
                              <button className="btn btn-xs btn-ghost text-error" onClick={(e) => { e.stopPropagation(); setCancelId(j.id) }}>
                                <Ban size={11} /> Cancelar
                              </button>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
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
            <p className="py-4">Tem certeza que deseja cancelar esta OS?</p>
            <div className="modal-action">
              <button className="btn btn-ghost" onClick={() => setCancelId(null)}>Não</button>
              <button className="btn btn-error" onClick={handleCancel}>Cancelar OS</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
