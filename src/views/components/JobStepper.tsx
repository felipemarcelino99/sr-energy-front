import { useState } from 'react'
import { jobStep1Schema, jobStep2Schema, jobStep3Schema } from '@/models/job.model'
import type { JobFormData, JobType } from '@/models/job.model'
import { formatDate } from '@/utils/date'

interface EmployeeOption { id: string; name: string }
interface MachineOption { id: string; name: string }

interface JobStepperProps {
  employees: EmployeeOption[]
  machines: MachineOption[]
  initialData?: Partial<JobFormData>
  onSubmit: (data: JobFormData) => Promise<void>
  loading?: boolean
}

type Step1 = { employeeId: string; scheduledDate: string }
type Step2 = { city: string; state: string; accommodation: boolean; car: boolean; startTime: string; endTime: string }
type Step3 = { machineId: string; jobType: JobType; description: string; notes: string }

export function JobStepper({ employees, machines, initialData, onSubmit, loading = false }: JobStepperProps) {
  const [step, setStep] = useState(1)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const [s1, setS1] = useState<Step1>({
    employeeId: initialData?.employeeId ?? '',
    scheduledDate: initialData?.scheduledDate ?? '',
  })
  const [s2, setS2] = useState<Step2>({
    city: initialData?.city ?? '',
    state: initialData?.state ?? '',
    accommodation: initialData?.accommodation ?? false,
    car: initialData?.car ?? false,
    startTime: initialData?.startTime ?? '',
    endTime: initialData?.endTime ?? '',
  })
  const [s3, setS3] = useState<Step3>({
    machineId: initialData?.machineId ?? '',
    jobType: (initialData?.jobType ?? 'maintenance') as JobType,
    description: initialData?.description ?? '',
    notes: initialData?.notes ?? '',
  })

  function parseErrors(issues: { path: PropertyKey[]; message: string }[]) {
    const errs: Record<string, string> = {}
    for (const issue of issues) errs[String(issue.path[0])] = issue.message
    return errs
  }

  function goNext() {
    if (step === 1) {
      const r = jobStep1Schema.safeParse(s1)
      if (!r.success) { setErrors(parseErrors(r.error.issues)); return }
    } else if (step === 2) {
      const r = jobStep2Schema.safeParse(s2)
      if (!r.success) { setErrors(parseErrors(r.error.issues)); return }
    } else if (step === 3) {
      const r = jobStep3Schema.safeParse(s3)
      if (!r.success) { setErrors(parseErrors(r.error.issues)); return }
    }
    setErrors({})
    setStep((p) => p + 1)
  }

  async function handleSubmit() {
    await onSubmit({ ...s1, ...s2, ...s3 })
  }

  // ---- Step 1 ----
  if (step === 1) return (
    <div>
      <StepIndicator current={1} />
      <div className="flex flex-col gap-4 mt-4">
        <fieldset className="fieldset gap-1">
          <label className="label text-xs font-medium text-base-content/60" htmlFor="employeeId">Funcionário</label>
          <select
            id="employeeId"
            className={`select select-bordered w-full ${errors.employeeId ? 'select-error' : ''}`}
            value={s1.employeeId}
            onChange={(e) => setS1((p) => ({ ...p, employeeId: e.target.value }))}
          >
            <option value="">Selecione...</option>
            {employees.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
          </select>
          {errors.employeeId && <p data-testid="error-employeeId" className="text-error text-xs">{errors.employeeId}</p>}
        </fieldset>

        <fieldset className="fieldset gap-1">
          <label className="label text-xs font-medium text-base-content/60" htmlFor="scheduledDate">Data</label>
          <input
            id="scheduledDate"
            type="date"
            className={`input input-bordered w-full ${errors.scheduledDate ? 'input-error' : ''}`}
            value={s1.scheduledDate}
            onChange={(e) => setS1((p) => ({ ...p, scheduledDate: e.target.value }))}
          />
          {errors.scheduledDate && <p data-testid="error-scheduledDate" className="text-error text-xs">{errors.scheduledDate}</p>}
        </fieldset>

        <button type="button" className="btn btn-primary" onClick={goNext}>Próximo</button>
      </div>
    </div>
  )

  // ---- Step 2 ----
  if (step === 2) return (
    <div>
      <StepIndicator current={2} />
      <div className="flex flex-col gap-4 mt-4">
        <fieldset className="fieldset gap-1">
          <label className="label text-xs font-medium text-base-content/60" htmlFor="city">Cidade</label>
          <input
            id="city"
            type="text"
            className={`input input-bordered w-full ${errors.city ? 'input-error' : ''}`}
            value={s2.city}
            onChange={(e) => setS2((p) => ({ ...p, city: e.target.value }))}
          />
          {errors.city && <p data-testid="error-city" className="text-error text-xs">{errors.city}</p>}
        </fieldset>

        <fieldset className="fieldset gap-1">
          <label className="label text-xs font-medium text-base-content/60" htmlFor="state">Estado</label>
          <input
            id="state"
            type="text"
            maxLength={2}
            placeholder="SP"
            className={`input input-bordered w-full ${errors.state ? 'input-error' : ''}`}
            value={s2.state}
            onChange={(e) => setS2((p) => ({ ...p, state: e.target.value.toUpperCase() }))}
          />
          {errors.state && <p data-testid="error-state" className="text-error text-xs">{errors.state}</p>}
        </fieldset>

        <div className="flex gap-6">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              className="checkbox"
              checked={s2.accommodation}
              onChange={(e) => setS2((p) => ({ ...p, accommodation: e.target.checked }))}
            />
            <span className="text-sm">Hospedagem</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              className="checkbox"
              checked={s2.car}
              onChange={(e) => setS2((p) => ({ ...p, car: e.target.checked }))}
            />
            <span className="text-sm">Carro</span>
          </label>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <fieldset className="fieldset gap-1">
            <label className="label text-xs font-medium text-base-content/60" htmlFor="startTime">Horário de Início</label>
            <input
              id="startTime"
              type="time"
              className={`input input-bordered w-full ${errors.startTime ? 'input-error' : ''}`}
              value={s2.startTime}
              onChange={(e) => setS2((p) => ({ ...p, startTime: e.target.value }))}
            />
            {errors.startTime && <p data-testid="error-startTime" className="text-error text-xs">{errors.startTime}</p>}
          </fieldset>

          <fieldset className="fieldset gap-1">
            <label className="label text-xs font-medium text-base-content/60" htmlFor="endTime">Horário de Término</label>
            <input
              id="endTime"
              type="time"
              className={`input input-bordered w-full ${errors.endTime ? 'input-error' : ''}`}
              value={s2.endTime}
              onChange={(e) => setS2((p) => ({ ...p, endTime: e.target.value }))}
            />
            {errors.endTime && <p data-testid="error-endTime" className="text-error text-xs">{errors.endTime}</p>}
          </fieldset>
        </div>

        <div className="flex gap-2">
          <button type="button" className="btn btn-ghost" onClick={() => setStep(1)}>Voltar</button>
          <button type="button" className="btn btn-primary flex-1" onClick={goNext}>Próximo</button>
        </div>
      </div>
    </div>
  )

  // ---- Step 3 ----
  if (step === 3) return (
    <div>
      <StepIndicator current={3} />
      <div className="flex flex-col gap-4 mt-4">
        <fieldset className="fieldset gap-1">
          <label className="label text-xs font-medium text-base-content/60" htmlFor="machineId">Máquina</label>
          <select
            id="machineId"
            className={`select select-bordered w-full ${errors.machineId ? 'select-error' : ''}`}
            value={s3.machineId}
            onChange={(e) => setS3((p) => ({ ...p, machineId: e.target.value }))}
          >
            <option value="">Selecione...</option>
            {machines.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
          {errors.machineId && <p data-testid="error-machineId" className="text-error text-xs">{errors.machineId}</p>}
        </fieldset>

        <fieldset className="fieldset gap-1">
          <label className="label text-xs font-medium text-base-content/60" htmlFor="jobType">Tipo de Trabalho</label>
          <select
            id="jobType"
            className="select select-bordered w-full"
            value={s3.jobType}
            onChange={(e) => setS3((p) => ({ ...p, jobType: e.target.value as JobType }))}
          >
            <option value="maintenance">Manutenção</option>
            <option value="implementation">Implementação</option>
          </select>
        </fieldset>

        <fieldset className="fieldset gap-1">
          <label className="label text-xs font-medium text-base-content/60" htmlFor="description">Descrição</label>
          <textarea
            id="description"
            className={`textarea textarea-bordered w-full ${errors.description ? 'textarea-error' : ''}`}
            rows={3}
            value={s3.description}
            onChange={(e) => setS3((p) => ({ ...p, description: e.target.value }))}
          />
          {errors.description && <p data-testid="error-description" className="text-error text-xs">{errors.description}</p>}
        </fieldset>

        <fieldset className="fieldset gap-1">
          <label className="label text-xs font-medium text-base-content/60" htmlFor="notes">
            Observações <span className="text-base-content/30">(opcional)</span>
          </label>
          <textarea
            id="notes"
            className="textarea textarea-bordered w-full"
            rows={2}
            value={s3.notes}
            onChange={(e) => setS3((p) => ({ ...p, notes: e.target.value }))}
          />
        </fieldset>

        <div className="flex gap-2">
          <button type="button" className="btn btn-ghost" onClick={() => setStep(2)}>Voltar</button>
          <button type="button" className="btn btn-primary flex-1" onClick={goNext}>Próximo</button>
        </div>
      </div>
    </div>
  )

  // ---- Step 4 — Review ----
  return (
    <div>
      <StepIndicator current={4} />
      <div data-testid="review-step" className="mt-4 flex flex-col gap-4">
        <div className="card bg-base-200 p-4">
          <h3 className="font-semibold mb-2">Funcionário e Data</h3>
          <p><span className="font-medium">Funcionário ID:</span> {s1.employeeId}</p>
          <p><span className="font-medium">Data:</span> {formatDate(s1.scheduledDate)}</p>
        </div>

        <div className="card bg-base-200 p-4">
          <h3 className="font-semibold mb-2">Local e Horários</h3>
          <p><span className="font-medium">Cidade:</span> {s2.city}</p>
          <p><span className="font-medium">Estado:</span> {s2.state}</p>
          <p><span className="font-medium">Hospedagem:</span> {s2.accommodation ? 'Sim' : 'Não'}</p>
          <p><span className="font-medium">Carro:</span> {s2.car ? 'Sim' : 'Não'}</p>
          <p><span className="font-medium">Início:</span> {s2.startTime}</p>
          <p><span className="font-medium">Término:</span> {s2.endTime}</p>
        </div>

        <div className="card bg-base-200 p-4">
          <h3 className="font-semibold mb-2">Máquina e Trabalho</h3>
          <p><span className="font-medium">Máquina ID:</span> {s3.machineId}</p>
          <p><span className="font-medium">Tipo:</span> {s3.jobType === 'maintenance' ? 'Manutenção' : 'Implementação'}</p>
          <p><span className="font-medium">Descrição:</span> {s3.description}</p>
          {s3.notes && <p><span className="font-medium">Obs:</span> {s3.notes}</p>}
        </div>

        <div className="flex gap-2">
          <button type="button" className="btn btn-ghost" onClick={() => setStep(3)}>Voltar</button>
          <button
            type="button"
            className="btn btn-primary flex-1"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? <span className="loading loading-spinner loading-sm" /> : 'Confirmar'}
          </button>
        </div>
      </div>
    </div>
  )
}

function StepIndicator({ current }: { current: number }) {
  const steps = ['Funcionário', 'Local', 'Máquina', 'Revisão']
  return (
    <ul className="steps steps-horizontal w-full">
      {steps.map((label, i) => (
        <li key={label} className={`step ${i + 1 <= current ? 'step-primary' : ''}`}><span className="hidden sm:inline">{label}</span></li>
      ))}
    </ul>
  )
}
