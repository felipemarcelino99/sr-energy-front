import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { JobDetailView } from '@/views/components/JobDetailView'
import { JobChecklistTab } from '@/views/components/JobChecklistTab'
import { fetchJob } from '@/services/job.service'
import type { JobDetail } from '@/models/job.model'

type Tab = 'info' | 'checklist'

export function EmployeeJobDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [job, setJob] = useState<JobDetail | null>(null)
  const [tab, setTab] = useState<Tab>('info')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    fetchJob(id)
      .then((j) => setJob(j as JobDetail))
      .catch((err) => setError((err as Error).message))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <div className="flex justify-center py-16"><span className="loading loading-spinner loading-lg" /></div>
  if (error) return <div className="p-6 alert alert-error">{error}</div>
  if (!job) return <div className="p-6 text-base-content/50">Trabalho não encontrado.</div>

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-4">
        <button className="btn btn-ghost btn-sm btn-circle" onClick={() => navigate('/jobs')}>
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
      </div>

      {tab === 'info' && <JobDetailView job={job} />}
      {tab === 'checklist' && <JobChecklistTab jobId={id!} />}
    </div>
  )
}
