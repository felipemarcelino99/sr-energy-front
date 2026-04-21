import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { pdf } from '@react-pdf/renderer'
import { JobReportView } from '@/views/components/JobReportView'
import { JobReportPdf } from '@/views/components/JobReportPdf'
import { fetchJob } from '@/services/job.service'
import { fetchReport } from '@/services/job-report.service'
import type { JobDetail } from '@/models/job.model'
import type { JobReport, PdfData } from '@/models/job-report.model'
import { JobReadOnlyView } from '@/views/components/JobReadOnlyView'
import { JobChecklistTab } from '@/views/components/JobChecklistTab'
import { fetchJobsByMachine } from '@/services/job.service'
import type { Job } from '@/models/job.model'
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

export function ManagerJobDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [job, setJob] = useState<JobDetail | null>(null)
  const [report, setReport] = useState<JobReport | null>(null)
  const [relatedJobs, setRelatedJobs] = useState<Job[]>([])
  const [tab, setTab] = useState<Tab>('info')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [generatingPdf, setGeneratingPdf] = useState(false)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    Promise.all([
      fetchJob(id),
      fetchReport(id).catch(() => null),
    ])
      .then(([j, r]) => {
        const jobDetail = j as JobDetail
        setJob(jobDetail)
        setReport(r)
        fetchJobsByMachine(jobDetail.machineId)
          .then((jobs) => setRelatedJobs(jobs.filter((j) => j.id !== id)))
          .catch(() => {})
      })
      .catch((err) => setError((err as Error).message))
      .finally(() => setLoading(false))
  }, [id])

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

  if (loading) return <div className="flex justify-center py-16"><span className="loading loading-spinner loading-lg" /></div>
  if (error) return <div className="p-6 alert alert-error">{error}</div>
  if (!job) return <div className="p-6 text-base-content/50">OS não encontrada.</div>

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-4">
        <button className="btn btn-ghost btn-sm btn-circle" onClick={() => navigate('/jobs')}>
          <ArrowLeft size={16} />
        </button>
        <div>
          <h1 className="text-xl font-bold tracking-tight">Detalhes da OS</h1>
          {job.osCode && <span className="badge badge-outline font-mono mt-1">{job.osCode}</span>}
        </div>
        {job.clientName && <span className="ml-auto text-sm text-base-content/60">{job.clientName}</span>}
      </div>

      {/* Tab switcher */}
      <div role="tablist" className="tabs tabs-boxed mb-6">
        <button
          role="tab"
          className={`tab ${tab === 'info' ? 'tab-active' : ''}`}
          onClick={() => setTab('info')}
        >
          Informações
        </button>
        <button
          role="tab"
          className={`tab ${tab === 'checklist' ? 'tab-active' : ''}`}
          onClick={() => setTab('checklist')}
        >
          Checklist
        </button>
        {relatedJobs.length > 0 && (
          <button
            role="tab"
            className={`tab ${tab === 'history' ? 'tab-active' : ''}`}
            onClick={() => setTab('history')}
          >
            Histórico
          </button>
        )}
        {report && (
          <button
            role="tab"
            className={`tab ${tab === 'report' ? 'tab-active' : ''}`}
            onClick={() => setTab('report')}
          >
            Finalizado
          </button>
        )}
      </div>

      {tab === 'info' && <JobReadOnlyView job={job} />}
      {tab === 'checklist' && <JobChecklistTab jobId={id!} />}
      {tab === 'history' && (
        <div className="overflow-x-auto">
          <table className="table table-sm">
            <thead>
              <tr className="text-xs text-base-content/40 uppercase tracking-wider">
                <th>ID</th>
                <th>Data</th>
                <th>Funcionário</th>
                <th>Tipo</th>
                <th>Status</th>
                <th>Descrição</th>
              </tr>
            </thead>
            <tbody>
              {relatedJobs.map((r) => (
                <tr key={r.id} className="hover cursor-pointer" onClick={() => navigate(`/jobs/${r.id}`)}>
                  <td className="num text-xs text-base-content/50">{r.osCode ?? '—'}</td>
                  <td className="text-base-content/60">{formatDate(r.scheduledDate)}</td>
                  <td>{r.employeeName}</td>
                  <td>
                    <span className={`badge badge-sm ${r.jobType === 'maintenance' ? 'badge-warning' : 'badge-info'}`}>
                      {r.jobType === 'maintenance' ? 'Manutenção' : 'Implementação'}
                    </span>
                  </td>
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
          <span className="loading loading-spinner loading-sm" />
          Gerando PDF…
        </div>
      )}

      {tab === 'report' && report && (
        <JobReportView
          jobId={id!}
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
    </div>
  )
}
