import { useEffect, useRef, useState } from 'react'
import { FileText, Trash2, Upload } from 'lucide-react'
import api from '@/services/api'

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
  const [docs, setDocs] = useState<MachineDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  async function loadDocs() {
    setLoading(true)
    try {
      const { data } = await api.get<MachineDocument[]>(`/machines/${machineId}/documents`)
      setDocs(data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadDocs() }, [machineId])

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.name.endsWith('.pdf')) return setError('Apenas arquivos PDF são permitidos.')
    setError(null)
    setSuccess(null)
    setUploading(true)
    try {
      const form = new FormData()
      form.append('file', file)
      await api.post(`/machines/${machineId}/manual`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setSuccess(`"${file.name}" enviado e indexado com sucesso.`)
      await loadDocs()
    } catch (err: any) {
      setError(err?.response?.data?.error ?? 'Erro ao enviar arquivo.')
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  async function handleDelete(docId: string, filename: string) {
    if (!confirm(`Remover "${filename}"?`)) return
    setError(null)
    try {
      await api.delete(`/machines/${machineId}/documents/${docId}`)
      setDocs((d) => d.filter((doc) => doc.id !== docId))
    } catch {
      setError('Erro ao remover documento.')
    }
  }

  return (
    <div className="space-y-4">
      {/* Upload */}
      <div className="card bg-base-200 border border-base-300">
        <div className="card-body gap-3">
          <h3 className="font-semibold text-sm">Adicionar Manual (PDF)</h3>
          {error && <div className="alert alert-error text-sm">{error}</div>}
          {success && <div className="alert alert-success text-sm">{success}</div>}
          <div className="flex items-center gap-3">
            <input
              ref={inputRef}
              type="file"
              accept=".pdf"
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

      {/* Lista */}
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
              <button
                className="btn btn-ghost btn-xs text-error"
                onClick={() => handleDelete(doc.id, doc.filename)}
                title="Remover"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
