import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { scheduleEventSchema, EVENT_TYPE_LABELS } from '@/models/schedule.model'
import type { ScheduleEventType } from '@/models/schedule.model'
import { createScheduleEvent } from '@/services/schedule.service'
import { useEmployeeStore } from '@/viewmodels/employee.viewmodel'
import { toast } from '@/viewmodels/toast.viewmodel'

const EVENT_TYPES: ScheduleEventType[] = ['day_off', 'vacation', 'training', 'medical_leave']

interface FormFields {
  type: ScheduleEventType
  employeeIds: string[]
  startDate: string
  endDate: string
  notes: string
}

interface FormErrors {
  employeeIds?: string
  startDate?: string
  endDate?: string
}

export function ScheduleEventFormPage() {
  const navigate = useNavigate()
  const { employees, load: loadEmployees } = useEmployeeStore()
  const [submitting, setSubmitting] = useState(false)
  const [fields, setFields] = useState<FormFields>({
    type: 'day_off',
    employeeIds: [],
    startDate: '',
    endDate: '',
    notes: '',
  })
  const [errors, setErrors] = useState<FormErrors>({})

  useEffect(() => {
    loadEmployees()
  }, [loadEmployees])

  const toggleEmployee = (id: string) => {
    setFields((prev) => ({
      ...prev,
      employeeIds: prev.employeeIds.includes(id)
        ? prev.employeeIds.filter((e) => e !== id)
        : [...prev.employeeIds, id],
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const result = scheduleEventSchema.safeParse(fields)
    if (!result.success) {
      const errs: FormErrors = {}
      for (const issue of result.error.issues) {
        const field = issue.path[0] as keyof FormErrors
        if (field) errs[field] = issue.message
      }
      setErrors(errs)
      return
    }
    setErrors({})
    setSubmitting(true)
    try {
      const employeeNames = employees
        .filter((e) => fields.employeeIds.includes(e.id))
        .map((e) => e.name)
      await createScheduleEvent({ ...result.data, employeeNames })
      toast.success('Evento criado com sucesso.')
      navigate('/schedule')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="p-4 max-w-lg">
      <div className="flex items-center gap-3 mb-6">
        <button className="btn btn-ghost btn-sm btn-circle" onClick={() => navigate('/schedule')}>
          <ArrowLeft size={16} />
        </button>
        <h1 className="text-xl font-bold tracking-tight">Novo Evento de Agenda</h1>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Tipo */}
        <div className="form-control">
          <label className="label" htmlFor="type">
            <span className="label-text">Tipo</span>
          </label>
          <select
            id="type"
            aria-label="Tipo"
            className="select select-bordered"
            value={fields.type}
            onChange={(e) => setFields((p) => ({ ...p, type: e.target.value as ScheduleEventType }))}
          >
            {EVENT_TYPES.map((t) => (
              <option key={t} value={t}>{EVENT_TYPE_LABELS[t]}</option>
            ))}
          </select>
        </div>

        {/* Funcionários */}
        <div className="form-control">
          <label className="label">
            <span className="label-text">Funcionários</span>
          </label>
          <div className="flex flex-col gap-1 max-h-48 overflow-y-auto border border-base-300 rounded-md p-2">
            {employees.map((emp) => (
              <label key={emp.id} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="checkbox checkbox-sm"
                  checked={fields.employeeIds.includes(emp.id)}
                  onChange={() => toggleEmployee(emp.id)}
                  aria-label={emp.name}
                />
                <span className="text-sm">{emp.name}</span>
              </label>
            ))}
          </div>
          {errors.employeeIds && (
            <p className="text-error text-xs mt-1">{errors.employeeIds}</p>
          )}
        </div>

        {/* Data início */}
        <div className="form-control">
          <label className="label" htmlFor="startDate">
            <span className="label-text">Data de início</span>
          </label>
          <input
            id="startDate"
            type="date"
            className="input input-bordered"
            aria-label="Data de início"
            value={fields.startDate}
            onChange={(e) => setFields((p) => ({ ...p, startDate: e.target.value }))}
          />
          {errors.startDate && (
            <p className="text-error text-xs mt-1">{errors.startDate}</p>
          )}
        </div>

        {/* Data fim */}
        <div className="form-control">
          <label className="label" htmlFor="endDate">
            <span className="label-text">Data de término</span>
          </label>
          <input
            id="endDate"
            type="date"
            className="input input-bordered"
            aria-label="Data de término"
            value={fields.endDate}
            onChange={(e) => setFields((p) => ({ ...p, endDate: e.target.value }))}
          />
          {errors.endDate && (
            <p className="text-error text-xs mt-1">{errors.endDate}</p>
          )}
        </div>

        {/* Observações */}
        <div className="form-control">
          <label className="label" htmlFor="notes">
            <span className="label-text">Observações (opcional)</span>
          </label>
          <textarea
            id="notes"
            className="textarea textarea-bordered"
            rows={3}
            value={fields.notes}
            onChange={(e) => setFields((p) => ({ ...p, notes: e.target.value }))}
          />
        </div>

        <div className="flex gap-2 justify-end">
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => navigate('/schedule')}
          >
            Cancelar
          </button>
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            Salvar
          </button>
        </div>
      </form>
    </div>
  )
}
