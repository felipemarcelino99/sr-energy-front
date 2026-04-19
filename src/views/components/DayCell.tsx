import type { CalendarEntry } from '@/models/schedule.model'
import { EventChip } from './EventChip'

interface Props {
  date: string
  dayNumber: number
  isToday: boolean
  isCurrentMonth: boolean
  isSelected: boolean
  entries: CalendarEntry[]
  onClick: (date: string) => void
}

export function DayCell({ date, dayNumber, isToday, isCurrentMonth, isSelected, entries, onClick }: Props) {
  return (
    <div
      role="button"
      aria-label={`Selecionar dia ${dayNumber}`}
      tabIndex={isCurrentMonth ? 0 : -1}
      onClick={() => onClick(date)}
      onKeyDown={(e) => e.key === 'Enter' && onClick(date)}
      className={[
        'min-h-[70px] rounded-md p-1 cursor-pointer transition-colors',
        isCurrentMonth
          ? isToday
            ? 'bg-primary/10 ring-2 ring-primary'
            : 'bg-base-200'
          : 'bg-base-200 opacity-30 pointer-events-none',
        isSelected && !isToday ? 'ring-2 ring-primary' : '',
      ].join(' ')}
    >
      <div className={`text-[11px] mb-1 font-bold ${isToday ? 'text-primary' : 'text-base-content/50'}`}>
        {dayNumber}{isToday ? ' ●' : ''}
      </div>
      <div className="flex flex-col gap-0.5">
        {entries.slice(0, 3).map((entry) => (
          <EventChip key={entry.kind + '-' + entry.data.id} entry={entry} />
        ))}
        {entries.length > 3 && (
          <span className="text-[9px] text-base-content/40">+{entries.length - 3} mais</span>
        )}
      </div>
    </div>
  )
}
