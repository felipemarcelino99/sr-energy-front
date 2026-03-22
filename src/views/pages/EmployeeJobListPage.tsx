import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useJobStore } from '@/viewmodels/job.viewmodel'
import { useAuth } from '@/viewmodels/auth.context'
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

export function EmployeeJobListPage() {
  const { user } = useAuth()
  const { load, filtered, loading, error, setFilters } = useJobStore()

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    const id = user?.employeeId ?? user?.id
    if (id) setFilters({ employeeId: id })
  }, [user?.employeeId, user?.id, setFilters])

  const jobs = filtered()

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Meus Trabalhos</h1>

      {loading && <div className="flex justify-center py-12"><span className="loading loading-spinner loading-lg" /></div>}
      {error && <div className="alert alert-error mb-4">{error}</div>}

      {!loading && jobs.length === 0 && (
        <div className="text-center text-base-content/50 py-16">Nenhum trabalho encontrado.</div>
      )}

      {!loading && jobs.length > 0 && (
        <div className="flex flex-col gap-3">
          {jobs.map((j) => (
            <Link
              key={j.id}
              to={`/my-jobs/${j.id}`}
              className="card bg-base-200 hover:bg-base-300 transition-colors p-4 flex-row items-center justify-between"
            >
              <div>
                <p className="font-semibold">{j.machineName ?? j.machineId}</p>
                <p className="text-sm text-base-content/60">{formatDate(j.scheduledDate)} — {j.city}/{j.state}</p>
                <p className="text-xs text-base-content/50">
                  {j.jobType === 'maintenance' ? 'Manutenção' : 'Implementação'}
                </p>
              </div>
              <span className={statusClass[j.status]}>{statusLabel[j.status]}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
