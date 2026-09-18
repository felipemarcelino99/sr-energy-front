import { useState } from 'react'
import { jobStep1Schema, jobStep2Schema, jobStep3Schema } from '@/models/job.model'
import type { JobFormData, JobType } from '@/models/job.model'
import { formatDate } from '@/utils/date'
import { JobCollaboratorsFields } from '@/views/components/JobCollaboratorsFields'
import type { JobCollaboratorsData } from '@/views/components/JobCollaboratorsFields'
import { JobLocationFields } from '@/views/components/JobLocationFields'
import type { JobLocationData } from '@/views/components/JobLocationFields'
import { JobEquipmentFields } from '@/views/components/JobEquipmentFields'
import type { JobEquipmentData } from '@/views/components/JobEquipmentFields'
import { JOB_TYPE_LABELS } from '@/models/job.model'

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

interface JobStepperProps {
  employees: EmployeeOption[]
  machines: MachineOption[]
  bags?: BagOption[]
  initialData?: Partial<JobFormData>
  onSubmit: (data: JobFormData) => Promise<void>
  loading?: boolean
  submitLabel?: string
}

// `contractId`/`proposalId` viajam junto com os dados de "Equipamentos" no
// estado do wizard, mas não são campos editáveis nesta etapa — só
// pass-through preservado no submit quando a OS já nasce vinculada a uma
// PC/contrato (sub-plano 04, item 3).
type Step3 = JobEquipmentData & { contractId: string; proposalId: string }

export function JobStepper({
  employees,
  machines,
  bags = [],
  initialData,
  onSubmit,
  loading = false,
  submitLabel = 'Confirmar',
}: JobStepperProps) {
  const [step, setStep] = useState(1)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const [s1, setS1] = useState<JobCollaboratorsData>({
    scheduledDate: initialData?.scheduledDate ?? new Date().toISOString().split('T')[0],
    scheduledEndDate: initialData?.scheduledEndDate ?? '',
    employeeIds: initialData?.employeeIds ?? [],
  })
  const [s2, setS2] = useState<JobLocationData>({
    city: initialData?.city ?? '',
    state: initialData?.state ?? '',
    address: initialData?.address ?? '',
    accommodation: initialData?.accommodation ?? false,
    car: initialData?.car ?? false,
    startTime: initialData?.startTime ?? '',
    endTime: initialData?.endTime ?? '',
    carPickupTime: initialData?.carPickupTime ?? '',
    carReturnTime: initialData?.carReturnTime ?? '',
    carPickupAddress: initialData?.carPickupAddress ?? '',
    serviceAddress: initialData?.serviceAddress ?? '',
    clientContactName: initialData?.clientContactName ?? '',
    clientContactPhone: initialData?.clientContactPhone ?? '',
  })
  const [s3, setS3] = useState<Step3>({
    machineId: initialData?.machineId ?? '',
    jobType: (initialData?.jobType ?? '') as JobType | '',
    notes: initialData?.notes ?? '',
    bagId: initialData?.bagId ?? '',
    scopeDetail: initialData?.scopeDetail ?? '',
    contractId: initialData?.contractId ?? '',
    proposalId: initialData?.proposalId ?? '',
  })

  function parseErrors(issues: { path: PropertyKey[]; message: string }[]) {
    const errs: Record<string, string> = {}
    for (const issue of issues) errs[String(issue.path[0])] = issue.message
    return errs
  }

  function goNext() {
    if (step === 1) {
      const r = jobStep1Schema.safeParse(s1)
      if (!r.success) {
        setErrors(parseErrors(r.error.issues))
        return
      }
    } else if (step === 2) {
      const r = jobStep2Schema.safeParse(s2)
      if (!r.success) {
        setErrors(parseErrors(r.error.issues))
        return
      }
    } else if (step === 3) {
      const r = jobStep3Schema.safeParse(s3)
      if (!r.success) {
        setErrors(parseErrors(r.error.issues))
        return
      }
    }
    setErrors({})
    setStep((p) => p + 1)
  }

  async function handleSubmit() {
    const payload: JobFormData = {
      ...s1,
      ...s2,
      ...s3,
      jobType: s3.jobType as JobType,
      contractId: s3.contractId || undefined,
      proposalId: s3.proposalId || undefined,
      // `employee_id` (assignee legado) continua obrigatório no `POST /jobs`
      // do backend — derivado do primeiro colaborador selecionado, nunca
      // escolhido separadamente pelo usuário (fonte de verdade é `employeeIds`).
      employeeId: s1.employeeIds[0],
    }
    await onSubmit(payload)
  }

  // ---- Step 1 — Colaboradores ----
  if (step === 1)
    return (
      <div>
        <StepIndicator current={1} onStepClick={setStep} />
        <div className="mt-3">
          <JobCollaboratorsFields
            value={s1}
            onChange={setS1}
            employees={employees}
            errors={errors}
          />
        </div>

        <div className="sticky bottom-0 mt-4 py-4 bg-base-200 border-t border-base-300 flex justify-end">
          <button type="button" className="btn btn-primary" onClick={goNext}>
            Próximo
          </button>
        </div>
      </div>
    )

  // ---- Step 2 — Local ----
  if (step === 2)
    return (
      <div>
        <StepIndicator current={2} onStepClick={setStep} />
        <div className="mt-3">
          <JobLocationFields value={s2} onChange={setS2} errors={errors} />
        </div>

        <div className="sticky bottom-0 mt-4 py-4 bg-base-200 border-t border-base-300 flex justify-end gap-3">
          <button type="button" className="btn btn-ghost" onClick={() => setStep(1)}>
            Voltar
          </button>
          <button type="button" className="btn btn-primary" onClick={goNext}>
            Próximo
          </button>
        </div>
      </div>
    )

  // ---- Step 3 — Equipamentos ----
  if (step === 3)
    return (
      <div>
        <StepIndicator current={3} onStepClick={setStep} />
        <div className="mt-3">
          <JobEquipmentFields
            value={s3}
            onChange={(update) =>
              setS3((prev) => ({
                ...prev,
                ...(typeof update === 'function' ? update(prev) : update),
              }))
            }
            machines={machines}
            bags={bags}
            errors={errors}
          />
        </div>

        <div className="sticky bottom-0 mt-4 py-4 bg-base-200 border-t border-base-300 flex justify-end gap-3">
          <button type="button" className="btn btn-ghost" onClick={() => setStep(2)}>
            Voltar
          </button>
          <button type="button" className="btn btn-primary" onClick={goNext}>
            Próximo
          </button>
        </div>
      </div>
    )

  // ---- Step 4 — Review ----
  return (
    <div>
      <StepIndicator current={4} onStepClick={setStep} />
      <div data-testid="review-step" className="mt-3 flex flex-col gap-3">
        <div className="card bg-base-200 p-4">
          <h3 className="font-semibold mb-2">Colaboradores e Data</h3>
          <p>
            <span className="font-medium">Colaboradores:</span>{' '}
            {s1.employeeIds.length > 0
              ? s1.employeeIds
                  .map((id) => employees.find((e) => e.id === id)?.name ?? id)
                  .join(', ')
              : '—'}
          </p>
          <p>
            <span className="font-medium">Data:</span> {formatDate(s1.scheduledDate)}
            {s1.scheduledEndDate && <> até {formatDate(s1.scheduledEndDate)}</>}
          </p>
        </div>

        <div className="card bg-base-200 p-4">
          <h3 className="font-semibold mb-2">Local e Horários</h3>
          <p>
            <span className="font-medium">Cidade:</span> {s2.city}
          </p>
          <p>
            <span className="font-medium">Estado:</span> {s2.state}
          </p>
          {s2.address && (
            <p>
              <span className="font-medium">Endereço:</span> {s2.address}
            </p>
          )}
          <p>
            <span className="font-medium">Hospedagem:</span> {s2.accommodation ? 'Sim' : 'Não'}
          </p>
          <p>
            <span className="font-medium">Carro:</span> {s2.car ? 'Sim' : 'Não'}
          </p>
          <p>
            <span className="font-medium">Check-in:</span> {s2.startTime}
          </p>
          <p>
            <span className="font-medium">Check-out:</span> {s2.endTime}
          </p>
          {s2.car && s2.carPickupTime && (
            <p>
              <span className="font-medium">Retirada carro:</span> {s2.carPickupTime}
            </p>
          )}
          {s2.car && s2.carReturnTime && (
            <p>
              <span className="font-medium">Devolução carro:</span> {s2.carReturnTime}
            </p>
          )}
          {s2.car && s2.carPickupAddress && (
            <p>
              <span className="font-medium">Locadora:</span> {s2.carPickupAddress}
            </p>
          )}
        </div>

        <div className="card bg-base-200 p-4">
          <h3 className="font-semibold mb-2">Equipamento e OS</h3>
          <p>
            <span className="font-medium">Equipamento:</span>{' '}
            {machines.find((m) => m.id === s3.machineId)?.name ?? s3.machineId}
          </p>
          <p>
            <span className="font-medium">Tipo:</span>{' '}
            {s3.jobType ? JOB_TYPE_LABELS[s3.jobType] : '—'}
          </p>
          {s3.scopeDetail && (
            <p>
              <span className="font-medium">Escopo:</span> {s3.scopeDetail}
            </p>
          )}
          {s3.notes && (
            <p>
              <span className="font-medium">Obs:</span> {s3.notes}
            </p>
          )}
        </div>
      </div>

      <div className="sticky bottom-0 mt-4 py-4 bg-base-200 border-t border-base-300 flex justify-end gap-3">
        <button type="button" className="btn btn-ghost" onClick={() => setStep(3)}>
          Voltar
        </button>
        <button type="button" className="btn btn-primary" onClick={handleSubmit} disabled={loading}>
          {loading ? <span className="loading loading-spinner loading-sm" /> : submitLabel}
        </button>
      </div>
    </div>
  )
}

function StepIndicator({
  current,
  onStepClick,
}: {
  current: number
  onStepClick: (step: number) => void
}) {
  const steps = ['Colaboradores', 'Local', 'Equipamentos', 'Revisão']
  return (
    <ul className="steps steps-horizontal w-full">
      {steps.map((label, i) => {
        const stepNum = i + 1
        const isCompleted = stepNum < current
        return (
          <li
            key={label}
            data-testid={`step-indicator-${stepNum}`}
            className={`step ${stepNum <= current ? 'step-primary' : ''} ${isCompleted ? 'cursor-pointer' : 'cursor-default'}`}
            onClick={() => isCompleted && onStepClick(stepNum)}
            role={isCompleted ? 'button' : undefined}
            tabIndex={isCompleted ? 0 : undefined}
            onKeyDown={(e) => isCompleted && e.key === 'Enter' && onStepClick(stepNum)}
          >
            <span className="hidden sm:inline">{label}</span>
          </li>
        )
      })}
    </ul>
  )
}
