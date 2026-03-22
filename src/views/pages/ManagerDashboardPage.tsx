import { useEffect } from 'react'
import { AlertTriangle, Clock } from 'lucide-react'
import { useDashboardStore } from '@/viewmodels/dashboard.viewmodel'
import { JobStatusCard } from '@/views/components/JobStatusCard'
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

function todayLabel(): string {
  return new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
}

export function ManagerDashboardPage() {
  const {
    loading,
    error,
    loadDashboard,
    jobStatusSummary,
    contractsExpiringSoon,
    jobs,
  } = useDashboardStore()

  useEffect(() => {
    loadDashboard()
  }, [loadDashboard])

  if (loading) {
    return (
      <div className="flex flex-col gap-4 animate-pulse">
        <div className="h-10 w-48 bg-base-300 rounded-lg" />
        {[...Array(2)].map((_, i) => (
          <div key={i} className="h-36 bg-base-300 rounded-xl" />
        ))}
        <div className="h-64 bg-base-300 rounded-xl" />
      </div>
    )
  }

  if (error) {
    return <div role="alert" className="alert alert-error">{error}</div>
  }

  const statusSummary = jobStatusSummary()
  const expiring = contractsExpiringSoon()

  return (
    <div className="flex flex-col gap-6">
      {/* Page header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-base-content/40 mt-0.5 capitalize">{todayLabel()}</p>
        </div>
      </div>

      {/* KPI row */}
      <JobStatusCard summary={statusSummary} />

      {/* Expiring contracts alert */}
      {expiring.length > 0 && (
        <div className="card bg-warning/5 border border-warning/30">
          <div className="card-body gap-3">
            <h2 className="text-xs font-semibold text-warning uppercase tracking-wider flex items-center gap-2">
              <AlertTriangle size={13} />
              Contratos próximos ao vencimento
            </h2>
            <ul className="divide-y divide-base-300">
              {expiring.map((c) => (
                <li key={c.id} className="py-2 flex justify-between items-center gap-4">
                  <span className="text-sm text-base-content">{c.clientName}</span>
                  <span className="badge badge-warning badge-sm shrink-0 gap-1">
                    <Clock size={9} />
                    {c.daysUntilExpiry}d — {formatDate(c.expiresAt)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Recent jobs */}
      <div className="card bg-base-200 border border-base-300">
        <div className="card-body gap-4">
          <h2 className="text-xs font-semibold text-base-content/40 uppercase tracking-wider">
            Trabalhos Recentes
          </h2>

          {jobs.length === 0 ? (
            <p className="text-sm text-base-content/30 py-6 text-center">
              Nenhum trabalho encontrado
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="table table-sm">
                <thead>
                  <tr className="border-base-300 text-xs text-base-content/40 uppercase tracking-wider">
                    <th className="font-semibold">Título</th>
                    <th className="font-semibold">Funcionário</th>
                    <th className="font-semibold">Data</th>
                    <th className="font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {jobs.slice(0, 10).map((job) => (
                    <tr key={job.id} className="border-base-300 hover:bg-base-300/30 transition-colors">
                      <td className="font-medium text-base-content">{job.title}</td>
                      <td className="text-base-content/60">{job.employeeName}</td>
                      <td className="text-base-content/60 num">{formatDate(job.scheduledAt)}</td>
                      <td>
                        <span className={`badge badge-sm ${STATUS_CLASS[job.status] ?? 'badge-ghost'}`}>
                          {STATUS_LABEL[job.status] ?? job.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
