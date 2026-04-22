import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Trash2, Upload } from 'lucide-react'
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
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button className="btn btn-ghost btn-sm btn-circle" onClick={() => navigate('/bags')}>
            <ArrowLeft size={16} />
          </button>
          <h1 className="text-xl font-bold tracking-tight">{isEditing ? 'Editar Mala' : 'Nova Mala'}</h1>
        </div>
        <div className="flex gap-2">
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => navigate('/bags')}>Cancelar</button>
          <button type="submit" form="bag-form" className="btn btn-primary btn-sm" disabled={loading}>
            {loading ? <span className="loading loading-spinner loading-xs" /> : isEditing ? 'Salvar' : 'Criar'}
          </button>
        </div>
      </div>

      <div className="card bg-base-200 border border-base-300">
        <div className="card-body">
          <form id="bag-form" onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
            <fieldset className="fieldset gap-1">
              <label className="label text-xs font-medium text-base-content/60">Nome</label>
              <input
                className={`input input-bordered w-full ${errors.name ? 'input-error' : ''}`}
                value={form.name}
                onChange={(e) => set_('name', e.target.value)}
                placeholder="Ex: Mala de Ferramentas"
              />
              {errors.name && <span className="text-error text-xs">{errors.name}</span>}
            </fieldset>

            <fieldset className="fieldset gap-1">
              <label className="label text-xs font-medium text-base-content/60">Modelo</label>
              <input
                className={`input input-bordered w-full ${errors.model ? 'input-error' : ''}`}
                value={form.model}
                onChange={(e) => set_('model', e.target.value)}
                placeholder="Ex: Pelican 1510"
              />
              {errors.model && <span className="text-error text-xs">{errors.model}</span>}
            </fieldset>

            <fieldset className="fieldset gap-1">
              <label className="label text-xs font-medium text-base-content/60">Quantidade</label>
              <input
                type="number"
                min={1}
                className={`input input-bordered w-full ${errors.quantity ? 'input-error' : ''}`}
                value={form.quantity}
                onChange={(e) => set_('quantity', e.target.value)}
              />
              {errors.quantity && <span className="text-error text-xs">{errors.quantity}</span>}
            </fieldset>

          </form>
        </div>
      </div>

      {isEditing && (
        <div className="flex flex-col gap-4">
          <h2 className="text-sm font-semibold text-base-content/40 uppercase tracking-wider">Certificados de Calibração</h2>

          {certs.length > 0 && (
            <div className="flex flex-col gap-2">
              {certs.map((c) => {
                const expired = isCertificateExpired(c.expiryDate)
                const expiring = isCertificateExpiringSoon(c.expiryDate)
                return (
                  <div key={c.id} className="flex items-center gap-3 p-3 bg-base-200 rounded-lg border border-base-300">
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
