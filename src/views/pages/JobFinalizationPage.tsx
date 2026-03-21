import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { RichTextEditor } from '@/views/components/RichTextEditor'
import { EvidenceUpload } from '@/views/components/EvidenceUpload'
import { useJobReportStore } from '@/viewmodels/job-report.viewmodel'

export function JobFinalizationPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { submit, loading, error, submitted } = useJobReportStore()

  const [content, setContent] = useState('')
  const [evidenceFiles, setEvidenceFiles] = useState<File[]>([])
  const [validationError, setValidationError] = useState<string | null>(null)

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
        <h2 className="text-2xl font-bold mb-2">Trabalho finalizado!</h2>
        <p className="text-base-content/60 mb-6">O relatório foi enviado com sucesso.</p>
        <button className="btn btn-primary" onClick={() => navigate('/my-jobs')}>
          Voltar para meus trabalhos
        </button>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Finalizar Trabalho</h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <div>
          <label className="label text-sm font-medium text-base-content/70 mb-2 block">
            Relatório do Trabalho
          </label>
          <RichTextEditor content={content} onChange={setContent} />
          {validationError && (
            <p className="text-error text-xs mt-1">{validationError}</p>
          )}
        </div>

        <EvidenceUpload files={evidenceFiles} onChange={setEvidenceFiles} />

        {error && <div className="alert alert-error text-sm">{error}</div>}

        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? <span className="loading loading-spinner loading-sm" /> : 'Enviar Relatório'}
        </button>
      </form>
    </div>
  )
}
