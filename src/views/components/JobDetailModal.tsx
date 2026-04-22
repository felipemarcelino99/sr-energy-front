import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { X } from 'lucide-react'
import { pdf } from '@react-pdf/renderer'
import { JobReportView } from '@/views/components/JobReportView'
import { JobReportPdf } from '@/views/components/JobReportPdf'
import { fetchJob, fetchJobsByMachine } from '@/services/job.service'
import { fetchReport } from '@/services/job-report.service'
import type { JobDetail, Job } from '@/models/job.model'
import type { JobReport, PdfData } from '@/models/job-report.model'
import { JobReadOnlyView } from '@/views/components/JobReadOnlyView'
import { JobChecklistTab } from '@/views/components/JobChecklistTab'
import { formatDate } from '@/utils/date'

const STATUS_LABEL: Record<string, string> = {
  scheduled: 'Agendado',
  pending: 'Pendente',
  in_progress: 'Em andamento',
  completed: 'Concluído',
  cancelled: 'Cancelado',
}
const STATUS_CLASS: Record<string, string> = {
  scheduled: 'badge-warning',
  pending: 'badge-neutral',
  in_progress: 'badge-info',
  completed: 'badge-success',
  cancelled: 'badge-error',
}

type Tab = 'info' | 'report' | 'checklist' | 'history'

interface JobDetailModalProps {
  jobId: string
  onClose: () => void
}

export function JobDetailModal({ jobId, onClose }: JobDetailModalProps) {
  const navigate = useNavigate()
  const [job, setJob] = useState<JobDetail | null>(null)
  const [report, setReport] = useState<JobReport | null>(null)
  const [relatedJobs, setRelatedJobs] = useState<Job[]>([])
  const [tab, setTab] = useState<Tab>('info')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [generatingPdf, setGeneratingPdf] = useState(false)

  useEffect(() => {
    setLoading(true)
    setTab('info')
    Promise.all([
      fetchJob(jobId),
      fetchReport(jobId).catch(() => null),
    ])
      .then(([j, r]) => {
        const jobDetail = j as JobDetail
        setJob(jobDetail)
        setReport(r)
        fetchJobsByMachine(jobDetail.machineId)
          .then((jobs) => setRelatedJobs(jobs.filter((jj) => jj.id !== jobId)))
          .catch(() => {})
      })
      .catch((err) => setError((err as Error).message))
      .finally(() => setLoading(false))
  }, [jobId])

  async function handleGeneratePdf(data: PdfData) {
    setGeneratingPdf(true)
    try {
      const blob = await pdf(<JobReportPdf data={data} />).toBlob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `relatorio-${data.jobId.slice(0, 8)}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } finally {
      setGeneratingPdf(false)
    }
  }

  return (
    <div className="modal modal-open" onClick={onClose}>
      <div
        className="modal-box max-w-3xl w-full max-h-[90vh] overflow-y-auto p-0"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-base-300 sticky top-0 bg-base-200 z-10">
          <div>
            <h2 className="text-lg font-bold tracking-tight">Detalhes da OS</h2>
            {job?.osCode && <span className="badge badge-outline font-mono text-xs mt-1">{job.osCode}</span>}
          </div>
          <div className="flex items-center gap-3">
            {job && job.status !== 'cancelled' && job.status !== 'completed' && (
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => { onClose(); navigate(`/jobs/${jobId}/edit`) }}
              >
                Editar
              </button>
            )}
            <button className="btn btn-ghost btn-sm btn-circle" onClick={onClose} aria-label="Fechar">
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6">
          {loading && (
            <div className="flex justify-center py-16">
              <span className="loading loading-spinner loading-lg" />
            </div>
          )}
          {error && <div className="alert alert-error">{error}</div>}

          {!loading && job && (
            <>
              {job.clientName && (
                <p className="text-sm text-base-content/50 mb-4">{job.clientName}</p>
              )}

              <div role="tablist" className="tabs tabs-bordered mb-6">
                <button role="tab" className={`tab ${tab === 'info' ? 'tab-active' : ''}`} onClick={() => setTab('info')}>Informações</button>
                <button role="tab" className={`tab ${tab === 'checklist' ? 'tab-active' : ''}`} onClick={() => setTab('checklist')}>Checklist</button>
                {relatedJobs.length > 0 && (
                  <button role="tab" className={`tab ${tab === 'history' ? 'tab-active' : ''}`} onClick={() => setTab('history')}>Histórico</button>
                )}
                {report && (
                  <button role="tab" className={`tab ${tab === 'report' ? 'tab-active' : ''}`} onClick={() => setTab('report')}>Finalizado</button>
                )}
              </div>

              {tab === 'info' && <JobReadOnlyView job={job} />}
              {tab === 'checklist' && <JobChecklistTab jobId={jobId} />}
              {tab === 'history' && (
                <div className="overflow-x-auto">
                  <table className="table table-sm">
                    <thead>
                      <tr className="text-xs text-base-content/40 uppercase tracking-wider">
                        <th>ID</th><th>Data</th><th>Funcionário</th><th>Tipo</th><th>Status</th><th>Descrição</th>
                      </tr>
                    </thead>
                    <tbody>
                      {relatedJobs.map((r) => (
                        <tr key={r.id} className="hover cursor-pointer" onClick={() => { onClose(); navigate(`/jobs/${r.id}`) }}>
                          <td className="num text-xs text-base-content/50">{r.osCode ?? '—'}</td>
                          <td className="text-base-content/60">{formatDate(r.scheduledDate)}</td>
                          <td>{r.employeeName}</td>
                          <td><span className={`badge badge-sm ${r.jobType === 'maintenance' ? 'badge-warning' : 'badge-info'}`}>{r.jobType === 'maintenance' ? 'Manutenção' : 'Implementação'}</span></td>
                          <td><span className={`badge badge-sm ${STATUS_CLASS[r.status] ?? 'badge-ghost'}`}>{STATUS_LABEL[r.status] ?? r.status}</span></td>
                          <td className="truncate max-w-48 text-base-content/70">{r.description}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {generatingPdf && (
                <div className="flex items-center gap-2 mb-4 text-sm text-base-content/60">
                  <span className="loading loading-spinner loading-sm" /> Gerando PDF…
                </div>
              )}

              {tab === 'report' && report && (
                <JobReportView
                  jobId={jobId}
                  report={report}
                  jobMeta={{
                    scheduledDate: job.scheduledDate,
                    employeeName: job.employeeName ?? job.employeeId,
                    machineName: job.machineName ?? job.machineId,
                    city: job.city,
                    state: job.state,
                    jobType: job.jobType,
                  }}
                  onGeneratePdf={handleGeneratePdf}
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
