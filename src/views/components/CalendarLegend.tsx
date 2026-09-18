import { EVENT_TYPE_ICONS, EVENT_TYPE_LABELS, JOB_ICON } from '@/models/schedule.model'
import type { CalendarJobEmployee, ScheduleEventType } from '@/models/schedule.model'
import { getEmployeeColor } from '@/utils/employee-color'

const EVENT_TYPES: ScheduleEventType[] = ['day_off', 'vacation', 'training', 'medical_leave']

interface Props {
  /**
   * Colaboradores com OS no intervalo visível (ver
   * `uniqueEmployeesFromJobs` em schedule.viewmodel.ts). Passo 2: a legenda
   * reflete quem está de fato agendado no período — não a lista completa de
   * funcionários (que exigiria `loadEmployees()`, indisponível em modo
   * `readOnly`).
   */
  employees: CalendarJobEmployee[]
}

export function CalendarLegend({ employees }: Props) {
  return (
    <div className="flex flex-wrap gap-4 mb-3 text-[11px]">
      {/* A cor identifica o funcionário (ver legenda à direita), não o tipo
          — então o tipo é identificado por ícone aqui, não por cor
          (feedback do usuário: cor sempre do funcionário, independente do
          tipo). */}
      <span className="flex items-center gap-1.5 text-base-content/70">
        <JOB_ICON size={15} className="text-base-content/50" aria-hidden="true" />
        OS
      </span>
      {EVENT_TYPES.map((type) => {
        const Icon = EVENT_TYPE_ICONS[type]
        return (
          <span key={type} className="flex items-center gap-1.5 text-base-content/70">
            <Icon size={15} className="text-base-content/50" aria-hidden="true" />
            {EVENT_TYPE_LABELS[type]}
          </span>
        )
      })}
      {employees.length > 0 && (
        <span className="flex flex-wrap items-center gap-3 border-l pl-4">
          {employees.map((employee) => (
            <span key={employee.id} className="flex items-center gap-1.5">
              <span
                className="w-2.5 h-2.5 rounded-full inline-block"
                style={{ backgroundColor: getEmployeeColor(employee) }}
              />
              {employee.name}
            </span>
          ))}
        </span>
      )}
    </div>
  )
}
