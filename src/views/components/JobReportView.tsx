import { buildPdfData } from '@/models/job-report.model'
import type { JobReport, PdfData } from '@/models/job-report.model'

interface JobMeta {
  scheduledDate: string
  employeeName: string
  machineName: string
  city: string
  state: string
  jobType: string
}

interface Props {
  report: JobReport
  jobMeta: JobMeta
  onGeneratePdf?: (data: PdfData) => void
}

export function JobReportView({ report, jobMeta, onGeneratePdf }: Props) {
  function handleGeneratePdf() {
    const pdfData = buildPdfData({ report, ...jobMeta })
    onGeneratePdf?.(pdfData)
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
      {report.evidences.length > 0 && (
        <div className="card bg-base-200 p-4">
          <h2 className="font-bold text-lg mb-3">Evidências</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {report.evidences.map((ev) => (
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
      <button type="button" className="btn btn-outline btn-primary" onClick={handleGeneratePdf}>
        Gerar PDF
      </button>
    </div>
  )
}
