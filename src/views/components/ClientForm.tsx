import { useState } from 'react'
import { clientSchema, type ClientFormData } from '@/models/client.model'

const SEGMENTOS = ['Industrial', 'Comercial', 'Residencial', 'Poder Público', 'Outro']

interface Props {
  initialData?: Partial<ClientFormData>
  onSubmit: (data: ClientFormData) => void
  loading?: boolean
  formId?: string
  hideButtons?: boolean
}

type FormState = {
  razaoSocial: string
  cnpj: string
  segmento: string
  email: string
  telefone: string
  celular: string
  status: string
  logradouro: string
  numero: string
  complemento: string
  bairro: string
  cidade: string
  estado: string
  cep: string
}

export function ClientForm({ initialData, onSubmit, loading, formId = 'client-form', hideButtons }: Props) {
  const [form, setForm] = useState<FormState>({
    razaoSocial: initialData?.razaoSocial ?? '',
    cnpj: initialData?.cnpj ?? '',
    segmento: initialData?.segmento ?? '',
    email: initialData?.email ?? '',
    telefone: initialData?.telefone ?? '',
    celular: initialData?.celular ?? '',
    status: initialData?.status ?? 'active',
    logradouro: initialData?.endereco?.logradouro ?? '',
    numero: initialData?.endereco?.numero ?? '',
    complemento: initialData?.endereco?.complemento ?? '',
    bairro: initialData?.endereco?.bairro ?? '',
    cidade: initialData?.endereco?.cidade ?? '',
    estado: initialData?.endereco?.estado ?? '',
    cep: initialData?.endereco?.cep ?? '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  function set_(field: keyof FormState, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const result = clientSchema.safeParse({
      razaoSocial: form.razaoSocial,
      cnpj: form.cnpj,
      segmento: form.segmento,
      email: form.email,
      telefone: form.telefone || undefined,
      celular: form.celular || undefined,
      status: form.status,
      endereco: {
        logradouro: form.logradouro,
        numero: form.numero,
        complemento: form.complemento || undefined,
        bairro: form.bairro,
        cidade: form.cidade,
        estado: form.estado,
        cep: form.cep,
      },
    })
    if (!result.success) {
      const errs: Record<string, string> = {}
      for (const issue of result.error.issues) {
        const key = issue.path.join('.')
        if (!errs[key]) errs[key] = issue.message
      }
      setErrors(errs)
      return
    }
    setErrors({})
    onSubmit(result.data)
  }

  return (
    <form id={formId} onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
      {/* Dados principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="form-control">
          <label className="label" htmlFor="razaoSocial">
            <span className="label-text">Razão Social *</span>
          </label>
          <input
            id="razaoSocial"
            type="text"
            className={`input input-bordered input-sm${errors.razaoSocial ? ' input-error' : ''}`}
            value={form.razaoSocial}
            onChange={(e) => set_('razaoSocial', e.target.value)}
          />
          {errors.razaoSocial && <p className="text-error text-xs mt-1">{errors.razaoSocial}</p>}
        </div>

        <div className="form-control">
          <label className="label" htmlFor="cnpj">
            <span className="label-text">CNPJ *</span>
          </label>
          <input
            id="cnpj"
            type="text"
            className={`input input-bordered input-sm${errors.cnpj ? ' input-error' : ''}`}
            placeholder="00.000.000/0000-00"
            value={form.cnpj}
            onChange={(e) => set_('cnpj', e.target.value)}
          />
          {errors.cnpj && <p className="text-error text-xs mt-1">{errors.cnpj}</p>}
        </div>

        <div className="form-control">
          <label className="label" htmlFor="segmento">
            <span className="label-text">Segmento *</span>
          </label>
          <select
            id="segmento"
            className={`select select-bordered select-sm${errors.segmento ? ' select-error' : ''}`}
            value={form.segmento}
            onChange={(e) => set_('segmento', e.target.value)}
          >
            <option value="">Selecione...</option>
            {SEGMENTOS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          {errors.segmento && <p className="text-error text-xs mt-1">{errors.segmento}</p>}
        </div>

        <div className="form-control">
          <label className="label" htmlFor="status">
            <span className="label-text">Status *</span>
          </label>
          <select
            id="status"
            className="select select-bordered select-sm"
            value={form.status}
            onChange={(e) => set_('status', e.target.value)}
          >
            <option value="active">Ativo</option>
            <option value="inactive">Inativo</option>
          </select>
        </div>

        <div className="form-control">
          <label className="label" htmlFor="email">
            <span className="label-text">E-mail *</span>
          </label>
          <input
            id="email"
            type="email"
            className={`input input-bordered input-sm${errors.email ? ' input-error' : ''}`}
            value={form.email}
            onChange={(e) => set_('email', e.target.value)}
          />
          {errors.email && <p className="text-error text-xs mt-1">{errors.email}</p>}
        </div>

        <div className="form-control">
          <label className="label" htmlFor="telefone">
            <span className="label-text">Telefone</span>
          </label>
          <input
            id="telefone"
            type="text"
            className="input input-bordered input-sm"
            placeholder="(00) 0000-0000"
            value={form.telefone}
            onChange={(e) => set_('telefone', e.target.value)}
          />
        </div>

        <div className="form-control">
          <label className="label" htmlFor="celular">
            <span className="label-text">Celular</span>
          </label>
          <input
            id="celular"
            type="text"
            className="input input-bordered input-sm"
            placeholder="(00) 00000-0000"
            value={form.celular}
            onChange={(e) => set_('celular', e.target.value)}
          />
        </div>
      </div>

      {/* Endereço */}
      <div>
        <h3 className="text-sm font-semibold text-base-content/60 uppercase tracking-wider mb-3">Endereço</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="form-control">
            <label className="label" htmlFor="cep">
              <span className="label-text">CEP</span>
            </label>
            <input
              id="cep"
              type="text"
              className="input input-bordered input-sm"
              placeholder="00000-000"
              value={form.cep}
              onChange={(e) => set_('cep', e.target.value)}
            />
          </div>

          <div className="form-control md:col-span-2">
            <label className="label" htmlFor="logradouro">
              <span className="label-text">Logradouro *</span>
            </label>
            <input
              id="logradouro"
              type="text"
              className={`input input-bordered input-sm${errors['endereco.logradouro'] ? ' input-error' : ''}`}
              value={form.logradouro}
              onChange={(e) => set_('logradouro', e.target.value)}
            />
            {errors['endereco.logradouro'] && <p className="text-error text-xs mt-1">{errors['endereco.logradouro']}</p>}
          </div>

          <div className="form-control">
            <label className="label" htmlFor="numero">
              <span className="label-text">Número *</span>
            </label>
            <input
              id="numero"
              type="text"
              className="input input-bordered input-sm"
              value={form.numero}
              onChange={(e) => set_('numero', e.target.value)}
            />
          </div>

          <div className="form-control">
            <label className="label" htmlFor="complemento">
              <span className="label-text">Complemento</span>
            </label>
            <input
              id="complemento"
              type="text"
              className="input input-bordered input-sm"
              value={form.complemento}
              onChange={(e) => set_('complemento', e.target.value)}
            />
          </div>

          <div className="form-control">
            <label className="label" htmlFor="bairro">
              <span className="label-text">Bairro *</span>
            </label>
            <input
              id="bairro"
              type="text"
              className="input input-bordered input-sm"
              value={form.bairro}
              onChange={(e) => set_('bairro', e.target.value)}
            />
          </div>

          <div className="form-control">
            <label className="label" htmlFor="cidade">
              <span className="label-text">Cidade *</span>
            </label>
            <input
              id="cidade"
              type="text"
              className="input input-bordered input-sm"
              value={form.cidade}
              onChange={(e) => set_('cidade', e.target.value)}
            />
          </div>

          <div className="form-control">
            <label className="label" htmlFor="estado">
              <span className="label-text">Estado *</span>
            </label>
            <input
              id="estado"
              type="text"
              maxLength={2}
              className="input input-bordered input-sm"
              placeholder="UF"
              value={form.estado}
              onChange={(e) => set_('estado', e.target.value)}
            />
          </div>
        </div>
      </div>

      {!hideButtons && (
        <div className="flex justify-end gap-2">
          <button type="submit" className="btn btn-primary btn-sm" disabled={loading}>
            {loading ? <span className="loading loading-spinner loading-xs" /> : 'Salvar'}
          </button>
        </div>
      )}
    </form>
  )
}
