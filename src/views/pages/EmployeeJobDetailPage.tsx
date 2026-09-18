import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { usePageHeader } from '@/hooks/usePageHeader'
import { JobDetailView } from '@/views/components/JobDetailView'
import { JobChecklistTab } from '@/views/components/JobChecklistTab'
import { RichTextEditor } from '@/views/components/RichTextEditor'
import { fetchJob } from '@/services/job.service'
import { fetchMachineJobs } from '@/services/machine.service'
import { fetchReport } from '@/services/job-report.service'
import type { MachineJob } from '@/models/machine.model'
import { useJobReportStore } from '@/viewmodels/job-report.viewmodel'
import type { JobDetail } from '@/models/job.model'
import { JOB_STATUS_LABEL, JOB_STATUS_BADGE_CLASS, jobTypeLabel } from '@/models/job.model'
import type { JobReport } from '@/models/job-report.model'
import { formatDate } from '@/utils/date'

type Tab = 'info' | 'checklist' | 'history' | 'report'

export function EmployeeJobDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { update, loading: saving, error: saveError } = useJobReportStore()

  const [job, setJob] = useState<JobDetail | null>(null)
  const [report, setReport] = useState<JobReport | null>(null)
  const [machineJobs, setMachineJobs] = useState<MachineJob[]>([])
  const [tab, setTab] = useState<Tab>('info')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [editContent, setEditContent] = useState('')
  const [saveSuccess, setSaveSuccess] = useState(false)

  useEffect(() => {
    if (!id) return
    Promise.all([fetchJob(id), fetchReport(id).catch(() => null)])
      .then(([j, r]) => {
        const jobDetail = j as JobDetail
        setJob(jobDetail)
        setReport(r)
        if (r) setEditContent(r.content)
        fetchMachineJobs(jobDetail.machineId)
          .then((jobs) => setMachineJobs(jobs.filter((j) => j.id !== id)))
          .catch(() => {})
      })
      .catch((err) => setError((err as Error).message))
      .finally(() => setLoading(false))
  }, [id])

  // Job vive em estado local (fora do TanStack Query) nesta página — após
  // "Iniciar OS" via `JobDetailView`, recarrega o job pra refletir o novo
  // status sem precisar de reload manual (sub-plano 04, item 5).
  function handleJobStarted() {
    if (!id) return
    fetchJob(id).then((j) => setJob(j as JobDetail))
  }

  async function handleSaveReport() {
    if (!id) return
    await update(id, editContent)
    setSaveSuccess(true)
    setTimeout(() => setSaveSuccess(false), 3000)
  }

  usePageHeader('Detalhes da OS', {
    subtitle: job?.number,
    onBack: () => navigate('/my-jobs'),
  })

  if (loading)
    return (
      <div className="flex justify-center py-16">
        <span className="loading loading-spinner loading-lg" />
      </div>
    )
  if (error) return <div className="p-6 alert alert-error">{error}</div>
  if (!job) return <div className="p-6 text-base-content/50">OS não encontrada.</div>

  return (
    <div className="p-6 max-w-2xl mx-auto">
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
        {machineJobs.length > 0 && (
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
            Relatório
          </button>
        )}
      </div>

      {tab === 'info' && <JobDetailView job={job} onStarted={handleJobStarted} />}
      {tab === 'checklist' && <JobChecklistTab jobId={id!} />}
      {tab === 'history' && (
        <div className="overflow-x-auto">
          <table className="table table-sm">
            <thead>
              <tr className="text-xs text-base-content/40 uppercase tracking-wider">
                <th>Data</th>
                <th>Funcionário</th>
                <th>Tipo</th>
                <th>Status</th>
                <th>Local</th>
              </tr>
            </thead>
            <tbody>
              {machineJobs.map((r) => (
                <tr key={r.id} className="hover:bg-base-300/30">
                  <td className="num text-base-content/60">{formatDate(r.scheduledDate)}</td>
                  <td>{r.employeeName}</td>
                  <td>
                    <span className="badge badge-sm badge-info">{jobTypeLabel(r.jobType)}</span>
                  </td>
                  <td>
                    <span
                      className={`badge badge-sm ${JOB_STATUS_BADGE_CLASS[r.status as keyof typeof JOB_STATUS_BADGE_CLASS] ?? 'badge-ghost'}`}
                    >
                      {JOB_STATUS_LABEL[r.status as keyof typeof JOB_STATUS_LABEL] ?? r.status}
                    </span>
                  </td>
                  <td className="text-base-content/60">
                    {r.city}/{r.state}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'report' && report && (
        <div className="flex flex-col gap-4">
          <p className="text-xs text-base-content/40">
            Enviado em {formatDate(report.submittedAt)}
          </p>

          <RichTextEditor content={editContent} onChange={setEditContent} />

          {saveError && <div className="alert alert-error text-sm">{saveError}</div>}

          {saveSuccess && (
            <div className="alert alert-success text-sm">Relatório atualizado com sucesso.</div>
          )}

          <button
            type="button"
            className="btn btn-primary"
            onClick={handleSaveReport}
            disabled={saving}
          >
            {saving ? <span className="loading loading-spinner loading-sm" /> : 'Salvar Alterações'}
          </button>
        </div>
      )}
    </div>
  )
}
