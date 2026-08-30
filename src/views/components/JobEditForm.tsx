import { useState, useEffect } from 'react'
import { jobStep1Schema, jobStep2Schema, jobStep3Schema } from '@/models/job.model'
import type { JobFormData, JobType } from '@/models/job.model'
import { useToolStore } from '@/viewmodels/tool.viewmodel'

interface EmployeeOption {
  id: string
  name: string
}
interface MachineOption {
  id: string
  name: string
}
interface BagOption {
  id: string
  name: string
  model: string
}

interface JobEditFormProps {
  formId: string
  initialData: Partial<JobFormData>
  employees: EmployeeOption[]
  machines: MachineOption[]
  bags?: BagOption[]
  onSubmit: (data: JobFormData) => Promise<void>
}

export function JobEditForm({
  formId,
  initialData,
  employees,
  machines,
  bags = [],
  onSubmit,
}: JobEditFormProps) {
  const [form, setForm] = useState<JobFormData>({
    employeeId: initialData.employeeId ?? '',
    scheduledDate: initialData.scheduledDate ?? '',
    city: initialData.city ?? '',
    state: initialData.state ?? '',
    address: initialData.address ?? '',
    accommodation: initialData.accommodation ?? false,
    car: initialData.car ?? false,
    startTime: initialData.startTime ?? '',
    endTime: initialData.endTime ?? '',
    carPickupTime: initialData.carPickupTime ?? '',
    carReturnTime: initialData.carReturnTime ?? '',
    carPickupAddress: initialData.carPickupAddress ?? '',
    machineId: initialData.machineId ?? '',
    jobType: (initialData.jobType ?? 'maintenance') as JobType,
    description: initialData.description ?? '',
    notes: initialData.notes ?? '',
    // ---- Extended fields (OS "esqueleto" vinda de PC aceita pode trazer tudo NULL) ----
    employeeIds: initialData.employeeIds ?? [],
    contractId: initialData.contractId,
    scopeDetail: initialData.scopeDetail ?? '',
    bagId: initialData.bagId ?? '',
    serviceAddress: initialData.serviceAddress ?? '',
    clientContactName: initialData.clientContactName ?? '',
    clientContactPhone: initialData.clientContactPhone ?? '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const { machineTools, fetchMachineTools } = useToolStore()

  function toggleEmployee(id: string) {
    setForm((prev) => {
      const current = prev.employeeIds ?? []
      const next = current.includes(id) ? current.filter((e) => e !== id) : [...current, id]
      return { ...prev, employeeIds: next }
    })
  }

  useEffect(() => {
    if (form.machineId) fetchMachineTools(form.machineId)
  }, [form.machineId, fetchMachineTools])

  function set_<K extends keyof JobFormData>(field: K, value: JobFormData[K]) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const allErrors: Record<string, string> = {}
    const r1 = jobStep1Schema.safeParse(form)
    if (!r1.success) for (const i of r1.error.issues) allErrors[String(i.path[0])] = i.message
    const r2 = jobStep2Schema.safeParse(form)
    if (!r2.success) for (const i of r2.error.issues) allErrors[String(i.path[0])] = i.message
    const r3 = jobStep3Schema.safeParse(form)
    if (!r3.success) for (const i of r3.error.issues) allErrors[String(i.path[0])] = i.message
    if (Object.keys(allErrors).length > 0) {
      setErrors(allErrors)
      return
    }
    setErrors({})
    await onSubmit(form)
  }

  const err = (field: string) =>
    errors[field] ? <p className="text-error text-xs mt-1">{errors[field]}</p> : null

  return (
    <form id={formId} onSubmit={handleSubmit} className="flex flex-col gap-6" noValidate>
      {/* Seção 1 — Funcionário e Data */}
      <div>
        <p className="text-xs font-semibold text-base-content/40 uppercase tracking-wider mb-3">
          Funcionário e Data
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <fieldset className="fieldset gap-1">
            <label className="label text-xs font-medium text-base-content/60" htmlFor="employeeId">
              Funcionário
            </label>
            <select
              id="employeeId"
              className={`select select-bordered w-full ${errors.employeeId ? 'select-error' : ''}`}
              value={form.employeeId}
              onChange={(e) => set_('employeeId', e.target.value)}
            >
              <option value="">Selecione...</option>
              {employees.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name}
                </option>
              ))}
            </select>
            {err('employeeId')}
          </fieldset>

          <fieldset className="fieldset gap-1">
            <label
              className="label text-xs font-medium text-base-content/60"
              htmlFor="scheduledDate"
            >
              Data
            </label>
            <input
              id="scheduledDate"
              type="date"
              className={`input input-bordered w-full ${errors.scheduledDate ? 'input-error' : ''}`}
              value={form.scheduledDate}
              onChange={(e) => set_('scheduledDate', e.target.value)}
            />
            {err('scheduledDate')}
          </fieldset>
        </div>
      </div>

      {/* Seção 2 — Local e Horários */}
      <div>
        <p className="text-xs font-semibold text-base-content/40 uppercase tracking-wider mb-3">
          Local e Horários
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <fieldset className="fieldset gap-1">
            <label className="label text-xs font-medium text-base-content/60" htmlFor="city">
              Cidade
            </label>
            <input
              id="city"
              type="text"
              className={`input input-bordered w-full ${errors.city ? 'input-error' : ''}`}
              value={form.city}
              onChange={(e) => set_('city', e.target.value)}
            />
            {err('city')}
          </fieldset>

          <fieldset className="fieldset gap-1">
            <label className="label text-xs font-medium text-base-content/60" htmlFor="state">
              Estado
            </label>
            <input
              id="state"
              type="text"
              maxLength={2}
              placeholder="SP"
              className={`input input-bordered w-full ${errors.state ? 'input-error' : ''}`}
              value={form.state}
              onChange={(e) => set_('state', e.target.value.toUpperCase())}
            />
            {err('state')}
          </fieldset>

          <fieldset className="fieldset gap-1 md:col-span-2">
            <label className="label text-xs font-medium text-base-content/60" htmlFor="address">
              Endereço <span className="text-base-content/30">(opcional)</span>
            </label>
            <input
              id="address"
              type="text"
              placeholder="Rua, número, bairro…"
              className="input input-bordered w-full"
              value={form.address ?? ''}
              onChange={(e) => set_('address', e.target.value)}
            />
          </fieldset>

          <fieldset className="fieldset gap-1">
            <label className="label text-xs font-medium text-base-content/60" htmlFor="startTime">
              Horário de Início
            </label>
            <input
              id="startTime"
              type="time"
              className={`input input-bordered w-full ${errors.startTime ? 'input-error' : ''}`}
              value={form.startTime}
              onChange={(e) => set_('startTime', e.target.value)}
            />
            {err('startTime')}
          </fieldset>

          <fieldset className="fieldset gap-1">
            <label className="label text-xs font-medium text-base-content/60" htmlFor="endTime">
              Horário de Término
            </label>
            <input
              id="endTime"
              type="time"
              className={`input input-bordered w-full ${errors.endTime ? 'input-error' : ''}`}
              value={form.endTime}
              onChange={(e) => set_('endTime', e.target.value)}
            />
            {err('endTime')}
          </fieldset>

          <div className="flex gap-6 items-center md:col-span-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                className="checkbox"
                checked={form.accommodation}
                onChange={(e) => set_('accommodation', e.target.checked)}
              />
              <span className="text-sm">Hospedagem</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                className="checkbox"
                checked={form.car}
                onChange={(e) => set_('car', e.target.checked)}
              />
              <span className="text-sm">Carro</span>
            </label>
          </div>

          {form.car && (
            <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4 border border-base-300 rounded-lg p-4">
              <p className="text-xs font-semibold text-base-content/40 uppercase tracking-wider md:col-span-2">
                Carro alugado
              </p>
              <fieldset className="fieldset gap-1">
                <label
                  className="label text-xs font-medium text-base-content/60"
                  htmlFor="carPickupTime"
                >
                  Retirada
                </label>
                <input
                  id="carPickupTime"
                  type="time"
                  className="input input-bordered w-full"
                  value={form.carPickupTime ?? ''}
                  onChange={(e) => set_('carPickupTime', e.target.value)}
                />
              </fieldset>
              <fieldset className="fieldset gap-1">
                <label
                  className="label text-xs font-medium text-base-content/60"
                  htmlFor="carReturnTime"
                >
                  Devolução
                </label>
                <input
                  id="carReturnTime"
                  type="time"
                  className="input input-bordered w-full"
                  value={form.carReturnTime ?? ''}
                  onChange={(e) => set_('carReturnTime', e.target.value)}
                />
              </fieldset>
              <fieldset className="fieldset gap-1 md:col-span-2">
                <label
                  className="label text-xs font-medium text-base-content/60"
                  htmlFor="carPickupAddress"
                >
                  Endereço da locadora <span className="text-base-content/30">(opcional)</span>
                </label>
                <input
                  id="carPickupAddress"
                  type="text"
                  className="input input-bordered w-full"
                  value={form.carPickupAddress ?? ''}
                  onChange={(e) => set_('carPickupAddress', e.target.value)}
                />
              </fieldset>
            </div>
          )}
        </div>
      </div>

      {/* Seção 3 — Máquina e OS */}
      <div>
        <p className="text-xs font-semibold text-base-content/40 uppercase tracking-wider mb-3">
          Máquina e OS
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <fieldset className="fieldset gap-1">
            <label className="label text-xs font-medium text-base-content/60" htmlFor="machineId">
              Máquina
            </label>
            <select
              id="machineId"
              className={`select select-bordered w-full ${errors.machineId ? 'select-error' : ''}`}
              value={form.machineId}
              onChange={(e) => set_('machineId', e.target.value)}
            >
              <option value="">Selecione...</option>
              {machines.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
            {err('machineId')}
          </fieldset>

          <fieldset className="fieldset gap-1">
            <label className="label text-xs font-medium text-base-content/60" htmlFor="jobType">
              Tipo de OS
            </label>
            <select
              id="jobType"
              className="select select-bordered w-full"
              value={form.jobType}
              onChange={(e) => set_('jobType', e.target.value as JobType)}
            >
              <option value="maintenance">Manutenção</option>
              <option value="implementation">Implementação</option>
            </select>
          </fieldset>

          {form.machineId && machineTools.length > 0 && (
            <div className="md:col-span-2">
              <p className="text-xs font-medium text-base-content/60 mb-2">
                Ferramentas necessárias
              </p>
              <ul className="flex flex-wrap gap-2">
                {machineTools.map((mt) => (
                  <li
                    key={mt.id}
                    className={`badge badge-sm ${mt.tool.quantity < mt.quantityRequired ? 'badge-warning' : 'badge-ghost'}`}
                  >
                    {mt.tool.name} ×{mt.quantityRequired}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <fieldset className="fieldset gap-1 md:col-span-2">
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
            {err('description')}
          </fieldset>

          <fieldset className="fieldset gap-1 md:col-span-2">
            <label className="label text-xs font-medium text-base-content/60" htmlFor="notes">
              Observações <span className="text-base-content/30">(opcional)</span>
            </label>
            <textarea
              id="notes"
              className="textarea textarea-bordered w-full"
              rows={2}
              value={form.notes}
              onChange={(e) => set_('notes', e.target.value)}
            />
          </fieldset>
        </div>
      </div>

      {/* Seção 4 — Colaboradores e escopo (dados estendidos, podem vir vazios em OS oriunda de PC aceita) */}
      <div>
        <p className="text-xs font-semibold text-base-content/40 uppercase tracking-wider mb-3">
          Colaboradores e Escopo
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <fieldset className="fieldset gap-1 md:col-span-2">
            <legend className="label text-xs font-medium text-base-content/60">
              Colaboradores
            </legend>
            <div className="flex flex-wrap gap-2 border border-base-300 rounded-lg p-3">
              {employees.length === 0 && (
                <span className="text-xs text-base-content/40">Nenhum colaborador cadastrado.</span>
              )}
              {employees.map((e) => {
                const checked = (form.employeeIds ?? []).includes(e.id)
                return (
                  <label
                    key={e.id}
                    className={`badge cursor-pointer gap-2 ${checked ? 'badge-primary' : 'badge-outline'}`}
                  >
                    <input
                      type="checkbox"
                      className="checkbox checkbox-xs"
                      checked={checked}
                      onChange={() => toggleEmployee(e.id)}
                    />
                    {e.name}
                  </label>
                )
              })}
            </div>
          </fieldset>

          <fieldset className="fieldset gap-1">
            <label className="label text-xs font-medium text-base-content/60" htmlFor="bagId">
              Mala <span className="text-base-content/30">(opcional)</span>
            </label>
            <select
              id="bagId"
              className="select select-bordered w-full"
              value={form.bagId ?? ''}
              onChange={(e) => set_('bagId', e.target.value)}
            >
              <option value="">Selecione...</option>
              {bags.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} — {b.model}
                </option>
              ))}
            </select>
          </fieldset>

          <fieldset className="fieldset gap-1 md:col-span-2">
            <label className="label text-xs font-medium text-base-content/60" htmlFor="scopeDetail">
              Detalhamento do escopo <span className="text-base-content/30">(opcional)</span>
            </label>
            <textarea
              id="scopeDetail"
              className="textarea textarea-bordered w-full"
              rows={2}
              value={form.scopeDetail ?? ''}
              onChange={(e) => set_('scopeDetail', e.target.value)}
            />
          </fieldset>

          <fieldset className="fieldset gap-1 md:col-span-2">
            <label
              className="label text-xs font-medium text-base-content/60"
              htmlFor="serviceAddress"
            >
              Endereço de atendimento <span className="text-base-content/30">(opcional)</span>
            </label>
            <input
              id="serviceAddress"
              type="text"
              className="input input-bordered w-full"
              value={form.serviceAddress ?? ''}
              onChange={(e) => set_('serviceAddress', e.target.value)}
            />
          </fieldset>

          <fieldset className="fieldset gap-1">
            <label
              className="label text-xs font-medium text-base-content/60"
              htmlFor="clientContactName"
            >
              Contato do cliente <span className="text-base-content/30">(opcional)</span>
            </label>
            <input
              id="clientContactName"
              type="text"
              className="input input-bordered w-full"
              value={form.clientContactName ?? ''}
              onChange={(e) => set_('clientContactName', e.target.value)}
            />
          </fieldset>

          <fieldset className="fieldset gap-1">
            <label
              className="label text-xs font-medium text-base-content/60"
              htmlFor="clientContactPhone"
            >
              Telefone do contato <span className="text-base-content/30">(opcional)</span>
            </label>
            <input
              id="clientContactPhone"
              type="text"
              className="input input-bordered w-full"
              value={form.clientContactPhone ?? ''}
              onChange={(e) => set_('clientContactPhone', e.target.value)}
            />
          </fieldset>
        </div>
      </div>
    </form>
  )
}
