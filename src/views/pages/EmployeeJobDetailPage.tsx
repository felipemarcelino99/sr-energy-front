import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { JobDetailView } from '@/views/components/JobDetailView'
import { JobChecklistTab } from '@/views/components/JobChecklistTab'
import { RichTextEditor } from '@/views/components/RichTextEditor'
import { fetchJob } from '@/services/job.service'
import { fetchReport } from '@/services/job-report.service'
import { useJobReportStore } from '@/viewmodels/job-report.viewmodel'
import type { JobDetail } from '@/models/job.model'
import type { JobReport } from '@/models/job-report.model'
import { formatDate } from '@/utils/date'

type Tab = 'info' | 'checklist' | 'report'

export function EmployeeJobDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { update, loading: saving, error: saveError } = useJobReportStore()

  const [job, setJob] = useState<JobDetail | null>(null)
  const [report, setReport] = useState<JobReport | null>(null)
  const [tab, setTab] = useState<Tab>('info')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [editContent, setEditContent] = useState('')
  const [saveSuccess, setSaveSuccess] = useState(false)

  useEffect(() => {
    if (!id) return
    Promise.all([
      fetchJob(id),
      fetchReport(id).catch(() => null),
    ])
      .then(([j, r]) => {
        setJob(j as JobDetail)
        setReport(r)
        if (r) setEditContent(r.content)
      })
      .catch((err) => setError((err as Error).message))
      .finally(() => setLoading(false))
  }, [id])

  async function handleSaveReport() {
    if (!id) return
    await update(id, editContent)
    setSaveSuccess(true)
    setTimeout(() => setSaveSuccess(false), 3000)
  }

  if (loading) return <div className="flex justify-center py-16"><span className="loading loading-spinner loading-lg" /></div>
  if (error) return <div className="p-6 alert alert-error">{error}</div>
  if (!job) return <div className="p-6 text-base-content/50">Trabalho não encontrado.</div>

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-4">
        <button className="btn btn-ghost btn-sm btn-circle" onClick={() => navigate('/my-jobs')}>
          <ArrowLeft size={16} />
        </button>
        <h1 className="text-xl font-bold tracking-tight">Detalhes do Trabalho</h1>
      </div>

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

      {tab === 'info' && <JobDetailView job={job} />}
      {tab === 'checklist' && <JobChecklistTab jobId={id!} />}

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
