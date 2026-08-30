import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { FileText, X } from 'lucide-react'
import { pdf } from '@react-pdf/renderer'
import { JobReportView } from '@/views/components/JobReportView'
import { JobReportPdf } from '@/views/components/JobReportPdf'
import { EntityTimeline } from '@/views/components/EntityTimeline'
import { fetchJob, fetchJobsByMachine } from '@/services/job.service'
import { fetchReport } from '@/services/job-report.service'
import { fetchDocuments, generateReport } from '@/services/document.service'
import type { JobDetail, Job } from '@/models/job.model'
import { JOB_STATUS_LABEL, JOB_STATUS_BADGE_CLASS } from '@/models/job.model'
import type { PdfData } from '@/models/job-report.model'
import { JobReadOnlyView } from '@/views/components/JobReadOnlyView'
import { JobChecklistTab } from '@/views/components/JobChecklistTab'
import { formatDate } from '@/utils/date'
import { downloadBlob } from '@/utils/downloadBlob'
import { toast } from '@/viewmodels/toast.viewmodel'

type Tab = 'info' | 'report' | 'checklist' | 'history' | 'documents' | 'timeline'

interface JobDetailModalProps {
  jobId: string
  onClose: () => void
}

export function JobDetailModal({ jobId, onClose }: JobDetailModalProps) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [tab, setTab] = useState<Tab>('info')
  const [generatingPdf, setGeneratingPdf] = useState(false)

  const jobQuery = useQuery({
    queryKey: ['jobs', jobId],
    queryFn: () => fetchJob(jobId) as Promise<JobDetail>,
  })
  const job = jobQuery.data ?? null

  const documentsQueryKey = ['documents', 'job', jobId] as const
  const documentsQuery = useQuery({
    queryKey: documentsQueryKey,
    queryFn: () => fetchDocuments('job', jobId),
    enabled: tab === 'documents',
  })

  const generateReportPdfMutation = useMutation({
    mutationFn: () => generateReport(jobId),
    onSuccess: () => {
      toast.success('PDF do relatório gerado com sucesso.')
      queryClient.invalidateQueries({ queryKey: documentsQueryKey })
    },
    onError: (err: unknown) => {
      const status = (err as { response?: { status?: number } })?.response?.status
      if (status === 404) {
        toast.error('Envie o relatório da OS antes de gerar o PDF.')
      } else {
        toast.error('Erro ao gerar o PDF do relatório.')
      }
    },
  })

  const reportQuery = useQuery({
    queryKey: ['jobs', jobId, 'report'],
    queryFn: () => fetchReport(jobId),
    retry: false,
  })
  const report = reportQuery.isError ? null : (reportQuery.data ?? null)

  const relatedJobsQuery = useQuery({
    queryKey: ['jobs', jobId, 'related', job?.machineId],
    queryFn: () => fetchJobsByMachine(job!.machineId),
    enabled: Boolean(job?.machineId),
  })
  const relatedJobs: Job[] = (relatedJobsQuery.data ?? []).filter((jj) => jj.id !== jobId)

  const loading = jobQuery.isLoading
  const error = jobQuery.isError ? (jobQuery.error as Error).message : null

  async function handleGeneratePdf(data: PdfData) {
    setGeneratingPdf(true)
    try {
      const blob = await pdf(<JobReportPdf data={data} />).toBlob()
      downloadBlob(blob, `relatorio-${data.jobId.slice(0, 8)}.pdf`)
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
            {job?.number && (
              <span className="badge badge-outline font-mono text-xs mt-1">{job.number}</span>
            )}
          </div>
          <div className="flex items-center gap-3">
            {job && job.status !== 'cancelled' && job.status !== 'completed' && (
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => {
                  onClose()
                  navigate(`/jobs/${jobId}/edit`)
                }}
              >
                Editar
              </button>
            )}
            <button
              className="btn btn-ghost btn-sm btn-circle"
              onClick={onClose}
              aria-label="Fechar"
            >
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
                <button
                  role="tab"
                  className={`tab ${tab === 'documents' ? 'tab-active' : ''}`}
                  onClick={() => setTab('documents')}
                >
                  Documentos
                </button>
                <button
                  role="tab"
                  className={`tab ${tab === 'timeline' ? 'tab-active' : ''}`}
                  onClick={() => setTab('timeline')}
                >
                  Linha do tempo
                </button>
              </div>

              {tab === 'info' && <JobReadOnlyView job={job} />}
              {tab === 'checklist' && <JobChecklistTab jobId={jobId} />}
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
                        <tr
                          key={r.id}
                          className="hover cursor-pointer"
                          onClick={() => {
                            onClose()
                            navigate(`/jobs/${r.id}`)
                          }}
                        >
                          <td className="num text-xs text-base-content/50">{r.number ?? '—'}</td>
                          <td className="text-base-content/60">{formatDate(r.scheduledDate)}</td>
                          <td>{r.employeeName}</td>
                          <td>
                            <span
                              className={`badge badge-sm ${r.jobType === 'maintenance' ? 'badge-warning' : 'badge-info'}`}
                            >
                              {r.jobType === 'maintenance' ? 'Manutenção' : 'Implementação'}
                            </span>
                          </td>
                          <td>
                            <span
                              className={`badge badge-sm ${JOB_STATUS_BADGE_CLASS[r.status] ?? 'badge-ghost'}`}
                            >
                              {JOB_STATUS_LABEL[r.status] ?? r.status}
                            </span>
                          </td>
                          <td className="truncate max-w-48 text-base-content/70">
                            {r.description}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {tab === 'documents' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-sm">Documentos</h3>
                    <span
                      className={!job.reportId ? 'tooltip tooltip-left' : undefined}
                      data-tip={
                        !job.reportId ? 'Envie o relatório da OS antes de gerar o PDF' : undefined
                      }
                    >
                      <button
                        className="btn btn-primary btn-sm gap-2"
                        onClick={() => generateReportPdfMutation.mutate()}
                        disabled={!job.reportId || generateReportPdfMutation.isPending}
                      >
                        {generateReportPdfMutation.isPending ? (
                          <span className="loading loading-spinner loading-xs" />
                        ) : (
                          <FileText size={14} />
                        )}
                        Gerar PDF
                      </button>
                    </span>
                  </div>

                  {documentsQuery.isLoading && (
                    <div className="flex justify-center py-8">
                      <span className="loading loading-spinner loading-md" />
                    </div>
                  )}
                  {documentsQuery.isError && (
                    <div className="alert alert-error text-sm">Erro ao carregar documentos.</div>
                  )}
                  {documentsQuery.isSuccess && documentsQuery.data.length === 0 && (
                    <p className="text-base-content/50 py-4 text-sm">
                      Nenhum documento anexado ainda.
                    </p>
                  )}
                  {documentsQuery.isSuccess && documentsQuery.data.length > 0 && (
                    <div className="space-y-2">
                      {documentsQuery.data.map((doc) => (
                        <div
                          key={doc.id}
                          className="flex items-center justify-between p-3 bg-base-200 border border-base-300 rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <FileText size={16} className="text-primary shrink-0" />
                            <div>
                              <p className="text-sm font-medium">
                                {doc.label ?? doc.fileName ?? 'Documento'}
                              </p>
                              <p className="text-xs text-base-content/40">
                                {new Date(doc.createdAt).toLocaleString('pt-BR')}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {tab === 'timeline' && <EntityTimeline entityType="job" entityId={jobId} />}

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
