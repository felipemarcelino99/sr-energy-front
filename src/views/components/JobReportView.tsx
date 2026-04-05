import { useState } from 'react'
import { buildPdfData } from '@/models/job-report.model'
import type { JobReport, PdfData } from '@/models/job-report.model'
import { useChecklistStore } from '@/viewmodels/checklist.viewmodel'

interface JobMeta {
  scheduledDate: string
  employeeName: string
  machineName: string
  city: string
  state: string
  jobType: string
}

interface Props {
  jobId: string
  report: JobReport
  jobMeta: JobMeta
  onGeneratePdf?: (data: PdfData) => void
}

export function JobReportView({ jobId, report, jobMeta, onGeneratePdf }: Props) {
  const [showChecklistStep, setShowChecklistStep] = useState(false)
  const { items, loading, checkedCount, allChecked, duplicateForReport, fetchChecklist, toggleItem } =
    useChecklistStore()

  async function handleClickGeneratePdf() {
    setShowChecklistStep(true)
    await duplicateForReport(jobId)
    await fetchChecklist(jobId, 'pre_report')
  }

  function handleConfirmPdf() {
    const pdfData = buildPdfData({ report, ...jobMeta, checklist: items })
    onGeneratePdf?.(pdfData)
    setShowChecklistStep(false)
  }

  const uncheckedCount = items.length - checkedCount

  if (showChecklistStep) {
    return (
      <div data-testid="checklist-step" className="flex flex-col gap-4">
        <h2 className="font-bold text-lg">Confirme o checklist de ferramentas</h2>

        {loading && (
          <div className="flex justify-center py-4">
            <span className="loading loading-spinner loading-md" />
          </div>
        )}

        {!loading && (
          <>
            <p className="text-sm text-base-content/60">
              {checkedCount}/{items.length} itens verificados
            </p>

            {!allChecked && uncheckedCount > 0 && (
              <div data-testid="checklist-warning" className="alert alert-warning text-sm">
                ⚠️ {uncheckedCount} item(ns) não marcado(s) — isso pode indicar que a ferramenta foi perdida ou esquecida
              </div>
            )}

            <ul className="flex flex-col gap-2">
              {items.map((item) => (
                <li key={item.id} className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    className="checkbox checkbox-sm"
                    checked={item.checked}
                    onChange={() => toggleItem(jobId, item.id, !item.checked)}
                  />
                  <span className={item.checked ? '' : 'text-base-content/50'}>{item.tool.name}</span>
                </li>
              ))}
            </ul>
          </>
        )}

        <div className="flex gap-2 mt-2">
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => setShowChecklistStep(false)}
          >
            Cancelar
          </button>
          <button
            type="button"
            className="btn btn-primary flex-1"
            onClick={handleConfirmPdf}
            disabled={loading}
          >
            Confirmar e Gerar PDF
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Report HTML */}
      <div className="card bg-base-200 p-4">
        <h2 className="font-bold text-lg mb-3">Relatório</h2>
        <div
          data-testid="report-content"
          className="prose max-w-none"
          dangerouslySetInnerHTML={{ __html: report.content }}
        />
      </div>

      {/* Evidences */}
      {(report.evidences ?? []).length > 0 && (
        <div className="card bg-base-200 p-4">
          <h2 className="font-bold text-lg mb-3">Evidências</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {(report.evidences ?? []).map((ev) => (
              <div key={ev.id} className="flex flex-col items-center gap-1">
                {ev.type === 'image' ? (
                  <a href={ev.url} target="_blank" rel="noreferrer">
                    <img
                      src={ev.url}
                      alt={ev.fileName}
                      className="w-full h-32 object-cover rounded border"
                    />
                  </a>
                ) : (
                  <a
                    href={ev.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex flex-col items-center gap-1 p-3 bg-base-300 rounded w-full h-32 justify-center hover:bg-base-content/10"
                  >
                    <span className="text-3xl">
                      {ev.type === 'pdf' ? '📄' : ev.type === 'video' ? '🎬' : '🎵'}
                    </span>
                    <span className="text-xs text-center break-all">{ev.fileName}</span>
                  </a>
                )}
                <a href={ev.url} download={ev.fileName} className="link link-primary text-xs">
                  Download
                </a>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Generate PDF button */}
      <button type="button" className="btn btn-outline btn-primary" onClick={handleClickGeneratePdf}>
        Gerar PDF
      </button>
    </div>
  )
}
