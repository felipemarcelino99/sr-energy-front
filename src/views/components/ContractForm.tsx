import { useState } from 'react'
import { contractSchema } from '@/models/contract.model'
import type { ContractFormData } from '@/models/contract.model'
import { ClientSearchSelect } from '@/views/components/ClientSearchSelect'

interface ContractFormProps {
  initialData?: Partial<ContractFormData>
  onSubmit: (data: ContractFormData, file?: File) => Promise<void>
  loading?: boolean
  formId?: string
  hideButtons?: boolean
}

export function ContractForm({ initialData, onSubmit, loading = false, formId, hideButtons = false }: ContractFormProps) {
  const [form, setForm] = useState({
    clientId: initialData?.clientId ?? '',
    description: initialData?.description ?? '',
    startDate: initialData?.startDate ?? '',
    endDate: initialData?.endDate ?? '',
    recurring: String(initialData?.recurring ?? false),
    contractType: initialData?.contractType ?? 'service',
    contractValue: initialData?.contractValue != null ? String(initialData.contractValue) : '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [contractFile, setContractFile] = useState<File | undefined>(undefined)

  function set_(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const result = contractSchema.safeParse({
      ...form,
      recurring: form.recurring === 'true',
      contractValue: Number(form.contractValue),
    })
    if (!result.success) {
      const errs: Record<string, string> = {}
      for (const issue of result.error.issues) {
        errs[String(issue.path[0])] = issue.message
      }
      setErrors(errs)
      return
    }
    setErrors({})
    await onSubmit(result.data, contractFile)
  }

  return (
    <form id={formId} onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      <fieldset className="fieldset gap-1">
        <label className="label text-xs font-medium text-base-content/60" htmlFor="clientId">
          Cliente
        </label>
        <ClientSearchSelect
          value={form.clientId}
          onChange={(id) => set_('clientId', id)}
          error={errors.clientId}
        />
        {errors.clientId && <p data-testid="error-clientId" className="text-error text-xs">{errors.clientId}</p>}
      </fieldset>

      <fieldset className="fieldset gap-1">
        <label className="label text-xs font-medium text-base-content/60" htmlFor="description">
          Descrição
        </label>
        <textarea
          id="description"
          className={`textarea textarea-bordered w-full ${errors.description ? 'textarea-error' : ''}`}
          rows={3}
          value={form.description}
          onChange={(e) => set_('description', e.target.value)}
        />
        {errors.description && <p data-testid="error-description" className="text-error text-xs">{errors.description}</p>}
      </fieldset>

      <fieldset className="fieldset gap-1">
        <label className="label text-xs font-medium text-base-content/60" htmlFor="startDate">
          Data de Início
        </label>
        <input
          id="startDate"
          type="date"
          className={`input input-bordered w-full ${errors.startDate ? 'input-error' : ''}`}
          value={form.startDate}
          onChange={(e) => set_('startDate', e.target.value)}
        />
        {errors.startDate && <p data-testid="error-startDate" className="text-error text-xs">{errors.startDate}</p>}
      </fieldset>

      <fieldset className="fieldset gap-1">
        <label className="label text-xs font-medium text-base-content/60" htmlFor="endDate">
          Data de Término
        </label>
        <input
          id="endDate"
          type="date"
          className={`input input-bordered w-full ${errors.endDate ? 'input-error' : ''}`}
          value={form.endDate}
          onChange={(e) => set_('endDate', e.target.value)}
        />
        {errors.endDate && <p data-testid="error-endDate" className="text-error text-xs">{errors.endDate}</p>}
      </fieldset>

      <fieldset className="fieldset gap-1">
        <label className="label text-xs font-medium text-base-content/60" htmlFor="contractType">
          Tipo
        </label>
        <select
          id="contractType"
          className={`select select-bordered w-full ${errors.contractType ? 'select-error' : ''}`}
          value={form.contractType}
          onChange={(e) => set_('contractType', e.target.value)}
        >
          <option value="service">Serviço</option>
          <option value="rental">Locação</option>
        </select>
        {errors.contractType && <p data-testid="error-contractType" className="text-error text-xs">{errors.contractType}</p>}
      </fieldset>

      <fieldset className="fieldset gap-1">
        <label className="label text-xs font-medium text-base-content/60" htmlFor="contractValue">
          Valor do Contrato (R$)
        </label>
        <input
          id="contractValue"
          type="number"
          min="0"
          step="0.01"
          className={`input input-bordered w-full ${errors.contractValue ? 'input-error' : ''}`}
          value={form.contractValue}
          onChange={(e) => set_('contractValue', e.target.value)}
        />
        {errors.contractValue && <p data-testid="error-contractValue" className="text-error text-xs">{errors.contractValue}</p>}
      </fieldset>

      <fieldset className="fieldset gap-1">
        <label className="label text-xs font-medium text-base-content/60" htmlFor="recurring">
          Recorrente
        </label>
        <select
          id="recurring"
          className="select select-bordered w-full"
          value={form.recurring}
          onChange={(e) => set_('recurring', e.target.value)}
        >
          <option value="false">Não recorrente</option>
          <option value="true">Recorrente</option>
        </select>
      </fieldset>

      <fieldset className="fieldset gap-1">
        <label className="label text-xs font-medium text-base-content/60" htmlFor="contractFile">
          Contrato PDF <span className="text-base-content/30">(opcional)</span>
        </label>
        <input
          id="contractFile"
          type="file"
          accept=".pdf"
          className="file-input file-input-bordered w-full"
          onChange={(e) => setContractFile(e.target.files?.[0])}
        />
        {contractFile && (
          <p data-testid="file-preview" className="text-xs text-base-content/60 mt-1">
            {contractFile.name}
          </p>
        )}
      </fieldset>

      {!hideButtons && (
        <button type="submit" className="btn btn-primary mt-2" disabled={loading}>
          {loading ? <span className="loading loading-spinner loading-sm" /> : 'Salvar'}
        </button>
      )}
    </form>
  )
}
