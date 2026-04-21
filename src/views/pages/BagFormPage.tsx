import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Trash2, Upload } from 'lucide-react'
import { useBagStore } from '@/viewmodels/bag.viewmodel'
import { bagSchema } from '@/models/bag.model'
import type { CalibrationCertificate } from '@/models/bag.model'
import { isCertificateExpiringSoon, isCertificateExpired } from '@/models/bag.model'
import { fetchBag } from '@/services/bag.service'
import { toast } from '@/viewmodels/toast.viewmodel'

export function BagFormPage() {
  const { id } = useParams<{ id: string }>()
  const isEditing = Boolean(id)
  const navigate = useNavigate()
  const { create, update, uploadCert, removeCert } = useBagStore()

  const [form, setForm] = useState({ name: '', model: '', quantity: '1' })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)

  const [certs, setCerts] = useState<CalibrationCertificate[]>([])
  const [certFile, setCertFile] = useState<File | null>(null)
  const [certExpiry, setCertExpiry] = useState('')
  const [uploadingCert, setUploadingCert] = useState(false)

  useEffect(() => {
    if (!id) return
    fetchBag(id).then((b) => {
      setForm({ name: b.name, model: b.model, quantity: String(b.quantity) })
      setCerts(b.calibrationCertificates)
    })
  }, [id])

  function set_(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const result = bagSchema.safeParse({ ...form, quantity: Number(form.quantity) })
    if (!result.success) {
      const errs: Record<string, string> = {}
      for (const issue of result.error.issues) {
        errs[String(issue.path[0])] = issue.message
      }
      setErrors(errs)
      return
    }
    setErrors({})
    setLoading(true)
    try {
      if (isEditing && id) {
        await update(id, result.data)
        toast.success('Mala atualizada com sucesso.')
      } else {
        await create(result.data)
        toast.success('Mala criada com sucesso.')
      }
      navigate('/bags')
    } finally {
      setLoading(false)
    }
  }

  async function handleCertUpload() {
    if (!certFile || !certExpiry || !id) return
    setUploadingCert(true)
    try {
      await uploadCert(id, certFile, certExpiry)
      const updated = await fetchBag(id)
      setCerts(updated.calibrationCertificates)
      setCertFile(null)
      setCertExpiry('')
      toast.success('Certificado adicionado.')
    } finally {
      setUploadingCert(false)
    }
  }

  async function handleCertRemove(certId: string) {
    if (!id) return
    await removeCert(id, certId)
    setCerts((prev) => prev.filter((c) => c.id !== certId))
    toast.success('Certificado removido.')
  }

  return (
    <div className="p-6 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold mb-6">{isEditing ? 'Editar Mala' : 'Nova Mala'}</h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        <div className="form-control">
          <label className="label"><span className="label-text">Nome</span></label>
          <input
            className={`input input-bordered ${errors.name ? 'input-error' : ''}`}
            value={form.name}
            onChange={(e) => set_('name', e.target.value)}
            placeholder="Ex: Mala de Ferramentas"
          />
          {errors.name && <span className="text-error text-sm mt-1">{errors.name}</span>}
        </div>

        <div className="form-control">
          <label className="label"><span className="label-text">Modelo</span></label>
          <input
            className={`input input-bordered ${errors.model ? 'input-error' : ''}`}
            value={form.model}
            onChange={(e) => set_('model', e.target.value)}
            placeholder="Ex: Pelican 1510"
          />
          {errors.model && <span className="text-error text-sm mt-1">{errors.model}</span>}
        </div>

        <div className="form-control">
          <label className="label"><span className="label-text">Quantidade</span></label>
          <input
            type="number"
            min={1}
            className={`input input-bordered ${errors.quantity ? 'input-error' : ''}`}
            value={form.quantity}
            onChange={(e) => set_('quantity', e.target.value)}
          />
          {errors.quantity && <span className="text-error text-sm mt-1">{errors.quantity}</span>}
        </div>

        <div className="flex gap-3 mt-2">
          <button type="button" className="btn btn-ghost" onClick={() => navigate('/bags')}>Cancelar</button>
          <button type="submit" className="btn btn-primary flex-1" disabled={loading}>
            {loading ? <span className="loading loading-spinner loading-sm" /> : isEditing ? 'Salvar' : 'Criar'}
          </button>
        </div>
      </form>

      {isEditing && (
        <div className="mt-8">
          <h2 className="text-lg font-bold mb-3">Certificados de Calibração</h2>

          {certs.length > 0 && (
            <div className="flex flex-col gap-2 mb-4">
              {certs.map((c) => {
                const expired = isCertificateExpired(c.expiryDate)
                const expiring = isCertificateExpiringSoon(c.expiryDate)
                return (
                  <div key={c.id} className="flex items-center gap-3 p-3 bg-base-200 rounded-lg">
                    <div className="flex-1 text-sm">
                      <a href={c.fileUrl} target="_blank" rel="noreferrer" className="link link-primary">
                        Ver certificado ↗
                      </a>
                      <span className={`ml-3 badge badge-sm ${expired ? 'badge-error' : expiring ? 'badge-warning' : 'badge-success'}`}>
                        {expired ? 'Vencido' : expiring ? 'Vencendo' : 'Válido'} — {c.expiryDate}
                      </span>
                    </div>
                    <button
                      type="button"
                      className="btn btn-ghost btn-xs text-error"
                      onClick={() => handleCertRemove(c.id)}
                      title="Remover certificado"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                )
              })}
            </div>
          )}

          <div className="flex flex-col gap-2 border border-base-300 rounded-lg p-4">
            <p className="text-sm font-medium">Adicionar certificado</p>
            <input
              type="file"
              accept=".pdf"
              className="file-input file-input-bordered file-input-sm"
              onChange={(e) => setCertFile(e.target.files?.[0] ?? null)}
            />
            <div className="form-control">
              <label className="label"><span className="label-text text-xs">Data de vencimento</span></label>
              <input
                type="date"
                className="input input-bordered input-sm"
                value={certExpiry}
                onChange={(e) => setCertExpiry(e.target.value)}
              />
            </div>
            <button
              type="button"
              className="btn btn-sm btn-outline gap-1"
              disabled={!certFile || !certExpiry || uploadingCert}
              onClick={handleCertUpload}
            >
              {uploadingCert
                ? <span className="loading loading-spinner loading-xs" />
                : <><Upload size={13} /> Enviar</>
              }
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
