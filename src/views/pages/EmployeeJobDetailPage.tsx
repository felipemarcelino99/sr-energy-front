import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { JobDetailView } from '@/views/components/JobDetailView'
import { fetchJob } from '@/services/job.service'
import type { JobDetail } from '@/models/job.model'

export function EmployeeJobDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [job, setJob] = useState<JobDetail | null>(null)
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
      <h1 className="text-2xl font-bold mb-6">Detalhes do Trabalho</h1>
      <JobDetailView job={job} />
    </div>
  )
}
