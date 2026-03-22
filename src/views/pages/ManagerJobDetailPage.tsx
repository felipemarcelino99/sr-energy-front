import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { pdf } from '@react-pdf/renderer'
import { JobReportView } from '@/views/components/JobReportView'
import { JobReportPdf } from '@/views/components/JobReportPdf'
import { fetchJob } from '@/services/job.service'
import { fetchReport } from '@/services/job-report.service'
import type { JobDetail } from '@/models/job.model'
import type { JobReport, PdfData } from '@/models/job-report.model'
import { formatDate } from '@/utils/date'

type Tab = 'info' | 'report'

export function ManagerJobDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [job, setJob] = useState<JobDetail | null>(null)
  const [report, setReport] = useState<JobReport | null>(null)
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
        setJob(j as JobDetail)
        setReport(r)
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
  if (!job) return <div className="p-6 text-base-content/50">Trabalho não encontrado.</div>

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Detalhes do Trabalho</h1>

      {/* Tab switcher */}
      <div role="tablist" className="tabs tabs-boxed mb-6">
        <button
          role="tab"
          className={`tab ${tab === 'info' ? 'tab-active' : ''}`}
          onClick={() => setTab('info')}
        >
          Informações
        </button>
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

      {tab === 'info' && (
        <div className="card bg-base-200 p-4 text-sm grid grid-cols-2 gap-2">
          <span className="font-medium">Data:</span><span>{formatDate(job.scheduledDate)}</span>
          <span className="font-medium">Local:</span><span>{job.city}/{job.state}</span>
          <span className="font-medium">Horário:</span><span>{job.startTime} – {job.endTime}</span>
          <span className="font-medium">Tipo:</span>
          <span>{job.jobType === 'maintenance' ? 'Manutenção' : 'Implementação'}</span>
          <span className="font-medium">Status:</span><span>{job.status}</span>
          <span className="font-medium col-span-2 mt-2">Descrição:</span>
          <span className="col-span-2">{job.description}</span>
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
