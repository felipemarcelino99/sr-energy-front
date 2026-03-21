import { useState } from 'react'
import { salaryAdjustmentSchema, type SalaryAdjustmentFormData } from '@/models/salary-adjustment.model'

function formatCurrency(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

interface SalaryAdjustmentFormProps {
  currentSalary: number
  onSubmit: (data: SalaryAdjustmentFormData) => Promise<void>
  loading?: boolean
}

export function SalaryAdjustmentForm({ currentSalary, onSubmit, loading = false }: SalaryAdjustmentFormProps) {
  const [newSalary, setNewSalary] = useState('')
  const [reason, setReason] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  const parsedNew = Number(newSalary)
  const hasValue = newSalary !== '' && !isNaN(parsedNew)
  const diff = hasValue ? parsedNew - currentSalary : null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const result = salaryAdjustmentSchema.safeParse({ newSalary, reason })
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
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      <div className="flex items-center gap-4 p-3 bg-base-200 rounded-lg">
        <div className="flex flex-col">
          <span className="text-xs text-base-content/40">Salário Atual</span>
          <span className="font-semibold">{formatCurrency(currentSalary)}</span>
        </div>

        {diff !== null && (
          <div data-testid="salary-diff" className={`flex flex-col ml-auto ${diff >= 0 ? 'text-success' : 'text-error'}`}>
            <span className="text-xs text-base-content/40">Diferença</span>
            <span className="font-semibold">
              {diff >= 0 ? '+' : ''}{formatCurrency(diff)}
            </span>
          </div>
        )}
      </div>

      <fieldset className="fieldset gap-1">
        <label className="label text-xs font-medium text-base-content/60" htmlFor="newSalary">
          Novo Salário (R$)
        </label>
        <input
          id="newSalary"
          type="number"
          min="0"
          step="0.01"
          className={`input input-bordered w-full ${errors.newSalary ? 'input-error' : ''}`}
          value={newSalary}
          onChange={(e) => setNewSalary(e.target.value)}
        />
        {errors.newSalary && (
          <p data-testid="error-newSalary" className="text-error text-xs">{errors.newSalary}</p>
        )}
      </fieldset>

      <fieldset className="fieldset gap-1">
        <label className="label text-xs font-medium text-base-content/60" htmlFor="reason">
          Motivo
        </label>
        <textarea
          id="reason"
          className={`textarea textarea-bordered w-full ${errors.reason ? 'textarea-error' : ''}`}
          rows={3}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
        {errors.reason && (
          <p data-testid="error-reason" className="text-error text-xs">{errors.reason}</p>
        )}
      </fieldset>

      <button type="submit" className="btn btn-primary" disabled={loading}>
        {loading ? <span className="loading loading-spinner loading-sm" /> : 'Registrar Reajuste'}
      </button>
    </form>
  )
}
