import type { CalendarEntry } from '@/models/schedule.model'
import { EVENT_TYPE_ICONS, EVENT_TYPE_LABELS, JOB_COLOR, JOB_ICON } from '@/models/schedule.model'
import { jobTypeLabel } from '@/models/job.model'
import { getEmployeeColor, resolveEmployeeColor } from '@/utils/employee-color'
import { EmployeeAvatar } from '@/views/components/EmployeeAvatar'
import type { LucideIcon } from 'lucide-react'

interface Props {
  entry: CalendarEntry
  /** Índice id→cor real do funcionário (ver `buildEmployeeColorIndex`). */
  employeeColors: Map<string, string>
}

const MAX_STACKED_AVATARS = 3

interface ChipAvatar {
  id: string
  name: string
  photoUrl: string | null
  color: string | null
}

/**
 * Um único padrão visual pra qualquer entrada do calendário (OS ou evento):
 * avatar(es) empilhado(s) — cor sempre do funcionário — + ícone do tipo +
 * texto, com badge "+N" quando há mais de um colaborador. Antes OS e evento
 * usavam markup e composição diferentes (só OS tinha avatar), o que ficava
 * visualmente inconsistente lado a lado — feedback do usuário.
 */
export function EventChip({ entry, employeeColors }: Props) {
  let color: string
  let Icon: LucideIcon
  let label: string
  let title: string
  let avatars: ChipAvatar[]
  let extraCount: number
  let isMultiDay = false

  if (entry.kind === 'job') {
    const { jobType, city, state, clientName, scheduledDate, scheduledEndDate, employees } =
      entry.data
    // Passo 2 (sub-plano 06): fonte única de verdade — o primeiro colaborador de
    // `employees[]` dá tanto a cor quanto o nome exibido, então nunca divergem
    // (o bug antigo comparava `employeeIds[0]` com `employeeName`, que podiam
    // ser pessoas diferentes).
    const primary = employees[0]
    isMultiDay = !!scheduledEndDate && scheduledEndDate > scheduledDate
    color = primary ? getEmployeeColor(primary) : JOB_COLOR
    Icon = JOB_ICON
    avatars = employees
    extraCount = employees.length - 1
    // Feedback do usuário: no chip, prioriza Empresa/Cidade — quem está
    // fazendo já é identificado pelo avatar + cor, não precisa repetir o
    // nome no texto. Tipo e colaborador(es) continuam completos no title
    // (tooltip).
    const displayName = primary?.name ?? '—'
    // OS criadas via aceite de PC nascem sem local preenchido — sem o
    // `?? ''`, city/state ausentes viram a string "null" no texto (bug real
    // encontrado ao validar contra dados de verdade, não pego pelos testes
    // com mock).
    const location = `${city ?? ''}/${state ?? ''}`
    label = `${clientName || jobTypeLabel(jobType)} · ${location}`
    const titleParts = [`${jobTypeLabel(jobType)} · ${location} — ${displayName}`]
    if (extraCount > 0) titleParts.push(`(+${extraCount} colaborador(es))`)
    if (isMultiDay) titleParts.push(`(${scheduledDate} a ${scheduledEndDate})`)
    title = titleParts.join(' ')
  } else {
    const { type, employeeIds, employeeNames } = entry.data
    const typeLabel = EVENT_TYPE_LABELS[type]
    Icon = EVENT_TYPE_ICONS[type]
    const primaryId = employeeIds[0]
    color = primaryId ? resolveEmployeeColor(primaryId, employeeColors) : JOB_COLOR
    avatars = employeeIds.map((id, i) => ({
      id,
      name: employeeNames[i] ?? '—',
      photoUrl: null,
      color: employeeColors.get(id) ?? null,
    }))
    extraCount = avatars.length - 1
    const names = employeeNames.join(', ')
    // Mesmo padrão do chip de OS: mostra quem é, não só o tipo — a cor
    // sozinha deixou de bastar pra identificar a pessoa (feedback do usuário).
    label = names ? `${typeLabel} — ${names}` : typeLabel
    title = label
  }

  const stackedAvatars = avatars.slice(0, MAX_STACKED_AVATARS)

  return (
    <span
      className="flex items-center gap-1 rounded px-1 py-0.5 text-[10px] text-white leading-tight"
      style={{ backgroundColor: color }}
      title={title}
    >
      {stackedAvatars.length > 0 && (
        <span className="flex items-center flex-shrink-0 -space-x-1.5">
          {stackedAvatars.map((emp) => (
            <span key={emp.id} className="rounded-full ring-1 ring-white/80">
              <EmployeeAvatar name={emp.name} photoUrl={emp.photoUrl} color={emp.color} size="sm" />
            </span>
          ))}
        </span>
      )}
      <Icon size={11} className="flex-shrink-0" aria-hidden="true" />
      <span className="truncate">
        {isMultiDay && (
          <span className="mr-0.5" aria-hidden="true">
            ⋯
          </span>
        )}
        {label}
      </span>
      {extraCount > 0 && (
        <span
          className="ml-auto flex-shrink-0 inline-block rounded-full bg-white/80 px-1 text-[9px] font-semibold leading-none"
          style={{ color }}
        >
          +{extraCount}
        </span>
      )}
    </span>
  )
}
