import type { CalendarEntry } from '@/models/schedule.model'
import { EventChip } from './EventChip'

interface Props {
  date: string
  dayNumber: number
  isToday: boolean
  isCurrentMonth: boolean
  isSelected: boolean
  entries: CalendarEntry[]
  employeeColors: Map<string, string>
  onClick: (date: string) => void
  onDoubleClick?: (date?: string | null) => void
}

export function DayCell({
  date,
  dayNumber,
  isToday,
  isCurrentMonth,
  isSelected,
  entries,
  employeeColors,
  onClick,
  onDoubleClick,
}: Props) {
  return (
    <div
      role="button"
      aria-label={`Selecionar dia ${dayNumber}`}
      tabIndex={isCurrentMonth ? 0 : -1}
      onClick={() => onClick(date)}
      onDoubleClick={() => onDoubleClick?.(date)}
      onKeyDown={(e) => e.key === 'Enter' && onClick(date)}
      className={[
        // Passo 4: sem overflow/altura fixa — a célula cresce com o conteúdo
        // (o grid pai usa `grid-auto-rows: minmax(<min>, auto)`, então a
        // linha inteira da semana cresce junto quando um dia tem muitas OS).
        'h-full flex flex-col rounded-md p-1 cursor-pointer transition-colors',
        isCurrentMonth
          ? isToday
            ? 'bg-primary/10 ring-2 ring-primary'
            : 'bg-base-200'
          : 'bg-base-200 opacity-30 pointer-events-none',
        isSelected && !isToday ? 'ring-2 ring-primary' : '',
      ].join(' ')}
    >
      <div
        className={`text-[11px] mb-1 font-bold flex-shrink-0 ${isToday ? 'text-primary' : 'text-base-content/50'}`}
      >
        {dayNumber}
        {isToday ? ' ●' : ''}
      </div>
      <div className="flex flex-col gap-0.5">
        {entries.map((entry) => (
          <EventChip
            key={entry.kind + '-' + entry.data.id}
            entry={entry}
            employeeColors={employeeColors}
          />
        ))}
      </div>
    </div>
  )
}
