import { useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useJobStore } from '@/viewmodels/job.viewmodel'
import type { JobStatus } from '@/models/job.model'
import { formatDate } from '@/utils/date'

const statusLabel: Record<JobStatus, string> = {
  scheduled: 'Agendado',
  pending: 'Pendente',
  in_progress: 'Em andamento',
  completed: 'Concluído',
  cancelled: 'Cancelado',
}

const statusClass: Record<JobStatus, string> = {
  scheduled: 'badge badge-warning',
  pending: 'badge badge-warning',
  in_progress: 'badge badge-info',
  completed: 'badge badge-success',
  cancelled: 'badge badge-error badge-outline',
}

export function EmployeeJobListPage() {
  const { load, filtered, loading, error, filters, setFilters } = useJobStore()
  const [searchParams] = useSearchParams()
  const statusParam = searchParams.get('status') as JobStatus | null

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    setFilters({ status: statusParam ?? undefined })
  }, [statusParam, setFilters])

  const jobs = filtered()

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Minhas OS</h1>

      <div className="flex flex-wrap gap-2 mb-6">
        <input
          type="text"
          placeholder="Buscar OS, máquina, cidade…"
          className="input input-bordered input-sm w-56"
          value={filters.search ?? ''}
          onChange={(e) => setFilters({ ...filters, search: e.target.value || undefined })}
        />
        <select
          className="select select-bordered select-sm"
          value={filters.jobType ?? ''}
          onChange={(e) => setFilters({ ...filters, jobType: e.target.value || undefined })}
        >
          <option value="">Todos os tipos</option>
          <option value="maintenance">Manutenção</option>
          <option value="implementation">Implementação</option>
        </select>
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
      </div>

      {loading && <div className="flex justify-center py-12"><span className="loading loading-spinner loading-lg" /></div>}
      {error && <div className="alert alert-error mb-4">{error}</div>}

      {!loading && jobs.length === 0 && (
        <div className="text-center text-base-content/50 py-16">Nenhuma OS encontrada.</div>
      )}

      {!loading && jobs.length > 0 && (
        <div className="flex flex-col gap-3">
          {jobs.map((j) => (
            <Link
              key={j.id}
              to={`/my-jobs/${j.id}`}
              className="card bg-base-200 hover:bg-base-300 transition-colors p-4 flex-row items-center justify-between"
            >
              <div className="flex flex-col gap-0.5">
                {j.osCode && <span className="text-xs font-mono text-base-content/40">{j.osCode}</span>}
                <p className="font-semibold">{j.machineName ?? j.machineId}</p>
                <p className="text-sm text-base-content/60">{formatDate(j.scheduledDate)} — {j.city}/{j.state}</p>
                <p className="text-xs text-base-content/50">
                  {j.jobType === 'maintenance' ? 'Manutenção' : 'Implementação'}
                </p>
              </div>
              <span className={statusClass[j.status] ?? 'badge badge-ghost'}>{statusLabel[j.status] ?? j.status}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
