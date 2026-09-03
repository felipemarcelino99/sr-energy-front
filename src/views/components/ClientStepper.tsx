import { useState } from 'react'
import { clientStep1Schema, clientStep2Schema, type ClientFormData } from '@/models/client.model'

const SEGMENTOS = ['Industrial', 'Comercial', 'Residencial', 'Poder Público', 'Outro']

interface Props {
  initialData?: Partial<ClientFormData>
  onSubmit: (data: ClientFormData) => void
  loading?: boolean
}

type Step1 = {
  razaoSocial: string
  cnpj: string
  segmento: string
  email: string
  telefone: string
  celular: string
  status: string
}
type Step2 = {
  logradouro: string
  numero: string
  complemento: string
  bairro: string
  cidade: string
  estado: string
  cep: string
}

export function ClientStepper({ initialData, onSubmit, loading = false }: Props) {
  const [step, setStep] = useState(1)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const [s1, setS1] = useState<Step1>({
    razaoSocial: initialData?.razaoSocial ?? '',
    cnpj: initialData?.cnpj ?? '',
    segmento: initialData?.segmento ?? '',
    email: initialData?.email ?? '',
    telefone: initialData?.telefone ?? '',
    celular: initialData?.celular ?? '',
    status: initialData?.status ?? 'active',
  })
  const [s2, setS2] = useState<Step2>({
    logradouro: initialData?.endereco?.logradouro ?? '',
    numero: initialData?.endereco?.numero ?? '',
    complemento: initialData?.endereco?.complemento ?? '',
    bairro: initialData?.endereco?.bairro ?? '',
    cidade: initialData?.endereco?.cidade ?? '',
    estado: initialData?.endereco?.estado ?? '',
    cep: initialData?.endereco?.cep ?? '',
  })

  function set1(field: keyof Step1, value: string) {
    setS1((p) => ({ ...p, [field]: value }))
  }
  function set2(field: keyof Step2, value: string) {
    setS2((p) => ({ ...p, [field]: value }))
  }

  function parseErrors(issues: { path: PropertyKey[]; message: string }[]) {
    const errs: Record<string, string> = {}
    for (const issue of issues) errs[String(issue.path[0])] = issue.message
    return errs
  }

  function goNext() {
    const r = clientStep1Schema.safeParse({
      ...s1,
      telefone: s1.telefone || undefined,
      celular: s1.celular || undefined,
    })
    if (!r.success) {
      setErrors(parseErrors(r.error.issues))
      return
    }
    setErrors({})
    setStep(2)
  }

  function handleSubmit() {
    const payload = {
      razaoSocial: s1.razaoSocial,
      cnpj: s1.cnpj,
      segmento: s1.segmento,
      email: s1.email,
      telefone: s1.telefone || undefined,
      celular: s1.celular || undefined,
      status: s1.status,
      endereco: {
        logradouro: s2.logradouro,
        numero: s2.numero,
        complemento: s2.complemento || undefined,
        bairro: s2.bairro,
        cidade: s2.cidade,
        estado: s2.estado,
        cep: s2.cep,
      },
    }
    const r = clientStep2Schema.safeParse(payload.endereco)
    if (!r.success) {
      setErrors(parseErrors(r.error.issues))
      return
    }
    setErrors({})
    onSubmit(payload as ClientFormData)
  }

  if (step === 1)
    return (
      <div>
        <StepIndicator current={1} onStepClick={setStep} />
        <div className="flex flex-col gap-3 mt-3">
          <fieldset className="fieldset gap-1">
            <label htmlFor="razaoSocial" className="label text-xs font-medium text-base-content/60">
              Razão Social *
            </label>
            <input
              id="razaoSocial"
              type="text"
              className={`input input-bordered w-full ${errors.razaoSocial ? 'input-error' : ''}`}
              value={s1.razaoSocial}
              onChange={(e) => set1('razaoSocial', e.target.value)}
            />
            {errors.razaoSocial && <span className="text-error text-xs">{errors.razaoSocial}</span>}
          </fieldset>

          <fieldset className="fieldset gap-1">
            <label htmlFor="cnpj" className="label text-xs font-medium text-base-content/60">
              CNPJ *
            </label>
            <input
              id="cnpj"
              type="text"
              className={`input input-bordered w-full ${errors.cnpj ? 'input-error' : ''}`}
              placeholder="00.000.000/0000-00"
              value={s1.cnpj}
              onChange={(e) => set1('cnpj', e.target.value)}
            />
            {errors.cnpj && <span className="text-error text-xs">{errors.cnpj}</span>}
          </fieldset>

          <fieldset className="fieldset gap-1">
            <label htmlFor="segmento" className="label text-xs font-medium text-base-content/60">
              Segmento *
            </label>
            <select
              id="segmento"
              className={`select select-bordered w-full ${errors.segmento ? 'select-error' : ''}`}
              value={s1.segmento}
              onChange={(e) => set1('segmento', e.target.value)}
            >
              <option value="">Selecione...</option>
              {SEGMENTOS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            {errors.segmento && <span className="text-error text-xs">{errors.segmento}</span>}
          </fieldset>

          <fieldset className="fieldset gap-1">
            <label htmlFor="status" className="label text-xs font-medium text-base-content/60">
              Status *
            </label>
            <select
              id="status"
              className="select select-bordered w-full"
              value={s1.status}
              onChange={(e) => set1('status', e.target.value)}
            >
              <option value="active">Ativo</option>
              <option value="inactive">Inativo</option>
            </select>
          </fieldset>

          <fieldset className="fieldset gap-1">
            <label htmlFor="email" className="label text-xs font-medium text-base-content/60">
              E-mail *
            </label>
            <input
              id="email"
              type="email"
              className={`input input-bordered w-full ${errors.email ? 'input-error' : ''}`}
              value={s1.email}
              onChange={(e) => set1('email', e.target.value)}
            />
            {errors.email && <span className="text-error text-xs">{errors.email}</span>}
          </fieldset>

          <fieldset className="fieldset gap-1">
            <label htmlFor="telefone" className="label text-xs font-medium text-base-content/60">
              Telefone
            </label>
            <input
              id="telefone"
              type="text"
              className="input input-bordered w-full"
              placeholder="(00) 0000-0000"
              value={s1.telefone}
              onChange={(e) => set1('telefone', e.target.value)}
            />
          </fieldset>

          <fieldset className="fieldset gap-1">
            <label htmlFor="celular" className="label text-xs font-medium text-base-content/60">
              Celular
            </label>
            <input
              id="celular"
              type="text"
              className="input input-bordered w-full"
              placeholder="(00) 00000-0000"
              value={s1.celular}
              onChange={(e) => set1('celular', e.target.value)}
            />
          </fieldset>
        </div>

        <div className="sticky bottom-0 mt-4 py-4 bg-base-200 border-t border-base-300 flex justify-end">
          <button type="button" className="btn btn-primary" onClick={goNext}>
            Próximo
          </button>
        </div>
      </div>
    )

  return (
    <div>
      <StepIndicator current={2} onStepClick={setStep} />
      <div className="flex flex-col gap-3 mt-3">
        <div className="grid grid-cols-3 gap-3">
          <fieldset className="fieldset gap-1">
            <label htmlFor="cep" className="label text-xs font-medium text-base-content/60">
              CEP
            </label>
            <input
              id="cep"
              type="text"
              className={`input input-bordered w-full ${errors.cep ? 'input-error' : ''}`}
              placeholder="00000-000"
              value={s2.cep}
              onChange={(e) => set2('cep', e.target.value)}
            />
            {errors.cep && <span className="text-error text-xs">{errors.cep}</span>}
          </fieldset>

          <fieldset className="fieldset gap-1 col-span-2">
            <label htmlFor="logradouro" className="label text-xs font-medium text-base-content/60">
              Logradouro *
            </label>
            <input
              id="logradouro"
              type="text"
              className={`input input-bordered w-full ${errors.logradouro ? 'input-error' : ''}`}
              value={s2.logradouro}
              onChange={(e) => set2('logradouro', e.target.value)}
            />
            {errors.logradouro && <span className="text-error text-xs">{errors.logradouro}</span>}
          </fieldset>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <fieldset className="fieldset gap-1">
            <label htmlFor="numero" className="label text-xs font-medium text-base-content/60">
              Número *
            </label>
            <input
              id="numero"
              type="text"
              className={`input input-bordered w-full ${errors.numero ? 'input-error' : ''}`}
              value={s2.numero}
              onChange={(e) => set2('numero', e.target.value)}
            />
            {errors.numero && <span className="text-error text-xs">{errors.numero}</span>}
          </fieldset>

          <fieldset className="fieldset gap-1">
            <label htmlFor="complemento" className="label text-xs font-medium text-base-content/60">
              Complemento
            </label>
            <input
              id="complemento"
              type="text"
              className="input input-bordered w-full"
              value={s2.complemento}
              onChange={(e) => set2('complemento', e.target.value)}
            />
          </fieldset>

          <fieldset className="fieldset gap-1">
            <label htmlFor="bairro" className="label text-xs font-medium text-base-content/60">
              Bairro *
            </label>
            <input
              id="bairro"
              type="text"
              className={`input input-bordered w-full ${errors.bairro ? 'input-error' : ''}`}
              value={s2.bairro}
              onChange={(e) => set2('bairro', e.target.value)}
            />
            {errors.bairro && <span className="text-error text-xs">{errors.bairro}</span>}
          </fieldset>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <fieldset className="fieldset gap-1 col-span-2">
            <label htmlFor="cidade" className="label text-xs font-medium text-base-content/60">
              Cidade *
            </label>
            <input
              id="cidade"
              type="text"
              className={`input input-bordered w-full ${errors.cidade ? 'input-error' : ''}`}
              value={s2.cidade}
              onChange={(e) => set2('cidade', e.target.value)}
            />
            {errors.cidade && <span className="text-error text-xs">{errors.cidade}</span>}
          </fieldset>

          <fieldset className="fieldset gap-1">
            <label htmlFor="estado" className="label text-xs font-medium text-base-content/60">
              Estado *
            </label>
            <input
              id="estado"
              type="text"
              maxLength={2}
              className={`input input-bordered w-full ${errors.estado ? 'input-error' : ''}`}
              placeholder="UF"
              value={s2.estado}
              onChange={(e) => set2('estado', e.target.value)}
            />
            {errors.estado && <span className="text-error text-xs">{errors.estado}</span>}
          </fieldset>
        </div>
      </div>

      <div className="sticky bottom-0 mt-4 py-4 bg-base-200 border-t border-base-300 flex justify-end gap-3">
        <button type="button" className="btn btn-ghost" onClick={() => setStep(1)}>
          Voltar
        </button>
        <button type="button" className="btn btn-primary" onClick={handleSubmit} disabled={loading}>
          {loading ? <span className="loading loading-spinner loading-sm" /> : 'Salvar'}
        </button>
      </div>
    </div>
  )
}

function StepIndicator({
  current,
  onStepClick,
}: {
  current: number
  onStepClick: (step: number) => void
}) {
  const steps = ['Dados Cadastrais', 'Endereço']
  return (
    <ul className="steps steps-horizontal w-full">
      {steps.map((label, i) => {
        const stepNum = i + 1
        const isCompleted = stepNum < current
        return (
          <li
            key={label}
            data-testid={`step-indicator-${stepNum}`}
            className={`step ${stepNum <= current ? 'step-primary' : ''} ${isCompleted ? 'cursor-pointer' : 'cursor-default'}`}
            onClick={() => isCompleted && onStepClick(stepNum)}
            role={isCompleted ? 'button' : undefined}
            tabIndex={isCompleted ? 0 : undefined}
            onKeyDown={(e) => isCompleted && e.key === 'Enter' && onStepClick(stepNum)}
          >
            <span className="hidden sm:inline">{label}</span>
          </li>
        )
      })}
    </ul>
  )
}
