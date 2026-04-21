import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, MapPin, Calendar, Wrench, User } from 'lucide-react'
import { RichTextEditor } from '@/views/components/RichTextEditor'
import { EvidenceUpload } from '@/views/components/EvidenceUpload'
import { useJobReportStore } from '@/viewmodels/job-report.viewmodel'
import { fetchJob } from '@/services/job.service'
import type { JobDetail } from '@/models/job.model'
import { formatDate } from '@/utils/date'

const JOB_TYPE_LABEL: Record<string, string> = {
  maintenance: 'Manutenção',
  implementation: 'Implementação',
}

export function JobFinalizationPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { submit, loading, error, submitted } = useJobReportStore()

  const [job, setJob] = useState<JobDetail | null>(null)
  const [content, setContent] = useState('')
  const [evidenceFiles, setEvidenceFiles] = useState<File[]>([])
  const [validationError, setValidationError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    fetchJob(id).then((j) => setJob(j as JobDetail)).catch(() => null)
  }, [id])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!content.trim() || content === '<p></p>') {
      setValidationError('O relatório não pode estar vazio.')
      return
    }
    setValidationError(null)
    if (id) await submit(id, content, evidenceFiles)
  }

  if (submitted) {
    return (
      <div className="p-6 max-w-lg mx-auto text-center">
        <div className="text-5xl mb-4">✅</div>
        <h2 className="text-2xl font-bold mb-2">OS finalizada!</h2>
        <p className="text-base-content/60 mb-6">O relatório foi enviado com sucesso.</p>
        <button className="btn btn-primary" onClick={() => navigate('/my-jobs')}>
          Voltar para minhas OS
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-0 min-h-screen">
      {/* Sticky header with job info */}
      <div className="sticky top-0 z-10 bg-base-100 border-b border-base-300 shadow-sm">
        <div className="p-4 flex items-center gap-3">
          <button
            className="btn btn-ghost btn-sm btn-circle shrink-0"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft size={16} />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-base font-bold tracking-tight truncate">
              {job ? (job.machineName ?? 'Finalizar OS') : 'Finalizar OS'}
            </h1>
            {job && (
              <p className="text-xs text-base-content/50 truncate">{job.description}</p>
            )}
          </div>
        </div>

        {job && (
          <div className="px-4 pb-3 flex flex-wrap gap-x-5 gap-y-1.5">
            <span className="flex items-center gap-1.5 text-xs text-base-content/60">
              <MapPin size={11} className="shrink-0" />
              {job.city}/{job.state}
            </span>
            <span className="flex items-center gap-1.5 text-xs text-base-content/60">
              <Calendar size={11} className="shrink-0" />
              {formatDate(job.scheduledDate)}
            </span>
            <span className="flex items-center gap-1.5 text-xs text-base-content/60">
              <Wrench size={11} className="shrink-0" />
              {JOB_TYPE_LABEL[job.jobType] ?? job.jobType}
            </span>
            <span className="flex items-center gap-1.5 text-xs text-base-content/60">
              <User size={11} className="shrink-0" />
              {job.employeeName}
            </span>
          </div>
        )}
      </div>

      {/* Form */}
      <div className="p-4 md:p-6 flex-1">
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div>
            <label className="label text-sm font-medium text-base-content/70 mb-2 block">
              Relatório da OS
            </label>
            <RichTextEditor content={content} onChange={setContent} />
            {validationError && (
              <p className="text-error text-xs mt-1">{validationError}</p>
            )}
          </div>

          <EvidenceUpload files={evidenceFiles} onChange={setEvidenceFiles} />

          {error && <div className="alert alert-error text-sm">{error}</div>}

          <button type="submit" className="btn btn-primary w-full" disabled={loading}>
            {loading ? <span className="loading loading-spinner loading-sm" /> : 'Enviar Relatório'}
          </button>
        </form>
      </div>
    </div>
  )
}
