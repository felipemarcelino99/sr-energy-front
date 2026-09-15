import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePageHeader } from '@/hooks/usePageHeader'
import { useAuth } from '@/viewmodels/auth.context'
import { useEmployeeDashboardStore } from '@/viewmodels/employee.dashboard.viewmodel'
import { JobStatusCard } from '@/views/components/JobStatusCard'
import { NextJobWidget } from '@/views/components/NextJobWidget'
import { ScheduleWidget } from '@/views/components/ScheduleWidget'
import { DashboardSkeleton } from '@/views/components/ui/Skeleton'

function todayLabel(): string {
  return new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
}

export function EmployeeDashboardPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { loading, error, loadMyJobs, myJobsByStatus, nextJob } = useEmployeeDashboardStore()

  useEffect(() => {
    if (user?.employeeId) loadMyJobs(user.employeeId)
  }, [user?.employeeId, loadMyJobs])

  usePageHeader('Meu Dashboard', { subtitle: todayLabel() })

  if (loading) {
    return <DashboardSkeleton statusCards={1} />
  }

  if (error) {
    return (
      <div role="alert" className="alert alert-error">
        {error}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Job status summary */}
      <JobStatusCard
        summary={myJobsByStatus()}
        onStatusClick={(status) => navigate(`/my-jobs?status=${status}`)}
      />

      {/* Next job */}
      <div className="card bg-base-200 border border-base-300">
        <div className="card-body gap-4">
          <h2 className="text-xs font-semibold text-base-content/40 uppercase tracking-wider">
            Próxima OS
          </h2>
          <NextJobWidget job={nextJob()} />
        </div>
      </div>

      {/* Schedule calendar — read-only, filtered by this employee */}
      <ScheduleWidget readOnly employeeId={user?.employeeId} />
    </div>
  )
}
