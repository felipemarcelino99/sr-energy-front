import { useState } from 'react'
import { toolSchema, type ToolFormData } from '@/models/tool.model'

interface ToolFormProps {
  initialData?: Partial<ToolFormData>
  onSubmit: (data: ToolFormData) => Promise<void>
  onCancel?: () => void
  loading?: boolean
  isEditing?: boolean
  formId?: string
  hideButtons?: boolean
}

export function ToolForm({ initialData, onSubmit, onCancel, loading = false, isEditing = false, formId, hideButtons = false }: ToolFormProps) {
  const [form, setForm] = useState<ToolFormData>({
    name: initialData?.name ?? '',
    description: initialData?.description ?? '',
    quantity: initialData?.quantity ?? 0,
    status: initialData?.status ?? 'active',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  function set_<K extends keyof ToolFormData>(field: K, value: ToolFormData[K]) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const parsed = toolSchema.safeParse(form)
    if (!parsed.success) {
      const errs: Record<string, string> = {}
      for (const issue of parsed.error.issues) errs[String(issue.path[0])] = issue.message
      setErrors(errs)
      return
    }
    setErrors({})
    await onSubmit(parsed.data)
  }

  return (
    <form id={formId} onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      <fieldset className="fieldset gap-1">
        <label className="label text-xs font-medium text-base-content/60" htmlFor="name">
          Nome
        </label>
        <input
          id="name"
          type="text"
          className={`input input-bordered w-full ${errors.name ? 'input-error' : ''}`}
          value={form.name}
          onChange={(e) => set_('name', e.target.value)}
        />
        {errors.name && <p data-testid="error-name" className="text-error text-xs">{errors.name}</p>}
      </fieldset>

      <fieldset className="fieldset gap-1">
        <label className="label text-xs font-medium text-base-content/60" htmlFor="description">
          Descrição <span className="text-base-content/30">(opcional)</span>
        </label>
        <textarea
          id="description"
          className="textarea textarea-bordered w-full"
          rows={3}
          value={form.description ?? ''}
          onChange={(e) => set_('description', e.target.value)}
        />
      </fieldset>

      <fieldset className="fieldset gap-1">
        <label className="label text-xs font-medium text-base-content/60" htmlFor="quantity">
          Quantidade
        </label>
        <input
          id="quantity"
          type="number"
          min={0}
          className={`input input-bordered w-full ${errors.quantity ? 'input-error' : ''}`}
          value={form.quantity}
          onChange={(e) => set_('quantity', Number(e.target.value))}
        />
        {errors.quantity && <p data-testid="error-quantity" className="text-error text-xs">{errors.quantity}</p>}
      </fieldset>

      {isEditing && (
        <fieldset className="fieldset gap-1">
          <label className="label text-xs font-medium text-base-content/60" htmlFor="status">
            Status
          </label>
          <select
            id="status"
            className="select select-bordered w-full"
            value={form.status}
            onChange={(e) => set_('status', e.target.value as 'active' | 'inactive')}
          >
            <option value="active">Ativo</option>
            <option value="inactive">Inativo</option>
          </select>
        </fieldset>
      )}

      {!hideButtons && (
        <div className="flex gap-2 mt-2">
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? <span className="loading loading-spinner loading-sm" /> : 'Salvar'}
          </button>
          {onCancel && (
            <button type="button" className="btn btn-ghost" onClick={onCancel}>
              Cancelar
            </button>
          )}
        </div>
      )}
    </form>
  )
}
