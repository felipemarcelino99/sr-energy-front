import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import type { Job, JobFormData, JobType } from '@/models/job.model'
import { fetchContract } from '@/services/contract.service'
import { JobCollaboratorsFields } from '@/views/components/JobCollaboratorsFields'
import type { JobCollaboratorsData } from '@/views/components/JobCollaboratorsFields'
import { JobLocationFields } from '@/views/components/JobLocationFields'
import type { JobLocationData } from '@/views/components/JobLocationFields'
import { JobEquipmentFields } from '@/views/components/JobEquipmentFields'
import type { JobEquipmentData } from '@/views/components/JobEquipmentFields'

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

interface JobEditTabsProps {
  job: Partial<Job>
  employees: EmployeeOption[]
  machines: MachineOption[]
  bags?: BagOption[]
  onSubmit: (data: Partial<JobFormData>) => Promise<void>
  onCancel: () => void
  loading?: boolean
}

type Tab = 'collaborators' | 'location' | 'equipment' | 'links'

const TABS: { id: Tab; label: string }[] = [
  { id: 'collaborators', label: 'Colaboradores' },
  { id: 'location', label: 'Local' },
  { id: 'equipment', label: 'Equipamentos' },
  { id: 'links', label: 'Vínculos' },
]

/**
 * Edição de OS em abas — sub-plano 04, item 4. Reaproveita os mesmos blocos
 * de campos do `JobStepper` (`JobCollaboratorsFields`/`JobLocationFields`/
 * `JobEquipmentFields`), um `<form>` único com Salvar/Cancelar fixos no
 * topo (em vez do fluxo sequencial de wizard usado na criação). A aba
 * "Vínculos" é somente leitura — PC/contrato de origem não são editáveis
 * aqui, só visualizados/linkados.
 */
export function JobEditTabs({
  job,
  employees,
  machines,
  bags = [],
  onSubmit,
  onCancel,
  loading = false,
}: JobEditTabsProps) {
  const [tab, setTab] = useState<Tab>('collaborators')

  const [s1, setS1] = useState<JobCollaboratorsData>({
    scheduledDate: job.scheduledDate ?? '',
    scheduledEndDate: job.scheduledEndDate ?? '',
    employeeIds: job.employeeIds ?? [],
  })
  const [s2, setS2] = useState<JobLocationData>({
    city: job.city ?? '',
    state: job.state ?? '',
    address: job.address ?? '',
    accommodation: job.accommodation ?? false,
    car: job.car ?? false,
    startTime: job.startTime ?? '',
    endTime: job.endTime ?? '',
    carPickupTime: job.carPickupTime ?? '',
    carReturnTime: job.carReturnTime ?? '',
    carPickupAddress: job.carPickupAddress ?? '',
    serviceAddress: job.serviceAddress ?? '',
    clientContactName: job.clientContactName ?? '',
    clientContactPhone: job.clientContactPhone ?? '',
  })
  const [s3, setS3] = useState<JobEquipmentData>({
    machineId: job.machineId ?? '',
    jobType: (job.jobType ?? '') as JobType | '',
    notes: job.notes ?? '',
    bagId: job.bagId ?? '',
    scopeDetail: job.scopeDetail ?? '',
  })

  const contractQuery = useQuery({
    queryKey: ['contracts', job.contractId],
    queryFn: () => fetchContract(job.contractId!),
    enabled: Boolean(job.contractId),
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    // Edição é sempre PUT parcial — campos que exigem preenchimento na
    // criação (cidade, horários, tipo…) ficam de fora do payload quando
    // ainda vazios, pra não quebrar a validação do backend (que continua
    // exigindo min-length quando o campo É enviado) numa OS "esqueleto"
    // sendo completada aos poucos.
    const payload: Partial<JobFormData> = {
      employeeIds: s1.employeeIds,
      accommodation: s2.accommodation,
      car: s2.car,
    }
    if (s1.employeeIds[0]) payload.employeeId = s1.employeeIds[0]
    if (s1.scheduledDate) payload.scheduledDate = s1.scheduledDate
    payload.scheduledEndDate = s1.scheduledEndDate || undefined

    if (s2.city) payload.city = s2.city
    if (s2.state) payload.state = s2.state
    payload.address = s2.address || undefined
    if (s2.startTime) payload.startTime = s2.startTime
    if (s2.endTime) payload.endTime = s2.endTime
    payload.carPickupTime = s2.carPickupTime || undefined
    payload.carReturnTime = s2.carReturnTime || undefined
    payload.carPickupAddress = s2.carPickupAddress || undefined
    payload.serviceAddress = s2.serviceAddress || undefined
    payload.clientContactName = s2.clientContactName || undefined
    payload.clientContactPhone = s2.clientContactPhone || undefined

    if (s3.machineId) payload.machineId = s3.machineId
    if (s3.jobType) payload.jobType = s3.jobType as JobType
    payload.notes = s3.notes || undefined
    payload.bagId = s3.bagId || undefined
    payload.scopeDetail = s3.scopeDetail || undefined

    // Sub-plano 04, item 3/4: reenvia os vínculos já existentes pra
    // garantir que não se percam num PUT (mesmo com o backend parcial —
    // preservar explicitamente é mais seguro do que confiar só na omissão).
    if (job.contractId) payload.contractId = job.contractId
    if (job.proposalId) payload.proposalId = job.proposalId
    if (job.clientId) payload.clientId = job.clientId

    await onSubmit(payload)
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div className="sticky top-0 z-10 bg-base-100 py-3 flex justify-end gap-3 border-b border-base-300">
        <button type="button" className="btn btn-ghost" onClick={onCancel} disabled={loading}>
          Cancelar
        </button>
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? <span className="loading loading-spinner loading-sm" /> : 'Salvar'}
        </button>
      </div>

      <div role="tablist" className="tabs tabs-boxed">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            className={`tab ${tab === t.id ? 'tab-active' : ''}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'collaborators' && (
        <JobCollaboratorsFields value={s1} onChange={setS1} employees={employees} />
      )}
      {tab === 'location' && <JobLocationFields value={s2} onChange={setS2} />}
      {tab === 'equipment' && (
        <JobEquipmentFields value={s3} onChange={setS3} machines={machines} bags={bags} />
      )}
      {tab === 'links' && (
        <div className="card bg-base-200 border border-base-300">
          <div className="card-body gap-3">
            <h2 className="text-xs font-semibold text-base-content/40 uppercase tracking-wider">
              Vínculos (somente leitura)
            </h2>
            {!job.proposal && !job.contractId && (
              <p className="text-sm text-base-content/50">
                Esta OS não está vinculada a nenhuma PC ou contrato.
              </p>
            )}
            {job.proposal && (
              <div className="flex items-center gap-2 text-sm">
                <span className="font-medium">PC de origem:</span>
                <Link to={`/proposals/${job.proposal.id}/edit`} className="link link-primary">
                  {job.proposal.number}
                </Link>
              </div>
            )}
            {job.contractId && (
              <div className="flex items-center gap-2 text-sm">
                <span className="font-medium">Contrato vinculado:</span>
                {contractQuery.isLoading && <span className="loading loading-spinner loading-xs" />}
                {contractQuery.data && (
                  <Link to={`/contracts/${job.contractId}/edit`} className="link link-primary">
                    {contractQuery.data.number ?? contractQuery.data.id}
                  </Link>
                )}
                {contractQuery.isError && (
                  <span className="text-base-content/50">
                    Não foi possível carregar o contrato.
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </form>
  )
}
