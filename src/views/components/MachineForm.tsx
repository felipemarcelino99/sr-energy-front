import { useState } from 'react'
import { machineSchema } from '@/models/machine.model'
import type { MachineFormData } from '@/models/machine.model'

interface MachineFormProps {
  initialData?: Partial<MachineFormData>
  onSubmit: (data: MachineFormData, manualFile?: File) => Promise<void>
  loading?: boolean
  formId?: string
  hideButtons?: boolean
}

export function MachineForm({ initialData, onSubmit, loading = false, formId, hideButtons = false }: MachineFormProps) {
  const [form, setForm] = useState({
    name: initialData?.name ?? '',
    brand: initialData?.brand ?? '',
    model: initialData?.model ?? '',
    serialNumber: initialData?.serialNumber ?? '',
    year: initialData?.year != null ? String(initialData.year) : '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [manualFile, setManualFile] = useState<File | undefined>(undefined)

  function set_(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const result = machineSchema.safeParse({ ...form })
    if (!result.success) {
      const errs: Record<string, string> = {}
      for (const issue of result.error.issues) {
        errs[String(issue.path[0])] = issue.message
      }
      setErrors(errs)
      return
    }
    setErrors({})
    await onSubmit(result.data, manualFile)
  }

  return (
    <form id={formId} onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      {/* Name */}
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
        {errors.name && (
          <p data-testid="error-name" className="text-error text-xs">
            {errors.name}
          </p>
        )}
      </fieldset>

      {/* Brand */}
      <fieldset className="fieldset gap-1">
        <label className="label text-xs font-medium text-base-content/60" htmlFor="brand">
          Marca
        </label>
        <input
          id="brand"
          type="text"
          className={`input input-bordered w-full ${errors.brand ? 'input-error' : ''}`}
          value={form.brand}
          onChange={(e) => set_('brand', e.target.value)}
        />
        {errors.brand && (
          <p data-testid="error-brand" className="text-error text-xs">
            {errors.brand}
          </p>
        )}
      </fieldset>

      {/* Model */}
      <fieldset className="fieldset gap-1">
        <label className="label text-xs font-medium text-base-content/60" htmlFor="model">
          Modelo
        </label>
        <input
          id="model"
          type="text"
          className={`input input-bordered w-full ${errors.model ? 'input-error' : ''}`}
          value={form.model}
          onChange={(e) => set_('model', e.target.value)}
        />
        {errors.model && (
          <p data-testid="error-model" className="text-error text-xs">
            {errors.model}
          </p>
        )}
      </fieldset>

      {/* Serial Number */}
      <fieldset className="fieldset gap-1">
        <label className="label text-xs font-medium text-base-content/60" htmlFor="serialNumber">
          Número de Série
        </label>
        <input
          id="serialNumber"
          type="text"
          className={`input input-bordered w-full ${errors.serialNumber ? 'input-error' : ''}`}
          value={form.serialNumber}
          onChange={(e) => set_('serialNumber', e.target.value)}
        />
        {errors.serialNumber && (
          <p data-testid="error-serialNumber" className="text-error text-xs">
            {errors.serialNumber}
          </p>
        )}
      </fieldset>

      {/* Year */}
      <fieldset className="fieldset gap-1">
        <label className="label text-xs font-medium text-base-content/60" htmlFor="year">
          Ano de Fabricação
        </label>
        <input
          id="year"
          type="number"
          min="1900"
          className={`input input-bordered w-full ${errors.year ? 'input-error' : ''}`}
          value={form.year}
          onChange={(e) => set_('year', e.target.value)}
        />
        {errors.year && (
          <p data-testid="error-year" className="text-error text-xs">
            {errors.year}
          </p>
        )}
      </fieldset>

      {/* Manual PDF */}
      <fieldset className="fieldset gap-1">
        <label className="label text-xs font-medium text-base-content/60" htmlFor="manual">
          Manual (PDF)
        </label>
        <input
          id="manual"
          type="file"
          accept="application/pdf"
          className="file-input file-input-bordered w-full"
          onChange={(e) => setManualFile(e.target.files?.[0])}
        />
        {manualFile && (
          <p data-testid="file-preview" className="text-xs text-base-content/60 mt-1">
            {manualFile.name}
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
