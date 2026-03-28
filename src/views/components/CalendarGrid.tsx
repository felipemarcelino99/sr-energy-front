import type { CalendarEntry } from '@/models/schedule.model'
import { DayCell } from './DayCell'

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

interface Props {
  year: number
  month: number // 1-based
  groupedEntries: Map<string, CalendarEntry[]>
  selectedDate: string | null
  onSelectDate: (date: string) => void
}

export function CalendarGrid({ year, month, groupedEntries, selectedDate, onSelectDate }: Props) {
  const today = new Date().toISOString().slice(0, 10)
  const firstDay = new Date(year, month - 1, 1).getDay()
  const daysInMonth = new Date(year, month, 0).getDate()

  const cells: Array<{ date: string; day: number; isCurrentMonth: boolean }> = []

  for (let i = 0; i < firstDay; i++) {
    const d = new Date(year, month - 1, -firstDay + 1 + i)
    cells.push({ date: d.toISOString().slice(0, 10), day: d.getDate(), isCurrentMonth: false })
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const date = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    cells.push({ date, day: d, isCurrentMonth: true })
  }

  const remainder = cells.length % 7
  if (remainder !== 0) {
    for (let i = 1; i <= 7 - remainder; i++) {
      const d = new Date(year, month, i)
      cells.push({ date: d.toISOString().slice(0, 10), day: d.getDate(), isCurrentMonth: false })
    }
  }

  return (
    <div>
      <div className="grid grid-cols-7 gap-1 mb-1 text-center text-[11px] text-base-content/40 font-semibold">
        {WEEKDAYS.map((w) => <span key={w}>{w}</span>)}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map(({ date, day, isCurrentMonth }) => (
          <DayCell
            key={date}
            date={date}
            dayNumber={day}
            isToday={date === today}
            isCurrentMonth={isCurrentMonth}
            isSelected={date === selectedDate}
            entries={groupedEntries.get(date) ?? []}
            onClick={onSelectDate}
          />
        ))}
      </div>
    </div>
  )
}
