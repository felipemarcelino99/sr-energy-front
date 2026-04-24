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
    <form id={formId} onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      <fieldset className="fieldset gap-1">
        <label className="label text-xs font-medium text-base-content/60">Razão Social *</label>
        <input
          id="razaoSocial"
          type="text"
          className={`input input-bordered w-full ${errors.razaoSocial ? 'input-error' : ''}`}
          value={form.razaoSocial}
          onChange={(e) => set_('razaoSocial', e.target.value)}
        />
        {errors.razaoSocial && <span className="text-error text-xs">{errors.razaoSocial}</span>}
      </fieldset>

      <fieldset className="fieldset gap-1">
        <label className="label text-xs font-medium text-base-content/60">CNPJ *</label>
        <input
          id="cnpj"
          type="text"
          className={`input input-bordered w-full ${errors.cnpj ? 'input-error' : ''}`}
          placeholder="00.000.000/0000-00"
          value={form.cnpj}
          onChange={(e) => set_('cnpj', e.target.value)}
        />
        {errors.cnpj && <span className="text-error text-xs">{errors.cnpj}</span>}
      </fieldset>

      <fieldset className="fieldset gap-1">
        <label className="label text-xs font-medium text-base-content/60">Segmento *</label>
        <select
          id="segmento"
          className={`select select-bordered w-full ${errors.segmento ? 'select-error' : ''}`}
          value={form.segmento}
          onChange={(e) => set_('segmento', e.target.value)}
        >
          <option value="">Selecione...</option>
          {SEGMENTOS.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        {errors.segmento && <span className="text-error text-xs">{errors.segmento}</span>}
      </fieldset>

      <fieldset className="fieldset gap-1">
        <label className="label text-xs font-medium text-base-content/60">Status *</label>
        <select
          id="status"
          className="select select-bordered w-full"
          value={form.status}
          onChange={(e) => set_('status', e.target.value)}
        >
          <option value="active">Ativo</option>
          <option value="inactive">Inativo</option>
        </select>
      </fieldset>

      <fieldset className="fieldset gap-1">
        <label className="label text-xs font-medium text-base-content/60">E-mail *</label>
        <input
          id="email"
          type="email"
          className={`input input-bordered w-full ${errors.email ? 'input-error' : ''}`}
          value={form.email}
          onChange={(e) => set_('email', e.target.value)}
        />
        {errors.email && <span className="text-error text-xs">{errors.email}</span>}
      </fieldset>

      <fieldset className="fieldset gap-1">
        <label className="label text-xs font-medium text-base-content/60">Telefone</label>
        <input
          id="telefone"
          type="text"
          className="input input-bordered w-full"
          placeholder="(00) 0000-0000"
          value={form.telefone}
          onChange={(e) => set_('telefone', e.target.value)}
        />
      </fieldset>

      <fieldset className="fieldset gap-1">
        <label className="label text-xs font-medium text-base-content/60">Celular</label>
        <input
          id="celular"
          type="text"
          className="input input-bordered w-full"
          placeholder="(00) 00000-0000"
          value={form.celular}
          onChange={(e) => set_('celular', e.target.value)}
        />
      </fieldset>

      <div className="flex flex-col gap-4">
        <p className="text-xs font-semibold text-base-content/40 uppercase tracking-wider">Endereço</p>

        <div className="grid grid-cols-3 gap-4">
          <fieldset className="fieldset gap-1">
            <label className="label text-xs font-medium text-base-content/60">CEP</label>
            <input
              id="cep"
              type="text"
              className="input input-bordered w-full"
              placeholder="00000-000"
              value={form.cep}
              onChange={(e) => set_('cep', e.target.value)}
            />
          </fieldset>

          <fieldset className="fieldset gap-1 col-span-2">
            <label className="label text-xs font-medium text-base-content/60">Logradouro *</label>
            <input
              id="logradouro"
              type="text"
              className={`input input-bordered w-full ${errors['endereco.logradouro'] ? 'input-error' : ''}`}
              value={form.logradouro}
              onChange={(e) => set_('logradouro', e.target.value)}
            />
            {errors['endereco.logradouro'] && <span className="text-error text-xs">{errors['endereco.logradouro']}</span>}
          </fieldset>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <fieldset className="fieldset gap-1">
            <label className="label text-xs font-medium text-base-content/60">Número *</label>
            <input
              id="numero"
              type="text"
              className="input input-bordered w-full"
              value={form.numero}
              onChange={(e) => set_('numero', e.target.value)}
            />
          </fieldset>

          <fieldset className="fieldset gap-1">
            <label className="label text-xs font-medium text-base-content/60">Complemento</label>
            <input
              id="complemento"
              type="text"
              className="input input-bordered w-full"
              value={form.complemento}
              onChange={(e) => set_('complemento', e.target.value)}
            />
          </fieldset>

          <fieldset className="fieldset gap-1">
            <label className="label text-xs font-medium text-base-content/60">Bairro *</label>
            <input
              id="bairro"
              type="text"
              className="input input-bordered w-full"
              value={form.bairro}
              onChange={(e) => set_('bairro', e.target.value)}
            />
          </fieldset>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <fieldset className="fieldset gap-1 col-span-2">
            <label className="label text-xs font-medium text-base-content/60">Cidade *</label>
            <input
              id="cidade"
              type="text"
              className="input input-bordered w-full"
              value={form.cidade}
              onChange={(e) => set_('cidade', e.target.value)}
            />
          </fieldset>

          <fieldset className="fieldset gap-1">
            <label className="label text-xs font-medium text-base-content/60">Estado *</label>
            <input
              id="estado"
              type="text"
              maxLength={2}
              className="input input-bordered w-full"
              placeholder="UF"
              value={form.estado}
              onChange={(e) => set_('estado', e.target.value)}
            />
          </fieldset>
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
