import { useEffect } from 'react'
import { useAuth } from '@/viewmodels/auth.context'
import { useEmployeeDashboardStore } from '@/viewmodels/employee.dashboard.viewmodel'
import { JobStatusCard } from '@/views/components/JobStatusCard'
import { NextJobWidget } from '@/views/components/NextJobWidget'

function todayLabel(): string {
  return new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
}

export function EmployeeDashboardPage() {
  const { user } = useAuth()
  const { loading, error, loadMyJobs, myJobsByStatus, nextJob } = useEmployeeDashboardStore()

  useEffect(() => {
    const id = user?.employeeId ?? user?.id
    if (id) loadMyJobs(id)
  }, [user?.employeeId, user?.id, loadMyJobs])

  if (loading) {
    return (
      <div className="flex flex-col gap-4 animate-pulse">
        <div className="h-10 w-48 bg-base-300 rounded-lg" />
        <div className="h-36 bg-base-300 rounded-xl" />
        <div className="h-36 bg-base-300 rounded-xl" />
      </div>
    )
  }

  if (error) {
    return <div role="alert" className="alert alert-error">{error}</div>
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Page header */}
      <div>
        <h1 className="text-xl font-bold tracking-tight">Meu Dashboard</h1>
        <p className="text-sm text-base-content/40 mt-0.5 capitalize">{todayLabel()}</p>
      </div>

      {/* Job status summary */}
      <JobStatusCard summary={myJobsByStatus()} />

      {/* Next job */}
      <div className="card bg-base-200 border border-base-300">
        <div className="card-body gap-4">
          <h2 className="text-xs font-semibold text-base-content/40 uppercase tracking-wider">
            Próximo Trabalho
          </h2>
          <NextJobWidget job={nextJob()} />
        </div>
      </div>

      {/* Notifications placeholder */}
      <div className="card bg-base-200 border border-base-300">
        <div className="card-body gap-4">
          <h2 className="text-xs font-semibold text-base-content/40 uppercase tracking-wider">
            Últimas Notificações
          </h2>
          <p className="text-sm text-base-content/30 py-4 text-center">
            Nenhuma notificação
          </p>
        </div>
      </div>
    </div>
  )
}
