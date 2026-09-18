import { useEffect, useState } from 'react'
import { Copy, RefreshCw } from 'lucide-react'
import type { EmployeeFormData, EmployeeRole } from '@/models/employee.model'
import { employeeSchema, employeeCreateSchema } from '@/models/employee.model'
import { FormGrid } from '@/views/components/ui/FormGrid'
import { generatePassword } from '@/utils/password'
import { toast } from '@/viewmodels/toast.viewmodel'
import { formatCPF } from '@/utils/cpf'
import { EMPLOYEE_COLOR_PALETTE } from '@/utils/employee-color'
import { EmployeeAvatar } from '@/views/components/EmployeeAvatar'

const MAX_PHOTO_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_PHOTO_TYPES = ['image/jpeg', 'image/png']

interface EmployeeFormProps {
  initialData?: Partial<EmployeeFormData>
  // Sub-plano 05: na criação, o id do funcionário só existe depois do
  // onSubmit resolver — quem chama decide quando/como enviar a foto
  // (ver EmployeeFormPage.handleSubmit + uploadEmployeePhoto).
  initialPhotoUrl?: string | null
  onSubmit: (data: EmployeeFormData & { password?: string }, photoFile?: File) => Promise<void>
  loading?: boolean
  formId?: string
  hideButtons?: boolean
  isEditing?: boolean
}

export function EmployeeForm({
  initialData,
  initialPhotoUrl,
  onSubmit,
  loading = false,
  formId,
  hideButtons = false,
  isEditing = false,
}: EmployeeFormProps) {
  const [form, setForm] = useState({
    name: initialData?.name ?? '',
    email: initialData?.email ?? '',
    phone: initialData?.phone ?? '',
    role: (initialData?.role ?? 'employee') as EmployeeRole,
    cpf: initialData?.cpf ?? '',
    color: initialData?.color ?? EMPLOYEE_COLOR_PALETTE[0],
    salary: initialData?.salary != null ? String(initialData.salary) : '',
    hiredAt: initialData?.hiredAt ?? '',
    password: isEditing ? '' : generatePassword(),
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [photoFile, setPhotoFile] = useState<File | undefined>(undefined)
  const [photoPreview, setPhotoPreview] = useState<string | null>(initialPhotoUrl ?? null)
  const [photoError, setPhotoError] = useState<string | null>(null)

  // Object URLs created for the local preview must be released, otherwise
  // they leak for the lifetime of the tab.
  useEffect(() => {
    return () => {
      if (photoFile && photoPreview) URL.revokeObjectURL(photoPreview)
    }
  }, [photoFile, photoPreview])

  function set_(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function regeneratePassword() {
    set_('password', generatePassword())
  }

  async function copyPassword() {
    try {
      await navigator.clipboard.writeText(form.password)
      toast.success('Senha copiada.')
    } catch {
      toast.error('Não foi possível copiar a senha.')
    }
  }

  function handleCpfChange(value: string) {
    set_('cpf', formatCPF(value))
  }

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!ALLOWED_PHOTO_TYPES.includes(file.type)) {
      setPhotoError('Envie uma imagem JPEG ou PNG.')
      e.target.value = ''
      return
    }
    if (file.size > MAX_PHOTO_SIZE) {
      setPhotoError('A imagem deve ter no máximo 5MB.')
      e.target.value = ''
      return
    }
    setPhotoError(null)
    setPhotoFile(file)
    setPhotoPreview(URL.createObjectURL(file))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const schema = isEditing ? employeeSchema : employeeCreateSchema
    const result = schema.safeParse(form)
    if (!result.success) {
      const errs: Record<string, string> = {}
      for (const issue of result.error.issues) {
        errs[String(issue.path[0])] = issue.message
      }
      setErrors(errs)
      return
    }
    setErrors({})
    await onSubmit(result.data, photoFile)
  }

  return (
    <form id={formId} onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      <FormGrid>
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
          {errors.email && (
            <p data-testid="error-email" className="text-error text-xs">
              {errors.email}
            </p>
          )}
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
          {errors.phone && (
            <p data-testid="error-phone" className="text-error text-xs">
              {errors.phone}
            </p>
          )}
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

        {/* CPF (optional) */}
        <fieldset className="fieldset gap-1">
          <label className="label text-xs font-medium text-base-content/60" htmlFor="cpf">
            CPF <span className="text-base-content/30">(opcional)</span>
          </label>
          <input
            id="cpf"
            type="text"
            placeholder="000.000.000-00"
            className={`input input-bordered w-full ${errors.cpf ? 'input-error' : ''}`}
            value={form.cpf}
            onChange={(e) => handleCpfChange(e.target.value)}
          />
          {errors.cpf && (
            <p data-testid="error-cpf" className="text-error text-xs">
              {errors.cpf}
            </p>
          )}
        </fieldset>

        {/* Color (used to identify the employee in the OS calendar) */}
        <fieldset className="fieldset gap-1">
          <label className="label text-xs font-medium text-base-content/60" htmlFor="color">
            Cor de identificação
          </label>
          <div className="flex items-center gap-2 flex-wrap">
            <input
              id="color"
              type="color"
              className="w-10 h-10 rounded cursor-pointer border border-base-300 bg-transparent p-0"
              value={form.color}
              onChange={(e) => set_('color', e.target.value)}
            />
            <div className="flex gap-1 flex-wrap">
              {EMPLOYEE_COLOR_PALETTE.map((c) => (
                <button
                  key={c}
                  type="button"
                  aria-label={`Usar cor ${c}`}
                  className={`w-6 h-6 rounded-full shrink-0 ${form.color === c ? 'ring-2 ring-offset-2 ring-base-content/60' : ''}`}
                  style={{ backgroundColor: c }}
                  onClick={() => set_('color', c)}
                />
              ))}
            </div>
          </div>
          {errors.color && (
            <p data-testid="error-color" className="text-error text-xs">
              {errors.color}
            </p>
          )}
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
          {errors.salary && (
            <p data-testid="error-salary" className="text-error text-xs">
              {errors.salary}
            </p>
          )}
        </fieldset>
      </FormGrid>

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
        {errors.hiredAt && (
          <p data-testid="error-hiredAt" className="text-error text-xs">
            {errors.hiredAt}
          </p>
        )}
      </fieldset>

      {/* Photo */}
      <fieldset className="fieldset gap-1">
        <label className="label text-xs font-medium text-base-content/60" htmlFor="photo">
          Foto <span className="text-base-content/30">(opcional, JPEG ou PNG, até 5MB)</span>
        </label>
        <div className="flex items-center gap-3">
          {/* Decorative live preview — redundant with the "Nome" field above
              and the selected file name below; aria-hidden avoids colliding
              with getByLabelText(/nome/i) queries and screen-reader noise. */}
          <div aria-hidden="true">
            <EmployeeAvatar name={form.name} photoUrl={photoPreview} color={form.color} size="lg" />
          </div>
          <input
            id="photo"
            type="file"
            accept="image/jpeg,image/png"
            className="file-input file-input-bordered w-full"
            onChange={handlePhotoChange}
          />
        </div>
        {photoError && (
          <p data-testid="error-photo" className="text-error text-xs">
            {photoError}
          </p>
        )}
      </fieldset>

      {/* Temporary password (creation only) */}
      {!isEditing && (
        <fieldset className="fieldset gap-1">
          <label className="label text-xs font-medium text-base-content/60" htmlFor="password">
            Senha temporária <span className="text-base-content/30">(entregue ao funcionário)</span>
          </label>
          <div className="flex gap-2">
            <input
              id="password"
              type="text"
              readOnly
              className={`input input-bordered w-full font-mono ${errors.password ? 'input-error' : ''}`}
              value={form.password}
            />
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={regeneratePassword}
              title="Gerar nova senha"
            >
              <RefreshCw size={14} />
            </button>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={copyPassword}
              title="Copiar senha"
            >
              <Copy size={14} />
            </button>
          </div>
          <p className="text-xs text-base-content/40">
            O funcionário será obrigado a trocar essa senha no primeiro login.
          </p>
          {errors.password && (
            <p data-testid="error-password" className="text-error text-xs">
              {errors.password}
            </p>
          )}
        </fieldset>
      )}

      {!hideButtons && (
        <button type="submit" className="btn btn-primary mt-2" disabled={loading}>
          {loading ? <span className="loading loading-spinner loading-sm" /> : 'Salvar'}
        </button>
      )}
    </form>
  )
}
