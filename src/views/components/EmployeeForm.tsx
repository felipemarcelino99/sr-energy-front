import { useState } from 'react'
import type { EmployeeFormData, EmployeeRole } from '@/models/employee.model'
import { employeeSchema } from '@/models/employee.model'

interface EmployeeFormProps {
  initialData?: Partial<EmployeeFormData>
  onSubmit: (data: EmployeeFormData) => Promise<void>
  loading?: boolean
  formId?: string
  hideButtons?: boolean
}

export function EmployeeForm({ initialData, onSubmit, loading = false, formId, hideButtons = false }: EmployeeFormProps) {
  const [form, setForm] = useState({
    name: initialData?.name ?? '',
    email: initialData?.email ?? '',
    phone: initialData?.phone ?? '',
    role: (initialData?.role ?? 'employee') as EmployeeRole,
    cnpj: initialData?.cnpj ?? '',
    salary: initialData?.salary != null ? String(initialData.salary) : '',
    hiredAt: initialData?.hiredAt ?? '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  function set_(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const result = employeeSchema.safeParse({ ...form })
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
        {errors.name && <p data-testid="error-name" className="text-error text-xs">{errors.name}</p>}
      </fieldset>

      {/* Email */}
      <fieldset className="fieldset gap-1">
        <label className="label text-xs font-medium text-base-content/60" htmlFor="email">
          E-mail
        </label>
        <input
          id="email"
          type="email"
          className={`input input-bordered w-full ${errors.email ? 'input-error' : ''}`}
          value={form.email}
          onChange={(e) => set_('email', e.target.value)}
        />
        {errors.email && <p data-testid="error-email" className="text-error text-xs">{errors.email}</p>}
      </fieldset>

      {/* Phone */}
      <fieldset className="fieldset gap-1">
        <label className="label text-xs font-medium text-base-content/60" htmlFor="phone">
          Telefone
        </label>
        <input
          id="phone"
          type="tel"
          className={`input input-bordered w-full ${errors.phone ? 'input-error' : ''}`}
          value={form.phone}
          onChange={(e) => set_('phone', e.target.value)}
        />
        {errors.phone && <p data-testid="error-phone" className="text-error text-xs">{errors.phone}</p>}
      </fieldset>

      {/* Role */}
      <fieldset className="fieldset gap-1">
        <label className="label text-xs font-medium text-base-content/60" htmlFor="role">
          Função
        </label>
        <select
          id="role"
          className="select select-bordered w-full"
          value={form.role}
          onChange={(e) => set_('role', e.target.value)}
        >
          <option value="employee">Funcionário</option>
          <option value="manager">Gestor</option>
        </select>
      </fieldset>

      {/* CNPJ (optional) */}
      <fieldset className="fieldset gap-1">
        <label className="label text-xs font-medium text-base-content/60" htmlFor="cnpj">
          CNPJ <span className="text-base-content/30">(opcional)</span>
        </label>
        <input
          id="cnpj"
          type="text"
          placeholder="00.000.000/0000-00"
          className={`input input-bordered w-full ${errors.cnpj ? 'input-error' : ''}`}
          value={form.cnpj}
          onChange={(e) => set_('cnpj', e.target.value)}
        />
        {errors.cnpj && <p data-testid="error-cnpj" className="text-error text-xs">{errors.cnpj}</p>}
      </fieldset>

      {/* Salary */}
      <fieldset className="fieldset gap-1">
        <label className="label text-xs font-medium text-base-content/60" htmlFor="salary">
          Salário (R$)
        </label>
        <input
          id="salary"
          type="number"
          min="0"
          step="0.01"
          className={`input input-bordered w-full ${errors.salary ? 'input-error' : ''}`}
          value={form.salary}
          onChange={(e) => set_('salary', e.target.value)}
        />
        {errors.salary && <p data-testid="error-salary" className="text-error text-xs">{errors.salary}</p>}
      </fieldset>

      {/* Hired at */}
      <fieldset className="fieldset gap-1">
        <label className="label text-xs font-medium text-base-content/60" htmlFor="hiredAt">
          Data de Contratação
        </label>
        <input
          id="hiredAt"
          type="date"
          className={`input input-bordered w-full ${errors.hiredAt ? 'input-error' : ''}`}
          value={form.hiredAt}
          onChange={(e) => set_('hiredAt', e.target.value)}
        />
        {errors.hiredAt && <p data-testid="error-hiredAt" className="text-error text-xs">{errors.hiredAt}</p>}
      </fieldset>

      {!hideButtons && (
        <button type="submit" className="btn btn-primary mt-2" disabled={loading}>
          {loading ? <span className="loading loading-spinner loading-sm" /> : 'Salvar'}
        </button>
      )}
    </form>
  )
}
