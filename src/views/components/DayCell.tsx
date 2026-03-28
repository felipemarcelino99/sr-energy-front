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
      tabIndex={0}
      onClick={() => onClick(date)}
      onKeyDown={(e) => e.key === 'Enter' && onClick(date)}
      className={[
        'min-h-[70px] rounded-md p-1 cursor-pointer transition-colors',
        isCurrentMonth ? 'bg-base-200' : 'bg-base-200 opacity-30 pointer-events-none',
        isSelected ? 'ring-2 ring-primary' : '',
      ].join(' ')}
    >
      <div className={`text-[11px] mb-1 font-semibold ${isToday ? 'text-primary' : 'text-base-content/50'}`}>
        {dayNumber}{isToday ? ' ●' : ''}
      </div>
      <div className="flex flex-col gap-0.5">
        {entries.slice(0, 3).map((entry, i) => (
          <EventChip key={i} entry={entry} />
        ))}
        {entries.length > 3 && (
          <span className="text-[9px] text-base-content/40">+{entries.length - 3} mais</span>
        )}
      </div>
    </div>
  )
}
