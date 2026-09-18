import type { Dispatch, SetStateAction } from 'react'

export interface JobCollaboratorsData {
  scheduledDate: string
  scheduledEndDate: string
  employeeIds: string[]
}

interface EmployeeOption {
  id: string
  name: string
}

interface JobCollaboratorsFieldsProps {
  value: JobCollaboratorsData
  onChange: Dispatch<SetStateAction<JobCollaboratorsData>>
  employees: EmployeeOption[]
  errors?: Record<string, string>
}

/**
 * Bloco "Colaboradores" — reaproveitado pelo `JobStepper` (criação) e pelo
 * `JobEditTabs` (edição). Sub-plano 04, item 3/4: só existe UM jeito de
 * atribuir colaboradores à OS (checkboxes multi-seleção, `employeeIds`,
 * fonte de verdade) — o select duplicado de funcionário único foi removido.
 */
export function JobCollaboratorsFields({
  value,
  onChange,
  employees,
  errors = {},
}: JobCollaboratorsFieldsProps) {
  function toggleEmployee(id: string) {
    onChange((p) => ({
      ...p,
      employeeIds: p.employeeIds.includes(id)
        ? p.employeeIds.filter((e) => e !== id)
        : [...p.employeeIds, id],
    }))
  }

  return (
    <div className="flex flex-col gap-3">
      <fieldset className="fieldset gap-1">
        <label className="label text-xs font-medium text-base-content/60" htmlFor="scheduledDate">
          Data
        </label>
        <input
          id="scheduledDate"
          type="date"
          className={`input input-bordered w-full ${errors.scheduledDate ? 'input-error' : ''}`}
          value={value.scheduledDate}
          onChange={(e) => onChange((p) => ({ ...p, scheduledDate: e.target.value }))}
        />
        {errors.scheduledDate && (
          <p data-testid="error-scheduledDate" className="text-error text-xs">
            {errors.scheduledDate}
          </p>
        )}
      </fieldset>

      <fieldset className="fieldset gap-1">
        <label
          className="label text-xs font-medium text-base-content/60"
          htmlFor="scheduledEndDate"
        >
          Data final <span className="text-base-content/30">(opcional)</span>
        </label>
        <input
          id="scheduledEndDate"
          type="date"
          className={`input input-bordered w-full ${errors.scheduledEndDate ? 'input-error' : ''}`}
          value={value.scheduledEndDate}
          onChange={(e) => onChange((p) => ({ ...p, scheduledEndDate: e.target.value }))}
        />
        <p className="text-xs text-base-content/40 mt-1">
          Deixe em branco se o serviço for de um dia só.
        </p>
        {errors.scheduledEndDate && (
          <p data-testid="error-scheduledEndDate" className="text-error text-xs">
            {errors.scheduledEndDate}
          </p>
        )}
      </fieldset>

      <fieldset className="fieldset gap-1">
        <legend className="label text-xs font-medium text-base-content/60">Colaboradores</legend>
        <div className="flex flex-wrap gap-2 border border-base-300 rounded-lg p-3">
          {employees.length === 0 && (
            <span className="text-xs text-base-content/40">Nenhum colaborador cadastrado.</span>
          )}
          {employees.map((e) => {
            const checked = value.employeeIds.includes(e.id)
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
        {errors.employeeIds && (
          <p data-testid="error-employeeIds" className="text-error text-xs">
            {errors.employeeIds}
          </p>
        )}
      </fieldset>
    </div>
  )
}
