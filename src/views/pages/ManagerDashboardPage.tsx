import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDashboardStore } from '@/viewmodels/dashboard.viewmodel'
import { usePageHeader } from '@/hooks/usePageHeader'
import { JobStatusCard } from '@/views/components/JobStatusCard'
import { ContractStatusCard } from '@/views/components/ContractStatusCard'
import { BagCertificateStatusCard } from '@/views/components/BagCertificateStatusCard'
import { ScheduleWidget } from '@/views/components/ScheduleWidget'
import { formatDate } from '@/utils/date'
import { JOB_STATUS_LABEL, JOB_STATUS_BADGE_CLASS } from '@/models/job.model'
import { DashboardSkeleton } from '@/views/components/ui/Skeleton'

function todayLabel(): string {
  return new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
}

type DashboardTab = 'calendario' | 'os'

export function ManagerDashboardPage() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<DashboardTab>('calendario')
  const {
    loading,
    error,
    jobStatusSummary,
    contractStatusSummary,
    bagCertificateStatusSummary,
    jobs,
  } = useDashboardStore()

  usePageHeader('Dashboard', { subtitle: todayLabel() })

  if (loading) {
    return <DashboardSkeleton cards={2} />
  }

  if (error) {
    return (
      <div role="alert" className="alert alert-error">
        {error}
      </div>
    )
  }

  const statusSummary = jobStatusSummary()
  const contractSummary = contractStatusSummary()
  const bagCertSummary = bagCertificateStatusSummary()

  return (
    <div className="flex flex-col h-full gap-4">
      {/* Status blocks — compact, side by side */}
      <div className="flex gap-4">
        <div className="flex-1 min-w-0">
          <ContractStatusCard
            summary={contractSummary}
            onStatusClick={(status) => navigate(`/contracts?status=${status}`)}
            compact
          />
        </div>
        <div className="flex-1 min-w-0">
          <JobStatusCard
            summary={statusSummary}
            onStatusClick={(status) => navigate(`/jobs?status=${status}`)}
            compact
          />
        </div>
        <div className="flex-1 min-w-0">
          <BagCertificateStatusCard
            summary={bagCertSummary}
            onStatusClick={(status) => navigate(`/bags?cert_status=${status}`)}
            compact
          />
        </div>
      </div>

      {/* Panel with tabs — Calendário / OS Recentes */}
      <div className="card bg-base-200 border border-base-300 flex-1 min-h-0 flex flex-col">
        <div className="card-body gap-4 flex-1 min-h-0 flex flex-col">
          <div role="tablist" className="flex gap-1 border-b border-base-300 w-fit">
            {(['calendario', 'os'] as const).map((tabKey) => (
              <button
                key={tabKey}
                type="button"
                role="tab"
                aria-selected={activeTab === tabKey}
                onClick={() => setActiveTab(tabKey)}
                className="relative px-3 pb-2 text-sm font-semibold transition-colors cursor-pointer"
                style={{
                  color: activeTab === tabKey ? 'var(--color-primary)' : 'var(--color-text-muted)',
                }}
              >
                {tabKey === 'calendario' ? 'Calendário' : 'OS Recentes'}
                {activeTab === tabKey && (
                  <span
                    style={{
                      position: 'absolute',
                      left: 0,
                      right: 0,
                      bottom: -1,
                      height: 2,
                      borderRadius: 2,
                      background: 'var(--color-primary)',
                    }}
                  />
                )}
              </button>
            ))}
          </div>

          <div className={`flex-1 min-h-0 ${activeTab === 'calendario' ? '' : 'overflow-auto'}`}>
            {activeTab === 'calendario' ? (
              <ScheduleWidget />
            ) : jobs.length === 0 ? (
              <p className="text-sm text-base-content/30 py-6 text-center">Nenhuma OS encontrada</p>
            ) : (
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
                    <tr
                      key={job.id}
                      className="border-base-300 hover:bg-base-300/30 transition-colors cursor-pointer"
                      onClick={() => navigate(`/jobs/${job.id}`)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => e.key === 'Enter' && navigate(`/jobs/${job.id}`)}
                    >
                      <td className="font-medium text-base-content">{job.title}</td>
                      <td className="text-base-content/60">{job.employeeName}</td>
                      <td className="text-base-content/60 num">{formatDate(job.scheduledAt)}</td>
                      <td>
                        <span
                          className={`badge badge-sm ${JOB_STATUS_BADGE_CLASS[job.status] ?? 'badge-ghost'}`}
                        >
                          {JOB_STATUS_LABEL[job.status] ?? job.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
