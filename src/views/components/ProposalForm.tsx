import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { proposalSchema } from '@/models/proposal.model'
import type { ProposalFormData } from '@/models/proposal.model'
import { ClientSearchSelect } from '@/views/components/ClientSearchSelect'
import { FormGrid } from '@/views/components/ui/FormGrid'
import { fetchContractsByClient } from '@/services/contract.service'

interface ProposalFormProps {
  initialData?: Partial<ProposalFormData>
  onSubmit: (data: ProposalFormData) => Promise<void>
  loading?: boolean
  formId?: string
  hideButtons?: boolean
}

export function ProposalForm({
  initialData,
  onSubmit,
  loading = false,
  formId,
  hideButtons = false,
}: ProposalFormProps) {
  const [form, setForm] = useState({
    clientId: initialData?.clientId ?? '',
    description: initialData?.description ?? '',
    startDate: initialData?.startDate ?? '',
    recurring: String(initialData?.recurring ?? false),
    contractType: initialData?.contractType ?? 'service',
    contractValue: initialData?.contractValue != null ? String(initialData.contractValue) : '',
    fileUrl: initialData?.fileUrl ?? '',
    contractId: initialData?.contractId ?? '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const contractsQuery = useQuery({
    queryKey: ['contracts', 'byClient', form.clientId],
    queryFn: () => fetchContractsByClient(form.clientId),
    enabled: Boolean(form.clientId),
  })

  function set_(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function handleClientChange(clientId: string) {
    // Trocar o cliente invalida qualquer contrato vinculado selecionado anteriormente.
    setForm((prev) => ({ ...prev, clientId, contractId: '' }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const result = proposalSchema.safeParse({
      ...form,
      recurring: form.recurring === 'true',
      contractValue: Number(form.contractValue),
      startDate: form.startDate || undefined,
      contractId: form.contractId || undefined,
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
    await onSubmit(result.data)
  }

  return (
    <form id={formId} onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      <fieldset className="fieldset gap-1">
        <label className="label text-xs font-medium text-base-content/60" htmlFor="clientId">
          Cliente
        </label>
        <ClientSearchSelect
          value={form.clientId}
          onChange={handleClientChange}
          error={errors.clientId}
        />
        {errors.clientId && (
          <p data-testid="error-clientId" className="text-error text-xs">
            {errors.clientId}
          </p>
        )}
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
        {errors.description && (
          <p data-testid="error-description" className="text-error text-xs">
            {errors.description}
          </p>
        )}
      </fieldset>

      <FormGrid>
        <fieldset className="fieldset gap-1">
          <label className="label text-xs font-medium text-base-content/60" htmlFor="startDate">
            Data de Início <span className="text-base-content/30">(opcional)</span>
          </label>
          <input
            id="startDate"
            type="date"
            className={`input input-bordered w-full ${errors.startDate ? 'input-error' : ''}`}
            value={form.startDate}
            onChange={(e) => set_('startDate', e.target.value)}
          />
          {errors.startDate && (
            <p data-testid="error-startDate" className="text-error text-xs">
              {errors.startDate}
            </p>
          )}
        </fieldset>

        <fieldset className="fieldset gap-1">
          <label className="label text-xs font-medium text-base-content/60" htmlFor="contractId">
            Contrato vinculado <span className="text-base-content/30">(opcional)</span>
          </label>
          <select
            id="contractId"
            className={`select select-bordered w-full ${errors.contractId ? 'select-error' : ''}`}
            value={form.contractId}
            onChange={(e) => set_('contractId', e.target.value)}
            disabled={!form.clientId}
          >
            <option value="">Nenhum</option>
            {(contractsQuery.data ?? []).map((c) => (
              <option key={c.id} value={c.id}>
                {c.number ? `${c.number} — ${c.description}` : c.description}
              </option>
            ))}
          </select>
          {errors.contractId && (
            <p data-testid="error-contractId" className="text-error text-xs">
              {errors.contractId}
            </p>
          )}
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
          {errors.contractType && (
            <p data-testid="error-contractType" className="text-error text-xs">
              {errors.contractType}
            </p>
          )}
        </fieldset>

        <fieldset className="fieldset gap-1">
          <label className="label text-xs font-medium text-base-content/60" htmlFor="contractValue">
            Valor da Proposta (R$)
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
          {errors.contractValue && (
            <p data-testid="error-contractValue" className="text-error text-xs">
              {errors.contractValue}
            </p>
          )}
        </fieldset>
      </FormGrid>

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
        <label className="label text-xs font-medium text-base-content/60" htmlFor="fileUrl">
          Link do arquivo <span className="text-base-content/30">(opcional)</span>
        </label>
        <input
          id="fileUrl"
          type="text"
          placeholder="https://..."
          className="input input-bordered w-full"
          value={form.fileUrl}
          onChange={(e) => set_('fileUrl', e.target.value)}
        />
      </fieldset>

      {!hideButtons && (
        <button type="submit" className="btn btn-primary mt-2" disabled={loading}>
          {loading ? <span className="loading loading-spinner loading-sm" /> : 'Salvar'}
        </button>
      )}
    </form>
  )
}
