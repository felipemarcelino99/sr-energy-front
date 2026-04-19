import { useState } from 'react'
import { X } from 'lucide-react'
import { scheduleEventSchema, EVENT_TYPE_LABELS } from '@/models/schedule.model'
import type { ScheduleEventFormData } from '@/models/schedule.model'
import type { Employee } from '@/models/employee.model'
import { useScheduleStore } from '@/viewmodels/schedule.viewmodel'

interface Props {
  open: boolean
  initialDate: string | null
  employees: Employee[]
  onClose: () => void
}

const EMPTY: ScheduleEventFormData = {
  type: 'day_off',
  employeeIds: [],
  startDate: '',
  endDate: '',
  notes: '',
}

export function ScheduleEventModal({ open, initialDate, employees, onClose }: Props) {
  const { create } = useScheduleStore()

  const [form, setForm] = useState<ScheduleEventFormData>(() => ({
    ...EMPTY,
    startDate: initialDate ?? '',
    endDate: initialDate ?? '',
  }))
  const [errors, setErrors] = useState<Partial<Record<keyof ScheduleEventFormData | '_root', string>>>({})
  const [saving, setSaving] = useState(false)

  // Reset form when modal opens with a new date
  const resetFor = (date: string | null) => {
    setForm({ ...EMPTY, startDate: date ?? '', endDate: date ?? '' })
    setErrors({})
  }

  // Keep form in sync when initialDate changes and modal opens
  if (open && initialDate && form.startDate === '' && initialDate !== form.startDate) {
    resetFor(initialDate)
  }

  const toggleEmployee = (id: string) => {
    setForm((prev) => ({
      ...prev,
      employeeIds: prev.employeeIds.includes(id)
        ? prev.employeeIds.filter((e) => e !== id)
        : [...prev.employeeIds, id],
    }))
  }

  const handleClose = () => {
    resetFor(null)
    onClose()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const result = scheduleEventSchema.safeParse(form)
    if (!result.success) {
      const fieldErrors: typeof errors = {}
      for (const issue of result.error.issues) {
        const key = (issue.path[0] as keyof ScheduleEventFormData) ?? '_root'
        fieldErrors[key] = issue.message
      }
      setErrors(fieldErrors)
      return
    }
    setSaving(true)
    try {
      const employeeNames = employees
        .filter((e) => result.data.employeeIds.includes(e.id))
        .map((e) => e.name)
      await create({ ...result.data, employeeNames })
      handleClose()
    } finally {
      setSaving(false)
    }
  }

  if (!open) return null

  return (
    <div className="modal modal-open" role="dialog" aria-modal="true" aria-label="Novo evento">
      <div className="modal-box max-w-md">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-lg">Novo Evento</h3>
          <button
            type="button"
            className="btn btn-ghost btn-sm btn-circle"
            onClick={handleClose}
            aria-label="Fechar"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Type */}
          <div className="form-control">
            <label className="label pb-1">
              <span className="label-text text-xs font-semibold">Tipo de evento</span>
            </label>
            <select
              className="select select-bordered select-sm"
              value={form.type}
              onChange={(e) => setForm((p) => ({ ...p, type: e.target.value as ScheduleEventFormData['type'] }))}
            >
              {(Object.keys(EVENT_TYPE_LABELS) as ScheduleEventFormData['type'][]).map((t) => (
                <option key={t} value={t}>{EVENT_TYPE_LABELS[t]}</option>
              ))}
            </select>
          </div>

          {/* Employees multi-select */}
          <div className="form-control">
            <label className="label pb-1">
              <span className="label-text text-xs font-semibold">Funcionários</span>
            </label>
            <div
              className="border border-base-300 rounded-lg max-h-40 overflow-y-auto p-2 flex flex-col gap-1"
              data-testid="employee-multiselect"
            >
              {employees.length === 0 && (
                <p className="text-xs text-base-content/40 p-1">Nenhum funcionário disponível</p>
              )}
              {employees.map((emp) => (
                <label key={emp.id} className="flex items-center gap-2 cursor-pointer py-0.5 px-1 rounded hover:bg-base-200">
                  <input
                    type="checkbox"
                    className="checkbox checkbox-xs checkbox-primary"
                    checked={form.employeeIds.includes(emp.id)}
                    onChange={() => toggleEmployee(emp.id)}
                  />
                  <span className="text-sm">{emp.name}</span>
                </label>
              ))}
            </div>
            {errors.employeeIds && (
              <span className="text-error text-xs mt-1">{errors.employeeIds}</span>
            )}
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div className="form-control">
              <label className="label pb-1">
                <span className="label-text text-xs font-semibold">Data início</span>
              </label>
              <input
                type="date"
                className="input input-bordered input-sm"
                value={form.startDate}
                onChange={(e) => setForm((p) => ({ ...p, startDate: e.target.value }))}
              />
              {errors.startDate && (
                <span className="text-error text-xs mt-1">{errors.startDate}</span>
              )}
            </div>
            <div className="form-control">
              <label className="label pb-1">
                <span className="label-text text-xs font-semibold">Data término</span>
              </label>
              <input
                type="date"
                className="input input-bordered input-sm"
                value={form.endDate}
                onChange={(e) => setForm((p) => ({ ...p, endDate: e.target.value }))}
              />
              {errors.endDate && (
                <span className="text-error text-xs mt-1">{errors.endDate}</span>
              )}
            </div>
          </div>

          {/* Notes */}
          <div className="form-control">
            <label className="label pb-1">
              <span className="label-text text-xs font-semibold">Observações (opcional)</span>
            </label>
            <textarea
              className="textarea textarea-bordered textarea-sm resize-none"
              rows={2}
              value={form.notes ?? ''}
              onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
            />
          </div>

          <div className="modal-action mt-0">
            <button type="button" className="btn btn-ghost btn-sm" onClick={handleClose}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>
              {saving ? <span className="loading loading-spinner loading-xs" /> : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
      <div className="modal-backdrop" onClick={handleClose} />
    </div>
  )
}
