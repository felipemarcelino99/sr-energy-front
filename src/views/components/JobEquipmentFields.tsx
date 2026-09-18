import { useEffect } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import { JOB_TYPE_LABELS } from '@/models/job.model'
import type { JobType } from '@/models/job.model'
import type { MachineTool } from '@/models/tool.model'
import { useToolStore } from '@/viewmodels/tool.viewmodel'

export interface JobEquipmentData {
  machineId: string
  jobType: JobType | ''
  notes: string
  bagId: string
  scopeDetail: string
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

interface JobEquipmentFieldsProps {
  value: JobEquipmentData
  onChange: Dispatch<SetStateAction<JobEquipmentData>>
  machines: MachineOption[]
  bags?: BagOption[]
  errors?: Record<string, string>
}

const JOB_TYPE_OPTIONS = Object.entries(JOB_TYPE_LABELS) as [JobType, string][]

/**
 * Bloco "Equipamentos" — reaproveitado pelo `JobStepper` (criação) e pelo
 * `JobEditTabs` (edição). Sub-plano 04, item 3: renomeado de "Máquina" pra
 * "Equipamentos", sem o campo "Descrição" (removido do modelo), com os 10
 * tipos de serviço novos.
 */
export function JobEquipmentFields({
  value,
  onChange,
  machines,
  bags = [],
  errors = {},
}: JobEquipmentFieldsProps) {
  const { machineTools, machineToolsLoading, fetchMachineTools } = useToolStore()

  useEffect(() => {
    if (value.machineId) {
      fetchMachineTools(value.machineId)
    }
  }, [value.machineId, fetchMachineTools])

  return (
    <div className="flex flex-col gap-3">
      <fieldset className="fieldset gap-1">
        <label className="label text-xs font-medium text-base-content/60" htmlFor="machineId">
          Equipamento
        </label>
        <select
          id="machineId"
          className={`select select-bordered w-full ${errors.machineId ? 'select-error' : ''}`}
          value={value.machineId}
          onChange={(e) => onChange((p) => ({ ...p, machineId: e.target.value }))}
        >
          <option value="">Selecione...</option>
          {machines.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
        {errors.machineId && (
          <p data-testid="error-machineId" className="text-error text-xs">
            {errors.machineId}
          </p>
        )}
      </fieldset>

      {value.machineId && (
        <MachineToolsPreview machineTools={machineTools} loading={machineToolsLoading} />
      )}

      <fieldset className="fieldset gap-1">
        <label className="label text-xs font-medium text-base-content/60" htmlFor="jobType">
          Tipo de OS
        </label>
        <select
          id="jobType"
          className={`select select-bordered w-full ${errors.jobType ? 'select-error' : ''}`}
          value={value.jobType}
          onChange={(e) => onChange((p) => ({ ...p, jobType: e.target.value as JobType | '' }))}
        >
          <option value="">Selecione...</option>
          {JOB_TYPE_OPTIONS.map(([slug, label]) => (
            <option key={slug} value={slug}>
              {label}
            </option>
          ))}
        </select>
        {errors.jobType && (
          <p data-testid="error-jobType" className="text-error text-xs">
            {errors.jobType}
          </p>
        )}
      </fieldset>

      <fieldset className="fieldset gap-1">
        <label className="label text-xs font-medium text-base-content/60" htmlFor="bagId">
          Mala <span className="text-base-content/30">(opcional)</span>
        </label>
        <select
          id="bagId"
          className="select select-bordered w-full"
          value={value.bagId}
          onChange={(e) => onChange((p) => ({ ...p, bagId: e.target.value }))}
        >
          <option value="">Selecione...</option>
          {bags.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name} — {b.model}
            </option>
          ))}
        </select>
      </fieldset>

      <fieldset className="fieldset gap-1">
        <label className="label text-xs font-medium text-base-content/60" htmlFor="scopeDetail">
          Detalhamento do escopo <span className="text-base-content/30">(opcional)</span>
        </label>
        <textarea
          id="scopeDetail"
          className="textarea textarea-bordered w-full"
          rows={2}
          value={value.scopeDetail}
          onChange={(e) => onChange((p) => ({ ...p, scopeDetail: e.target.value }))}
        />
      </fieldset>

      <fieldset className="fieldset gap-1">
        <label className="label text-xs font-medium text-base-content/60" htmlFor="notes">
          Observações <span className="text-base-content/30">(opcional)</span>
        </label>
        <textarea
          id="notes"
          className="textarea textarea-bordered w-full"
          rows={2}
          value={value.notes}
          onChange={(e) => onChange((p) => ({ ...p, notes: e.target.value }))}
        />
      </fieldset>
    </div>
  )
}

interface MachineToolsPreviewProps {
  machineTools: MachineTool[]
  loading: boolean
}

function MachineToolsPreview({ machineTools, loading }: MachineToolsPreviewProps) {
  if (loading) {
    return (
      <div data-testid="machine-tools-loading" className="flex justify-center py-4">
        <span className="loading loading-spinner loading-sm" />
      </div>
    )
  }

  if (machineTools.length === 0) return null

  const insufficientCount = machineTools.filter(
    (mt) => mt.tool.quantity < mt.quantityRequired
  ).length

  return (
    <div data-testid="machine-tools-section" className="flex flex-col gap-2">
      {insufficientCount > 0 && (
        <div data-testid="machine-tools-warning" className="alert alert-warning text-sm">
          ⚠️ {insufficientCount} ferramenta(s) com quantidade insuficiente — o trabalho pode ser
          criado mesmo assim
        </div>
      )}
      <p className="text-xs font-medium text-base-content/60">Ferramentas necessárias</p>
      <ul className="flex flex-col gap-1">
        {machineTools.map((mt) => {
          const insufficient = mt.tool.quantity < mt.quantityRequired
          return (
            <li key={mt.id} className="flex items-center gap-2 text-sm">
              <span>{mt.tool.name}</span>
              <span className="text-base-content/50">×{mt.quantityRequired}</span>
              {insufficient && (
                <span
                  data-testid={`badge-insufficient-${mt.id}`}
                  className="badge badge-warning badge-sm"
                >
                  Estoque insuficiente
                </span>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
