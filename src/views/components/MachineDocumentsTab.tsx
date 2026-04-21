import { useEffect, useRef, useState } from 'react'
import { FileText, Trash2, Upload } from 'lucide-react'
import api from '@/services/api'
import { useAuthStore } from '@/viewmodels/auth.viewmodel'

interface MachineDocument {
  id: string
  filename: string
  url: string
  createdAt: string
}

interface Props {
  machineId: string
}

export function MachineDocumentsTab({ machineId }: Props) {
  const { user } = useAuthStore()
  const canManage = user?.role === 'admin' || user?.role === 'manager'

  const [docs, setDocs] = useState<MachineDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  async function loadDocs() {
    setLoading(true)
    setLoadError(null)
    try {
      const { data } = await api.get<MachineDocument[]>(`/machines/${machineId}/documents`)
      setDocs(data)
    } catch (err: any) {
      setLoadError(err?.response?.data?.error ?? 'Erro ao carregar documentos.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadDocs() }, [machineId])

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (files.length === 0) return

    const nonPdf = files.filter((f) => !f.name.endsWith('.pdf'))
    if (nonPdf.length > 0) {
      setUploadError('Apenas arquivos PDF são permitidos.')
      if (inputRef.current) inputRef.current.value = ''
      return
    }

    setUploadError(null)
    setSuccess(null)
    setUploading(true)
    const errors: string[] = []
    try {
      for (const file of files) {
        try {
          const form = new FormData()
          form.append('file', file)
          await api.post(`/machines/${machineId}/manual`, form, {
            headers: { 'Content-Type': 'multipart/form-data' },
          })
        } catch (err: any) {
          errors.push(`"${file.name}": ${err?.response?.data?.error ?? 'Erro ao enviar.'}`)
        }
      }
      if (errors.length > 0) {
        setUploadError(errors.join(' | '))
      } else {
        setSuccess(`${files.length === 1 ? `"${files[0].name}"` : `${files.length} arquivos`} enviado(s) com sucesso.`)
      }
      await loadDocs()
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  async function handleDelete(docId: string, filename: string) {
    if (!confirm(`Remover "${filename}"?`)) return
    setLoadError(null)
    try {
      await api.delete(`/machines/${machineId}/documents/${docId}`)
      setDocs((d) => d.filter((doc) => doc.id !== docId))
    } catch {
      setLoadError('Erro ao remover documento.')
    }
  }

  return (
    <div className="space-y-4">
      {canManage && (
        <div className="card bg-base-200 border border-base-300">
          <div className="card-body gap-3">
            <h3 className="font-semibold text-sm">Adicionar Manual (PDF)</h3>
            {uploadError && <div className="alert alert-error text-sm">{uploadError}</div>}
            {success && <div className="alert alert-success text-sm">{success}</div>}
            <div className="flex items-center gap-3">
              <input
                ref={inputRef}
                type="file"
                accept=".pdf"
                multiple
                className="hidden"
                onChange={handleUpload}
              />
              <button
                className="btn btn-primary btn-sm gap-2"
                onClick={() => inputRef.current?.click()}
                disabled={uploading}
              >
                {uploading
                  ? <span className="loading loading-spinner loading-xs" />
                  : <Upload size={14} />}
                {uploading ? 'Enviando e indexando...' : 'Selecionar PDF'}
              </button>
              <span className="text-xs text-base-content/40">
                Múltiplos PDFs são permitidos
              </span>
            </div>
          </div>
        </div>
      )}

      {loadError && <div className="alert alert-error text-sm">{loadError}</div>}

      {loading ? (
        <div className="flex justify-center py-8">
          <span className="loading loading-spinner loading-md" />
        </div>
      ) : docs.length === 0 ? (
        <p className="text-base-content/50 py-4 text-sm">Nenhum manual enviado ainda.</p>
      ) : (
        <div className="space-y-2">
          {docs.map((doc) => (
            <div key={doc.id} className="flex items-center justify-between p-3 bg-base-200 border border-base-300 rounded-lg">
              <div className="flex items-center gap-3">
                <FileText size={16} className="text-primary shrink-0" />
                <div>
                  <a href={doc.url} target="_blank" rel="noopener noreferrer"
                    className="text-sm font-medium hover:underline">
                    {doc.filename}
                  </a>
                  <p className="text-xs text-base-content/40">
                    {new Date(doc.createdAt).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </div>
              {canManage && (
                <button
                  className="btn btn-ghost btn-xs text-error"
                  onClick={() => handleDelete(doc.id, doc.filename)}
                  title="Remover"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
